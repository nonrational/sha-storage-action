# SHA Storage Action

Store a result for the given SHA of a repo.

## Example

Here's a simple example where a test job will only run once for a given version of the codebase (rerunning the job won't result in `make test` running more than once, if the last run succeeded).

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - id: last-run
        uses: bmuller/sha-storage-action

      - run: make test
        if: steps.last-run.outputs.result != 'success'

      - uses: bmuller/sha-storage-action
        with:
          result: success
```

Here's an example where you may only want the "test" job to run successfully at most once:

```yaml
jobs:
  fetch-prev-result:
    runs-on: ubuntu-latest
    outputs:
      prev-result: ${{ steps.last-run.outputs.result }}
    steps:
      - id: last-run
        uses: bmuller/sha-storage-action

  test:
    runs-on: ubuntu-latest
    needs: fetch-prev-result
    if: needs.fetch-prev-result.outputs.prev_result != 'success'
    steps:
      - run: make test
      - uses: bmuller/sha-storage-action
        with:
          result: success
```
