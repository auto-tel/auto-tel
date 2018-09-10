import React from 'react'
import {Button, Row, Col} from 'antd'
import SIP from 'sip.js'

function getCookie(key) {
  /* eslint-disable-next-line */
  var re = new RegExp('(?:(?:^|.*;\s*) ? '+ key + '\s*\=\s*([^;]*).*$)|^.*$')
  return document.cookie.replace(re, '$1')
}

function randomString(length, chars) {
  let result = ''
  for (var i = length; i > 0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))]
  }
  return result
}

export default class ErrorBoundary extends React.Component {

  state = {
    logs: [],
    buttonTag: {}
  }

  componentDidMount() {
    this.init()
  }

  users = ['alice', 'bob']

  initUser = (user, removeElemId) => {
    let remoteVideoElement = document.getElementById(removeElemId)
    let domain = 'sipjs.onsip.com'
    let uri = `${user}.${window.token}@${domain}`
    let configuration = {
      media: {
        remote: {
          video: remoteVideoElement,
          audio: remoteVideoElement
        }
      },
      ua: {
        traceSip: true,
        uri,
        displayName: user,
        userAgentString: SIP.C.USER_AGENT + ' sipjs.com'
      }
    }
    let simple = new SIP.Web.Simple(configuration)

    // Adjust the style of the demo based on what is happening
    simple.on('ended', () => {
      remoteVideoElement.style.visibility = 'hidden'
      this.setState(old => {
        old.buttonTag[user] = 'start'
        return old
      })
    })

    simple.on('connected', () => {
      remoteVideoElement.style.visibility = 'visible'
      this.setState(old => {
        old.buttonTag[user] = 'hung up'
        return old
      })
    })

    simple.on('ringing', () => {
      simple.answer()
    })
    this[`uri_${user}`] = uri
    this[`session_${user}`] = simple
  }

  getOtherName = name => {
    let {users} = this
    return name === users[0]
      ? users[1]
      : users[0]
  }

  init = () => {
    let token = getCookie('onsipToken')
    if (token === '') {
      token = randomString(
        32, [
          '0123456789',
          'abcdefghijklmnopqrstuvwxyz',
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        ].join('')
      )
      let d = new Date()
      d.setTime(d.getTime() + 1000 * 60 * 60 * 24)
      document.cookie = 'onsipToken=' +
        token + ';' + 'expires=' + d.toUTCString() + ';'
    }
    window.token = token
    this.users.forEach(user => {
      let otherUser = this.getOtherName(user)
      this.initUser(user, `video-of-${otherUser}`)
    })
  }

  onClickName = name => {
    let simple = this[`session_${name}`]
    let {state} = simple
    let otherName = this.getOtherName(name)
    let targetURI = this[`uri_${otherName}`]
    if (
      state === SIP.Web.Simple.C.STATUS_NULL ||
      state === SIP.Web.Simple.C.STATUS_COMPLETED
    ) {
      simple.call(targetURI)
    } else {
      simple.hangup()
    }
  }

  renderSection = (name) => {
    let tag = this.state.buttonTag[name] || 'start'
    return (
      <Col cols={12}>
        <div class="demo-view pd1y">
          <video id={`video-of-${name}`} muted="muted" />
        </div>
        <div class="pd1y">
          <Button
            onClick={() => this.onClickName(name)}
          >
            {tag}
          </Button>
        </div>
        <h4>{name}'s View</h4>
      </Col>
    )
  }

  render() {
    return (
      <div>
        <h1>auto-tel</h1>
        <div id="content-video-audio">
          <h2>Video Chat demo</h2>
          <h4 class="intro">Here's a demo. Start a video chat between Alice and Bob.</h4>
          <div id="log" />
          <Row>
            {
              this.users.map(user => {
                return this.renderSection(user)
              })
            }
          </Row>
        </div>
      </div>
    )
  }
}
