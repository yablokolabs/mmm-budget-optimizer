#!/usr/bin/env bash
# End-to-end check of the skill: data prep round trip, fit, optimize, forecast,
# report, and plan quality on data with known answers.
# Usage: MMM=/path/to/mmm tests/test_skill.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
skill="$root/skills/mmm-budget-optimizer"
MMM="${MMM:-$HOME/.local/share/mmm-engine/build/mmm}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"

echo "1. prepare_data.py: daily wide and long formats rebuild the weekly table"
python3 - "$skill/examples/history.csv" <<'PY'
import csv, sys
from datetime import date, timedelta
rows = list(csv.reader(open(sys.argv[1])))
hdr, start = rows[0], date(2023, 1, 2)
wide = csv.writer(open("daily.csv", "w", newline="")); wide.writerow(["date"] + hdr[1:])
sales = csv.writer(open("sales.csv", "w", newline="")); sales.writerow(["date", "sales"])
spend = csv.writer(open("spend.csv", "w", newline="")); spend.writerow(["date", "channel", "spend"])
for i, r in enumerate(rows[1:]):
    for d in range(7):
        day = (start + timedelta(days=7 * i + d)).isoformat()
        vals = [float(x) / 7 for x in r[1:]]
        wide.writerow([day] + [f"{v:.6f}" for v in vals])
        sales.writerow([day, f"{vals[0]:.6f}"])
        for ch, v in zip(hdr[2:], vals[1:]):
            spend.writerow([day, ch, f"{v:.6f}"])
PY
python3 "$skill/scripts/prepare_data.py" --wide daily.csv --out wide.csv
python3 "$skill/scripts/prepare_data.py" --sales sales.csv --spend spend.csv --out long.csv
python3 - "$skill/examples/history.csv" <<'PY'
import csv, sys
orig = list(csv.reader(open(sys.argv[1])))
for f in ("wide.csv", "long.csv"):
    rows = list(csv.reader(open(f)))
    idx = [orig[0].index(c) for c in rows[0][1:]]
    err = max(abs(float(r[j + 1]) - float(o[idx[j]])) for r, o in zip(rows[1:], orig[1:]) for j in range(len(idx)))
    assert len(rows) == len(orig) and err < 0.01, f"{f}: {len(rows)} rows, max diff {err}"
print("   round trip exact")
PY

echo "2. prepare_data.py rejects a constant channel"
printf 'date,sales,tv,radio\n' > bad.csv
for i in $(seq 1 9); do printf "2024-01-0%d,100,%d,5\n" "$i" "$i" >> bad.csv; done
if python3 "$skill/scripts/prepare_data.py" --wide bad.csv --out x.csv 2> err.txt; then
  echo "expected failure"; exit 1
fi
grep -q "radio: constant spend" err.txt && echo "   rejected with a clear error"

echo "3. fit, optimize, forecast, report"
cp "$skill/examples/"{truth.json,grade.py} .
"$MMM" fit --data long.csv --target sales --holdout 13 --output model.json
"$MMM" optimize --config model.json --bound 0.5 --output plan.json
"$MMM" forecast --config model.json --weeks 13 --plan plan.json --output forecast.json
python3 "$skill/scripts/report.py" model.json plan.json --forecast forecast.json --currency GBP > report.md
grep -q "Confidence: \*\*good\*\*" report.md
grep -q "Recommended weekly budget" report.md
echo "   report written"

echo "4. plan quality on the true curves"
python3 grade.py | tee grade.txt
captured=$(tail -1 grade.txt | sed -E 's/.*captures ([0-9]+)%.*/\1/')
[ "$captured" -ge 80 ] || { echo "plan captured only $captured%"; exit 1; }

echo "ALL PASSED"
