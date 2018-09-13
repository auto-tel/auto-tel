// import { render } from 'react-dom'
// import Main from '../components/main'

// const rootElement = document.getElementById('container')
// render(
//   <Main />,
//   rootElement
// )
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { createPhone } from '../components/modules/phone'
import App from '../components/containers/app'
import brandConfig from '../common/brand'
import prefix from '../common/prefix'
import _ from 'lodash'

const apiConfig = _.pick(
  window.et,
  [
    'appKey',
    'appSecret',
    'server',
    'redirectUri'
  ]
)
const appVersion = window.et.version
const hostingUrl = window.et.host
const redirectUri = apiConfig.redirectUri

const phone = createPhone({
  apiConfig,
  brandConfig,
  prefix,
  appVersion,
  redirectUri
})

const store = createStore(phone.reducer)

phone.setStore(store)

window.phone = phone

ReactDOM.render(
  <App
    phone={phone}
    hostingUrl={hostingUrl}
  />,
  document.querySelector('#viewport')
)


