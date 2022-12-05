const core = require('@actions/core')
const github = require('@actions/github')
const cache = require('@actions/cache')
const fs = require('fs')

const RESULT_PATH = '/tmp/prev-result'

const run = async () => {
  try {
    let result = core.getInput('result')
    const sha = github.context.sha
    core.info('Fetching status from core sha ' + sha)

    const key = 'sha-storage-action-' + sha + '-' + Math.floor(Date.now() / 1000)
    const cacheKey = await cache.restoreCache([RESULT_PATH], key, ['sha-storage-action-' + sha])

    if (result !== 'unknown') {
      fs.writeFileSync(RESULT_PATH, result)
    } else if (fs.existsSync(RESULT_PATH)) {
      result = fs.readFileSync(RESULT_PATH)
    }

    core.setOutput('result', result)
  } catch(error) {
    core.setFailed(error.message)
  }
}

run()
