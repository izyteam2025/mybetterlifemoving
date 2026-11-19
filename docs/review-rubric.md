# Independent review rubric

Every page or post the monthly growth cycle writes is reviewed before its pull request opens. The reviewer is a separate agent that did not write the page and has not seen the writer's reasoning. It gets this file, the page's copy file, its brief, the client's files (`docs/`, `content/client-input/`, `content/site.json`) and the brief's top 3 competing URLs. It never gets the writer's notes or summary.

The reviewer writes `docs/growth/reviews/YYYY-MM/<slug>.md` in the format at the end. The build refuses a scheduled page without a review whose last verdict line reads `Verdict: PASS`.

## Hard fails (any one fails the page)

1. **Untraceable fact.** A claim about the client (a service, brand, area, price, warranty, hours, process, team or number) does not trace to a client file or `content/client-input/`. List each claim with its source, or "no source".
2. **Invented local colour.** A landmark, distance, travel time, neighbourhood trait or "residents here..." line that the files don't support. Neighbourhood and ZIP names are fine only when they are listed in `docs/local-detail.md`.
3. **No first-hand substance.** Nothing on the page comes from this client's real work: a job, a problem their technicians see, a question customers ask them, their process, their photos. Generic advice any competitor could publish is a fail.
4. **Not better than what ranks.** Against the brief's top 3, the page misses a subtopic all three cover, or answers the searcher's main question less directly than the best of them.
5. **Template copy.** Sentences, H2s or the FAQ repeat another page of the same type with the place swapped, or the page reads as a city-swapped variant of a sibling.
6. **House rule broken.** An em dash, a banned or stock phrase, a personal name outside About and bylines, "authorized" on a brand page, a promise of a page that isn't live, a link to a scheduled page, or wrong locked wording (phone, warranty, offers).

## Scored (1 to 5 each; a 1 or 2 on any line fails, and the total must reach 20 of 25)

| Criterion | 5 looks like |
|---|---|
| Answers the search | The first screen answers what the searcher typed; the FAQ answers the brief's People Also Ask questions in one or two direct sentences |
| Depth against the top 3 | Covers what they cover, plus at least one useful thing none of them has (from the client's experience) |
| Voice | Reads like the owner talking: varied sentence length and openings, no pet words, no slogans posing as sentences, no forced lists of three |
| Local and specific | Details true to this city and this client, not interchangeable with a sibling page |
| Conversion | A clear next step that matches the intent: book, call, or the offer, without pressure copy |

## What the reviewer does not do

- Rewrite the page. It reports, and the writer fixes.
- Accept "the brief said so" as a source. The brief is a plan, not a fact file.
- Fill in `factCheck`. Only a person does that, after the pull request.

## Review file format

```
# Review: <page path>

Reviewer: independent agent, YYYY-MM-DD
Brief: docs/growth/briefs/YYYY-MM/<slug>.md
Top 3 compared: <url>, <url>, <url>

## Facts
| Claim | Source |
|---|---|

## Hard fails
- none | <rule number>: <what and where>

## Scores
| Criterion | Score | Note |
|---|---|---|
Total: NN/25

## Fixes needed
- ...

Verdict: PASS | FAIL
```

After a FAIL, the writer fixes the page once and the reviewer reviews it again, adding a new section below the first. If the second review fails, the page is dropped from the month and goes into the growth log as "dropped, with the reason".
