---
title: Threat Model Drift Reviews
---

The [threatcl/drift-action](https://github.com/threatcl/drift-action) reviews each pull request against your repository's threat model, and answers one question:

> Do the code changes in this PR require the threat model to evolve?

It posts a single sticky comment with evidence-backed findings, and updates that same comment as you push. It reviews threat model drift and nothing else, so it won't comment on bugs, style or test coverage.

Drift is not "the `.tm.hcl` file changed". It's divergence between what the code now does and what the model asserts, which is why the action reads the diff rather than watching a path.

:::note
This is the CI counterpart of the [claude-plugin](https://github.com/threatcl/claude-plugin)'s `/threat-drift` command, which does the same job locally against a git ref range. The action is also distinct from [threatcl-action](/cicd/github/), which runs deterministic steps like `validate` and `dashboard`. Most repos want both: `threatcl-action` to check the model is well-formed, this one to check the model still matches the code.
:::

## What it detects

| Category | Config name | Example |
|---|---|---|
| Stale assertions | `stale_assertion` | Model says "passwords hashed with BCrypt", the PR switches schemes |
| Phantom controls | `phantom_control` | A control claims `implemented = true`, the PR deleted the middleware |
| New unmodeled surface | `unmodeled_surface` | A new public endpoint with no corresponding threat |
| DFD drift | `dfd_drift` | A service starts calling a third-party API that's missing from the DFD |
| Dependency drift | `dependency_drift` | `go.mod` adds a crypto library with no `third_party_dependency` block |
| Unclassified data | `unclassified_data` | A new `ssn` field with no `information_asset` covering it |

Findings carry `file:line` evidence, along with a copy-paste agent prompt for updating the model. When there's no drift, the comment says so plainly.

## Quick start

```yaml title=".github/workflows/threat-drift.yml"
name: threat-drift
on:
  pull_request:

# One review in flight per PR. A push supersedes the run for the previous
# commit rather than racing it for the sticky comment.
concurrency:
  group: threat-drift-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: threatcl/drift-action@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

Without a config file the action finds your model on its own: a single `*.tm.hcl` at the repo root, or a single `*.hcl` under `threatmodels/` or `threatmodel/`.

The `concurrency` block matters more here than in most workflows. A review takes minutes of inference, so without it two rapid pushes race to update the same sticky comment, and the last writer wins, possibly with findings from the older commit.

### Pinning the version

`@v1` follows the latest v1.x release, which is what most repositories want. It's a moving alias though, force-moved onto each release, so the engine reviewing your pull requests can change without you editing anything. This job holds an LLM API key and a token that can write to pull requests, so where that matters, pin the commit SHA and let Dependabot bump it:

```yaml
- uses: threatcl/drift-action@<commit-sha> # v1.0.0
```

The action's own container image is pinned by digest rather than by tag, so a runner will accept exactly one immutable manifest for a given release.

## Trying it without posting

`dry-run` fetches the diff and renders the full review, then prints it to the log instead of writing to the pull request. It's the way to trial the action on real PRs before letting it comment:

```yaml
- uses: threatcl/drift-action@v1
  with:
    dry-run: true
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

A value that isn't a boolean is a hard error rather than a silent `false`, so a typo can't post a comment you thought you'd suppressed. Dry run suppresses writes only. It doesn't change the verdict or the exit code.

## Inputs

| Input | Default | Description |
|---|---|---|
| `config-path` | `.threatcl-ci.hcl` | Path to the drift config file |
| `anthropic-api-key` | none | Anthropic API key. Without a key, no drift category is assessed |
| `openai-api-key` | none | OpenAI API key, used when `llm.provider` is `openai` |
| `github-token` | `${{ github.token }}` | Reads the PR diff, writes the comment and check run |
| `fail-mode` | from config | `never` or `on-action-required` |
| `model` | from config | Override the LLM model |
| `dry-run` | `false` | Render and log the review without posting anything |

Both API key inputs are forwarded to the container, and the engine reads only the one its configured provider names. Switching provider is a config file change, not a workflow change, as long as the key is wired up.

## Outputs

| Output | Description |
|---|---|
| `findings-count` | Total drift findings |
| `action-required-count` | Findings at the Action required tier |
| `verdict` | `clean`, `findings`, `action-required`, `unassessed`, `skipped` or `error` |
| `report-path` | Path to the rendered markdown report, written under `RUNNER_TEMP` |

The verdict distinguishes silence from safety, which matters if you gate on it:

- `clean` means the model assessed the change and found it consistent.
- `unassessed` means nothing was assessed: no API key, no reviewable file, a diff over the cap, or a refused request.
- `skipped` means the run didn't apply at all, such as no pull request, or no threat model in the repo.
- `error` means the action itself failed.

## Configuration

The long tail lives in a repo-level `.threatcl-ci.hcl`. Every setting is optional.

```hcl title=".threatcl-ci.hcl"
# Which model to assess. Required only when the repo has more than one.
model_paths = ["threatmodels/payments.hcl"]

# Restrict the drift categories assessed. Omit to run all six.
categories = ["phantom_control", "stale_assertion", "dependency_drift"]

# Paths that must always be reviewed, even when a large diff is narrowed.
# A trailing slash matches by prefix; otherwise the pattern is matched with
# path.Match, and a bare filename matches wherever it sits in the tree.
trigger_paths = ["src/payments/", "cmd/*.go"]

# never (default) | on-action-required
fail_mode = "never"

llm {
  provider    = "anthropic"
  model       = "claude-opus-5"
  effort      = "high" # low | medium | high | xhigh | max
  max_tokens  = 32000  # covers thinking as well as the findings array
  api_key_env = "ANTHROPIC_API_KEY"
}

limits {
  max_diff_files    = 200    # hard cap on files sent to review
  max_patch_bytes   = 400000 # cap on the rendered diff
  max_context_bytes = 200000 # cap on whole files sent alongside it
  narrow_above      = 50
}
```

An unknown category, fail mode, effort level or provider is a hard error rather than a silent default, so a typo can't quietly disable a drift check.

`model` and `api_key_env` follow from `provider` when you don't set them, so selecting a provider is usually all you need:

```hcl
llm {
  provider = "openai"
}
```

`anthropic` defaults to `claude-opus-5` and `openai` to `gpt-5.6-sol`. Those are the models the action's finding-quality recordings were made against. Overriding `model` is supported and sometimes right, but forced-JSON support varies by model, so an unverified one can fail the run after the diff has already been fetched.

`max_tokens` bounds the model's output including its thinking. Set it too tight and the report is truncated mid-JSON, which the run reports as an error rather than rendering half a review.

## What gets reviewed

Two rules decide which changed files reach the review, and the comment always reports the outcome of both.

Documentation, lock files, images, and vendored or generated code are always skipped, since they can't carry threat model drift. Dependency manifests such as `go.mod` and `package.json` are never skipped, whatever else the rules say.

Everything else is reviewed. Only when a diff exceeds `narrow_above` files is it cut down to security-relevant paths to stay within budget, and the comment then says how many files went unreviewed. The default is to keep a file rather than drop it, because under-reviewing produces a clean-looking result that hides real drift.

If more than `max_diff_files` files still need review after filtering and narrowing, no review runs at all. The comment says the diff is too large and suggests running `/threat-drift` locally, the check run stays neutral, and the verdict is `unassessed`. The cap is deliberately all-or-nothing: reviewing the first 200 files of a 500-file diff would present partial coverage as a review.

## Security notes

- Use the `pull_request` trigger, as scaffolded above, not `pull_request_target`. Fork PRs then run without secrets, so no review is produced and the comment says so, rather than posting a shallow result that looks like a review and isn't.
- PR content is treated as data, never as instructions. The model's output is forced into a JSON schema, influences nothing but the report body, and findings without code evidence are discarded.
- A declined request is re-served on a fallback model automatically, and the comment names the model that answered. If the review can't be produced at all, the comment says the change couldn't be assessed, never that there's no drift.
- Inference is self-hosted by design. Your code and threat model go only to the LLM provider you configure, under your own key, and never to threatcl.

## Drift review and deterministic checks

Drift review is judgement-based, and it complements the rules that don't need judgement:

- [Invariants](/specification/invariants/) via `threatcl validate -invariants` check machine-decidable facts about the model itself, such as "every threat has an implemented control". They're fast, free and deterministic.
- [Cloud policies](/cloud/policies/) do the same centrally, across your organization.
- Drift review asks the question neither can: has the code moved away from what the model says?

Run the deterministic checks on every push, and drift review on pull requests.
