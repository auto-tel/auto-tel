const os = require('os')
const extend = require('recursive-assign')
const packInfo = require('./package.json')

let config = {
  site: {
    env: process.env.NODE_ENV || 'development',
    siteName: packInfo.name,
    appKey: '', //ringcentral AppKey
    appSecret: 'process.env.RINGCENTRAL_CLIENT_SECRET', //ringcentral AppSecret
    server: 'https://platform.devtest.ringcentral.com',
    redirectUri: 'http://localhost:5370/redirect.html',
    prefix: 'auto-tel', //for localstorage-prefix
    brand: {
      id: '1210',
      brandCode: 'rc',
      code: 'rc',
      name: 'RingCentral',
      appName: 'RingCentral',
      fullName: 'RingCentral'
    }

  },
  host: 'localhost',
  port: process.env.PORT || 4370,
  devCPUCount: os.cpus().length,
  pkg: require('./package'),
  devPort: 5370,
  awsServer: 'us-east-1',
  VoiceId: 'Amy'
}

try {
  extend(config, require('./config.js'))
} catch (e) {
  console.log(e.stack)
  console.warn('warn:no custom config file, use "cp config.sample.js config.js" to create one')
}

module.exports = config



