#!/usr/bin/env python3
"""Turn daily or long-format marketing data into the weekly CSV `mmm fit` reads.

Inputs (dates as YYYY-MM-DD):
  --wide daily.csv                   date,sales,<channel>,<channel>,...  (daily or weekly)
  --sales sales.csv --spend spend.csv   sales: date,sales   spend: date,channel,spend
  --check history.csv                already weekly (any week labels): validate only, no output

Days are summed into ISO weeks (Monday start). Partial first/last weeks are dropped.
Then the weekly table is checked: gaps, negatives, constant channels, enough weeks.

Examples:
  python3 prepare_data.py --check history.csv
  python3 prepare_data.py --wide daily.csv --out history.csv
  python3 prepare_data.py --sales sales.csv --spend spend.csv --target revenue --out history.csv
"""

import argparse
import csv
import sys
from collections import defaultdict
from datetime import date, timedelta


def parse_date(text, where):
    try:
        return date.fromisoformat(text.strip())
    except ValueError:
        sys.exit(f"{where}: '{text}' is not a YYYY-MM-DD date")


def parse_number(text, where):
    try:
        return float(text.strip().replace(",", "")) if text.strip() else 0.0
    except ValueError:
        sys.exit(f"{where}: '{text}' is not a number")


def week_start(d):
    return d - timedelta(days=d.weekday())


def read_wide(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    header = [h.strip() for h in rows[0]]
    if len(header) < 3:
        sys.exit(f"{path}: need date, target and at least one channel column")
    days = {}
    for n, row in enumerate(rows[1:], start=2):
        if not any(cell.strip() for cell in row):
            continue
        d = parse_date(row[0], f"{path}:{n}")
        days[d] = {header[i]: parse_number(row[i], f"{path}:{n} column {header[i]}") for i in range(1, len(header))}
    return header[1:], days


def read_long(sales_path, spend_path, target):
    days = defaultdict(dict)
    with open(sales_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        value_col = next((c for c in reader.fieldnames if c.strip().lower() != "date"), None)
        for n, row in enumerate(reader, start=2):
            d = parse_date(row["date"], f"{sales_path}:{n}")
            days[d][target] = parse_number(row[value_col], f"{sales_path}:{n}")
    channels = set()
    with open(spend_path, newline="", encoding="utf-8-sig") as f:
        for n, row in enumerate(csv.DictReader(f), start=2):
            d = parse_date(row["date"], f"{spend_path}:{n}")
            ch = row["channel"].strip()
            channels.add(ch)
            days[d][ch] = days[d].get(ch, 0.0) + parse_number(row["spend"], f"{spend_path}:{n}")
    return [target, *sorted(channels)], days


def to_weeks(columns, days):
    span = sorted(days)
    daily = len(span) > 1 and min((b - a).days for a, b in zip(span, span[1:])) == 1
    weeks = defaultdict(lambda: defaultdict(float))
    counts = defaultdict(int)
    for d, values in days.items():
        w = week_start(d) if daily else d
        counts[w] += 1
        for c in columns:
            weeks[w][c] += values.get(c, 0.0)
    ordered = sorted(weeks)
    if daily:
        dropped = [w for w in (ordered[0], ordered[-1]) if counts[w] < 7]
        for w in dropped:
            print(f"dropped partial week starting {w} ({counts[w]} days)", file=sys.stderr)
        ordered = [w for w in ordered if w not in dropped]
    return ordered, weeks, daily


def pearson(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    sab = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    saa = sum((x - ma) ** 2 for x in a)
    sbb = sum((y - mb) ** 2 for y in b)
    return sab / (saa * sbb) ** 0.5 if saa > 0 and sbb > 0 else 0.0


def check(columns, ordered, weeks, daily, dated=True):
    target, channels = columns[0], columns[1:]
    errors, warnings = [], []
    if dated and len(ordered) > 1:
        step = 7 if daily else min((b - a).days for a, b in zip(ordered, ordered[1:]))
        for a, b in zip(ordered, ordered[1:]):
            if (b - a).days != step:
                errors.append(f"gap between {a} and {b}")
    for c in channels:
        values = [weeks[w][c] for w in ordered]
        if min(values) < 0:
            errors.append(f"{c}: negative spend")
        if max(values) == min(values):
            errors.append(f"{c}: constant spend; the model cannot measure it (drop or merge it)")
        elif sum(v > 0 for v in values) < len(values) * 0.1:
            warnings.append(f"{c}: active in under 10% of weeks; its estimate will be weak")
    series = {c: [weeks[w][c] for w in ordered] for c in channels}
    for i, a in enumerate(channels):
        for b in channels[i + 1:]:
            r = pearson(series[a], series[b])
            if abs(r) >= 0.98:
                errors.append(f"{a} and {b}: spend moves together (r = {r:.2f}); the model cannot tell them apart. Merge them or drop one")
            elif abs(r) >= 0.90:
                warnings.append(f"{a} and {b}: spend strongly correlated (r = {r:.2f}); their split of credit will be uncertain")
    total = sum(weeks[w][c] for w in ordered for c in channels)
    for c in channels:
        share = sum(weeks[w][c] for w in ordered) / total if total else 0
        if share < 0.05:
            warnings.append(f"{c}: {share:.1%} of spend; consider merging small channels into 'other'")
    needed = 2 * (7 + len(channels)) + 13
    if len(ordered) < needed:
        errors.append(f"{len(ordered)} weeks; {len(channels)} channels need at least {needed}")
    elif len(ordered) < 104:
        warnings.append(f"{len(ordered)} weeks; 104+ (two seasonal cycles) recommended")
    if any(weeks[w][target] <= 0 for w in ordered):
        warnings.append(f"{target}: zero or negative weeks; MAPE will be unreliable")
    return errors, warnings


def read_weekly(path, target):
    """A weekly CSV as `mmm fit` reads it: labels in column 1, numbers elsewhere."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = [r for r in csv.reader(f) if any(cell.strip() for cell in r)]
    header = [h.strip() for h in rows[0]]
    if target not in header[1:]:
        sys.exit(f"{path}: no '{target}' column; use --target")
    columns = [target, *[h for h in header[1:] if h != target]]
    ordered, weeks = [], {}
    for n, row in enumerate(rows[1:], start=2):
        label = (n, row[0].strip())
        ordered.append(label)
        weeks[label] = {h: parse_number(row[i], f"{path}:{n} column {h}") for i, h in enumerate(header) if i > 0}
    return columns, ordered, weeks


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--wide", help="date,target,<channels> CSV (daily or weekly)")
    parser.add_argument("--sales", help="date,<value> CSV")
    parser.add_argument("--spend", help="date,channel,spend CSV")
    parser.add_argument("--target", default="sales", help="target column name (default: sales)")
    parser.add_argument("--check", help="validate an existing weekly CSV; writes nothing")
    parser.add_argument("--out")
    args = parser.parse_args()

    if args.check:
        columns, ordered, weeks = read_weekly(args.check, args.target)
        errors, warnings = check(columns, ordered, weeks, daily=False, dated=False)
        for w in warnings:
            print(f"warning: {w}", file=sys.stderr)
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        if errors:
            sys.exit(1)
        print(f"{args.check}: OK, {len(ordered)} weeks, {len(columns) - 1} channels", file=sys.stderr)
        return
    if not args.out:
        sys.exit("--out is required unless you use --check")
    if args.wide:
        columns, days = read_wide(args.wide)
        if columns[0] != args.target and args.target in columns:
            columns.remove(args.target)
            columns.insert(0, args.target)
        elif args.target not in columns:
            sys.exit(f"no '{args.target}' column; use --target")
        columns = [columns[0], *sorted(columns[1:])]
    elif args.sales and args.spend:
        columns, days = read_long(args.sales, args.spend, args.target)
    else:
        sys.exit("give --wide, or both --sales and --spend")

    ordered, weeks, daily = to_weeks(columns, days)
    errors, warnings = check(columns, ordered, weeks, daily)
    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    if errors:
        for e in errors:
            print(f"error: {e}", file=sys.stderr)
        sys.exit(1)

    with open(args.out, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["week", *columns])
        for w in ordered:
            writer.writerow([w.isoformat(), *(round(weeks[w][c], 2) for c in columns)])
    print(f"wrote {args.out}: {len(ordered)} weeks, {len(columns) - 1} channels", file=sys.stderr)


if __name__ == "__main__":
    main()
