# Learning and scheduling logic

All of this is deterministic code in `src/engine`, covered by `src/engine/engine.test.ts`. No LLM is involved.

## Spaced repetition (`srs.ts`)

This is an SM-2-family scheduler. Each review takes **correctness** and **confidence** (1 guessing, 2 unsure, 3 sure) and maps them to a quality score:

| | Sure | Unsure | Guessing |
|---|---|---|---|
| Correct | 5 | 4 | 3 |
| Wrong | 0 | 1 | 2 |

How the score is used:

- **Lapses.** A confident error scores lowest, so it is the most urgent item to review. Any quality below 3 is a lapse: repetitions reset, the item is due tomorrow, and ease drops.
- **Interval growth.** Intervals go 1 day, then 3 days, then the previous interval × ease. Ease starts at 2.5 and is clamped to 1.3–2.8.
- **Correct guesses.** A correct guess (quality 3) shortens the new interval to 60%, because a lucky guess isn't solid recall.
- **Early reviews.** An item reviewed before it is due only earns credit for the time that actually passed. Answering the same item five times on one day cannot push it weeks ahead. A test checks this.
- **Cards.** Retrieval cards enter the schedule the day after their lesson is finished. They are rated "Missed", "Partly" or "Had it", which map to wrong/unsure, correct/guessing and correct/sure.

## Evidence streams (`readiness.ts`)

Attempts are stored with `first` (the first time this learner ever saw the item) and `gapDays` (days since the previous attempt). The streams are kept separate:

| Stream | Definition | Used for |
|---|---|---|
| Lesson completion | Lesson finished | Planning only; never mastery |
| Unseen-question performance | First attempts | Readiness accuracy |
| Immediate practice | Repeats within a day | Shown, but excluded from readiness |
| Delayed retention | Repeats and cards after 1 day or more | Retention |
| Simulation reasoning | Decisions judged correct in the Virtual Lab | Shown separately |

Unanswered questions on a submitted exam count as wrong on that exam's score. They are not recorded as attempts, so they stay unseen and don't distort fresh accuracy.

## Readiness summary

- **Coverage:** the share of the 41 objectives with at least one fresh answer.
- **Fresh-question accuracy:** shown with a 95% Wilson interval and the sample size.
- **Retention:** delayed recall accuracy, with its interval.
- **Per-area table:** the same figures broken down by content area.

There is no pass probability and no scaled score. The text names the sample size and says plainly when it is too small.

## Mastery bands (heuristic, shown in the app)

| Band | Rule |
|---|---|
| **Secure** | At least 4 fresh answers with a Wilson lower bound of 60% or more, **and** at least 2 delayed recalls at 75% or better |
| **Developing** | At least 3 fresh or delayed answers at 60% or better |
| **Learning** | Any evidence below that |
| **No evidence yet** | No answers on the objective |

These bands haven't been validated against exam outcomes, and the app says so.

## Daily plan (`planner.ts`)

The plan is built once per local date and duration, then stored, so it resumes after a refresh. Changing the duration rebuilds it but keeps completed items. Items are added in this order, within the 10/20/45-minute budget:

1. **Due reviews.** Most overdue first, relative to the interval. Questions and cards share the queue, at about 0.75 minutes per item. Each review counts.
2. **Weakest objective** (20 and 45 minutes only). The score is Laplace-smoothed accuracy minus a penalty for misses in the last two weeks. The reason given names the miss count.
3. **New lesson.** The next lesson whose prerequisites are complete.
4. **Application.** A Virtual Lab simulation in 45-minute sessions; otherwise a two-question failed-run case.

Each item states why it was chosen. You can skip items or move the whole day to tomorrow, with no penalty. The streak is optional and forgives one rest day per week.

## Exam forms (`blueprint.ts`)

1. **Allocation.** Each content area starts from the midpoint of its range. The midpoints are normalized to the form length, rounded by largest remainder, then capped by pool size, with any shortfall redistributed within each area's maximum share.
2. **Selection.** Within each area, unseen questions come first, then a seeded shuffle.
3. **Integrity.** Ids are deduplicated, and a test checks that a form never repeats a question. The seed is stored, so option order and question order stay stable across refreshes.

A 100-question form from the current bank allocates FIX 20, PROC 15, EMB 19, STAIN 34, OPS 12, which is inside every ASCP range.

## Grading (`grading.ts`)

- **Choice questions** are graded by option id, so shuffling can't change the result.
- **Numeric questions** need the value within an absolute tolerance **and** an accepted unit; `mL`, `ml` and `milliliters` all count, and the unit can be typed with the number.
- **Feedback** tells you when the number is right but the unit is missing or wrong. Known wrong values, such as the water volume instead of the stock volume, get a specific explanation.
- **Calculator** parses expressions safely, without `eval`.

## XP and badges

XP is awarded only for first-attempt correct answers, finished lessons and simulation reasoning (once per simulation per day, scaled by correctness). It never feeds readiness.

Badges require demonstrated performance: for example, 10 or more fresh answers in an area at 80% or better, plus 3 delayed recalls. Badges unlock accent colours. No study content is ever gated.
