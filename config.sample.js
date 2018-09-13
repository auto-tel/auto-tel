/**
 * config sample file
 * cp config.sample.js config.js to create local config
 */

module.exports = {
  site: {
    // env: '',
    // siteName: '',
    // host: 'https://xx.xx',
    // cdn: 'https://xx.xx',
    appKey: , //ringcentral AppKey required
    appSecret: , //ringcentral AppSecret required
    server: 'https://platform.devtest.ringcentral.com', //ringcentral server required
    redirectUri: 'http://localhost:5370/redirect.html' //redirect url, required
  }
  // host: 'localhost',
  // port: process.env.PORT || 4370,
  // devCPUCount: os.cpus().length,
  // pkg: require('./package'),
  // devPort: 5370,
  // awsServer: 'us-east-1'
  // VoiceId: Geraint | Gwyneth | Mads | Naja | Hans | Marlene | Nicole | Russell | Amy | Brian | Emma | Raveena | Ivy | Joanna | Joey | Justin | Kendra | Kimberly | Matthew | Salli | Conchita | Enrique | Miguel | Penelope | Chantal | Celine | Lea | Mathieu | Dora | Karl | Carla | Giorgio | Mizuki | Liv | Lotte | Ruben | Ewa | Jacek | Jan | Maja | Ricardo | Vitoria | Cristiano | Ines | Carmen | Maxim | Tatyana | Astrid | Filiz | Vicki | Takumi | Seoyeon | Aditi
}
