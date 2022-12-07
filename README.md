# SHA Storage Action

Store a result for a given commit SHA in a repo.

## Outputs

|name|description|
|-|-|
|`result`| The string result of the action, either `'unknown'` or the given `result` value.|
|`deploy_sha`| The current SHA of the default branch of the repo. This is useful when implementing a tag-based deployment strategy|

## Examples

Here's a simple example where a test step will run once for a given version of the codebase. Re-running the action for the same commit will skip `make test` if the last run was successful.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - id: last-run
        uses: bmuller/sha-storage-action@master

      - run: make test
        if: steps.last-run.outputs.result != 'success'

      - uses: bmuller/sha-storage-action@master
        with:
          result: success
```

In this example, the entire `test` job will be skipped if it already succeeded for this commit.

```yaml
jobs:
  fetch-prev-result:
    runs-on: ubuntu-latest
    outputs:
      prev-result: ${{ steps.last-run.outputs.result }}
    steps:
      - id: last-run
        uses: bmuller/sha-storage-action@master

  test:
    runs-on: ubuntu-latest
    needs: fetch-prev-result
    if: needs.fetch-prev-result.outputs.prev_result != 'success'
    steps:
      - run: make test
      - uses: bmuller/sha-storage-action@master
        with:
          result: success
```
