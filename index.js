const core = require('@actions/core')
const github = require('@actions/github')
const cache = require('@actions/cache')
const fs = require('fs')

const RESULT_PATH = '/tmp/prev-result'

const run = async () => {
  const sha = github.context.sha
  core.info(`Running for current SHA ${sha}`)
  
  try {
    const { owner, repo } = github.context.repo

    const defaultBranchRef = 'heads/master'
    const token = core.getInput('token', { required: true })
    const octokit = github.getOctokit(token)


    const { default_branch } = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo })
    core.info(`Using default branch '${default_branch}'`)

    const refResult = await octokit.rest.git.getRef({ owner, repo, `heads/${default_branch}` })
    if (refResult.data.object.sha !== sha) {
      core.setFailed(`Current SHA ${sha} does not match default branch SHA ${refResult.data.object.sha}`)
      return
    }

    let result = core.getInput('result')
    const key = 'sha-storage-action-' + sha + '-' + Math.floor(Date.now() / 1000)
    const cacheKey = await cache.restoreCache([RESULT_PATH], key, ['sha-storage-action-' + sha])

    if (result !== 'unknown') {
      fs.writeFileSync(RESULT_PATH, result)
      await cache.saveCache([RESULT_PATH], key)
    } else if (fs.existsSync(RESULT_PATH)) {
      result = fs.readFileSync(RESULT_PATH, { encoding: 'utf8' })
    }

    core.setOutput('result', result)
  } catch(error) {
    core.setFailed(error.message)
  }
}

run()
