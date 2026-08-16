# Developer adoption path

This repository is the public integration surface for OptiForge. It is designed
to let a product team evaluate the data contract before receiving access to a
hosted or privately deployed OptiForge environment.

## 1. Pick one decision

Start with a recurring operational decision that has clear resources, tasks,
hard rules, and a measurable objective. Avoid combining multiple planning
problems in the first model.

## 2. Map your data

Copy the closest synthetic example and replace its field names with names from
your own payload. The model's `fieldMappings` section keeps your domain names
intact; you do not need to rename every upstream field.

## 3. Separate rules from preferences

- Constraints describe what must never be violated: skills, capacity,
  availability, deadlines, or precedence.
- Objectives describe what should be improved: cost, balanced load, or plan
  stability.

Validate hard rules with small, reviewable cases before adding larger data.

## 4. Integrate from a server

Create a scoped development API key and call the published model from your
backend. Keep the key outside client-side code and source control. Use the
asynchronous API for longer workloads.

## 5. Measure before automating

Run the model alongside the existing planning process. Compare feasibility,
cost, completion time, and manual overrides. Introduce automated execution only
after the operating team approves the decision policy.

## Production checklist

- Confirm data minimization and retention requirements.
- Define a human override and escalation path.
- Test infeasible, timeout, and partial-data scenarios.
- Use idempotent business identifiers around downstream actions.
- Set API-key quotas and rotate keys through a secret manager.
- Monitor solve success, latency, queue age, and result quality.
