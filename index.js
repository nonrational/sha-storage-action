const core = require('@actions/core')
const github = require('@actions/github')
const cache = require('@actions/cache')
const fs = require('fs')

const RESULT_PATH = '/tmp/prev-result'

const run = async () => {
  const sha = github.context.sha
  core.info(`Running for current SHA ${sha}`)
  
  try {
    const ref = core.getInput('must-match-ref')

    if (ref !== 'any') {
      core.info(`Looking for ref ${ref}`)
      const { owner, repo } = github.context.repo
      const token = core.getInput('token')
      if (token === '') {
        core.setFailed('You must set the token input parameter with the value of ${{ secrets.GITHUB_TOKEN }}')
        return
      }
      
      const octokit = github.getOctokit(token)
      // this will error out if the ref cannot be found
      const refResult = await octokit.rest.git.getRef({ owner, repo, ref })
      core.info(`Ref ${ref} has SHA of ${refResult.data.object.sha}`)
      if (refResult.data.object.sha !== sha) {
        core.setFailed(`Ref ${ref} does not match current code SHA`)
        return
      }
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
