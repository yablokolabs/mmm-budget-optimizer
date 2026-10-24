# Method

## Model

Weekly sales:

$$y_t = g(t) + h(t) + \sum_i \beta_i \, \text{hill}(a_{i,t}) + \varepsilon_t$$

| Term | Formula | Meaning |
| --- | --- | --- |
| trend | $g(t) = t_0 + t_1 t + t_2 t^2$ | slow drift in baseline demand |
| seasonality | $h(t) = \sum_k a_k \cos\frac{2\pi k t}{52} + b_k \sin\frac{2\pi k t}{52}$ | yearly pattern, `--fourier` harmonics |
| adstock | $a_{i,t} = x_{i,t} + \lambda_i a_{i,t-1}$ | spend keeps working after the week it runs |
| saturation | $\text{hill}(a) = \frac{a^p}{\alpha^p + a^p}$ | diminishing returns; $p > 1$ gives an S-curve |
| effect | $\beta_i \ge 0$ | sales at full saturation |

## Fit

1. Hold out the last 13 weeks.
2. Start every channel at $\lambda = 0.3$, $p = 1.5$, $\alpha$ = median adstocked spend.
3. For each channel in turn, try every $(\lambda, \alpha, p)$ on a grid:
   - $\lambda \in \{0, 0.1, \dots, 0.8\}$
   - $\alpha \in \{0.3, 0.5, 0.75, 1, 1.5, 2, 3\} \times$ median adstocked spend
   - $p \in \{1, 1.5, 2, 2.5, 3\}$
4. For each candidate, solve trend, seasonality and all $\beta$ by least squares; drop any channel with $\beta < 0$ and re-solve.
5. Keep the candidate with the lowest training error. Repeat passes until nothing changes.
6. Score on the 13 held-out weeks.
7. Refit the linear terms on all weeks for the final model.

- Deterministic: same data, same model, every run
- ~40 ms for 3 channels × 156 weeks

## Optimize

Steady-state weekly response at constant spend $x$: $r_i(x) = \beta_i \, \text{hill}\left(\frac{x}{1 - \lambda_i}\right)$

Maximise $\sum_i r_i(x_i)$ subject to:
- $\sum_i x_i = B$ (weekly budget)
- $(1 - b)\, x_i^{now} \le x_i \le (1 + b)\, x_i^{now}$ (default $b = 0.5$)

Solver:
1. Greedy: hand out the budget in 4,000 steps, each to the channel with the largest gain
2. Pairwise exchange: move budget between channel pairs while total response rises, shrinking the step

Checked against brute force in the test suite: within 0.1%.

## Accuracy on data with known answers

10 synthetic datasets, 3 channels, 156 weeks (`examples/`):

| Measure | Result |
| --- | --- |
| Holdout MAPE | 0.4%–0.9% |
| Marginal ROI at current spend | 11% average error, 41% worst |
| Plan quality on the **true** curves | 92%–100% of best lift on 9 of 10; 63% on 1 |

## Limits

- Correlational. Confounders (price, promotions, competitors, distribution) are not modelled; their effect lands in baseline or in channels that move with them.
- Always-on channels: total contribution partly confounded with baseline. Marginal ROI is more reliable.
- No uncertainty intervals.
- No lagged peak (adstock peaks in the spend week).
- No channel interactions.
- Weekly data only.
