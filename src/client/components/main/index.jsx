import React from 'react'
import {Button, Card} from 'antd'
import SIP from 'sip.js'
import Polly from 'aws-sdk/lib/services/polly'
import './main.styl'
console.log(Polly)

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

  componentWillUnmount() {
    this.users.forEach(user => {
      this[`session_${user}`].stop()
    })
  }

  users = ['alice', 'bob']

  initUser = (user, removeElemId) => {
    let remoteVideoElement = document.getElementById(removeElemId)
    let domain = 'sipjs.onsip.com'
    let uri = `${user}.${this.token}@${domain}`
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
    //let ua = new SIP.UA(configuration.ua)
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

    simple.on('trackAdded', this.onTrackAdded)
    this[`uri_${user}`] = uri
    this[`session_${user}`] = simple
  }

  onTrackAdded = () => {
    this.log('track add')
  }

  log = (...msgs) => {
    this.setState(old => {
      old.logs = [
        ...old.logs,
        msgs
      ]
      return old
    })
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
    this.token = token
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
      <Card className="mg1b">
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
      </Card>
    )
  }

  render() {
    return (
      <div className="main">
        <h1>auto-tel</h1>
        <div id="content-video-audio">
          <div id="log">
            {
              this.state.logs.map(items => {
                return (
                  <p>
                    {items.join(', ')}
                  </p>
                )
              })
            }
          </div>
          <div>
            {
              this.users.map(user => {
                return this.renderSection(user)
              })
            }
          </div>
        </div>
      </div>
    )
  }
}
