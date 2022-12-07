const core = require('@actions/core')
const github = require('@actions/github')
const cache = require('@actions/cache')
const fs = require('fs')
const os = require("os")

const RESULT_PATH = '/tmp/prev-result'

const setOutput = (key, value) => {
  // Temporary hack until core actions library catches up with github new recommendations
  const output = process.env['GITHUB_OUTPUT']
  fs.appendFileSync(output, `${key}=${value}${os.EOL}`)
  core.info(fs.readFileSync(output))
}

const run = async () => {
  const sha = github.context.sha
  core.info(`Running for current SHA ${sha}`)
  
  try {
    // These are the string names of the owner and repo
    const { owner, repo } = github.context.repo

    const token = core.getInput('token', { required: true })
    const octokit = github.getOctokit(token)

    // Get the repo object, which contains the `default_branch` property.
    const repoResult = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo })
    const defaultBranch = repoResult.data.default_branch
    core.info(`Using default branch '${defaultBranch}'`)

    const ref = `heads/${defaultBranch}`
    const refResult = await octokit.rest.git.getRef({ owner, repo, ref })
    core.info(`Found '${defaultBranch}' with SHA ${refResult.data.object.sha}`)
    setOutput('default-branch-sha', refResult.data.object.sha)

    let result = core.getInput('result')
    const key = 'sha-storage-action-' + sha + '-' + Math.floor(Date.now() / 1000)
    const cacheKey = await cache.restoreCache([RESULT_PATH], key, ['sha-storage-action-' + sha])

    if (result !== 'unknown') {
      fs.writeFileSync(RESULT_PATH, result)
      await cache.saveCache([RESULT_PATH], key)
    } else if (fs.existsSync(RESULT_PATH)) {
      result = fs.readFileSync(RESULT_PATH, { encoding: 'utf8' })
    }

    setOutput('result', result)
  } catch(error) {
    core.setFailed(error.message)
  }
}

run()
