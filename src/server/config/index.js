const cwd = process.cwd()
const pack = require(cwd + '/package.json')
const config = require(cwd + '/config.default.js')
let version = pack.version
if (process.env.NODE_ENV === 'production') {
  try {
    version = require('fs').readFileSync(
      cwd + '/version'
    ).toString()
  } catch(e) {
    console.log('no version file found')
  }
} else {
  const git = require('git-rev-sync')
  version = pack.version + '-' + git.long()
}

config.site.version = version

module.exports = exports.default = Object.freeze(config)
