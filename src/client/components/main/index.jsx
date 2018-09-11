import React from 'react'
import {Button, Card, Input, Icon} from 'antd'
import SIP from 'sip.js'
import {getVoiceFromText} from '../../common/get-data'
import './main.styl'

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

export default class Main extends React.Component {

  state = {
    logs: [],
    text: {},
    connected: {},
    isLoading: {},
    buttonTag: {}
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount() {
    this.users.forEach(user => {
      this[`session_${user}`].terminate()
    })
  }

  users = ['alice', 'bob']

  onClickName = name => {
    let connected = !!this.state.connected[name]
    if (connected) {
      this[`session_${name}`].terminate()
    } else {
      this.initSession(name)
    }
  }

  initSession = (user) => {
    let ua = this[`ua_${user}`]
    let otherName = this.getOtherName(user)
    let targetURI = this[`uri_${otherName}`]
    if (ua.isRegistered()) {
      alert('reg done:' + user)
    }
    let sess = ua.invite(targetURI)
    this[`session_${user}`] = sess
    this.initSessEvt(user)
  }

  updateMedia = (user, sess) => {
    // We need to check the peer connection to determine which track was added
    let pc = sess.sessionDescriptionHandler.peerConnection
    let localVideo = document.getElementById(`video-of-${user}`)
    let otherUser = this.getOtherName(user)
    let remoteVideo = document.getElementById(`video-of-${otherUser}`)

    // Gets remote tracks
    var remoteStream = new MediaStream()
    if (pc.getReceivers) {
      pc.getReceivers().forEach(function(receiver) {
        remoteStream.addTrack(receiver.track)
      })
    } else {
      remoteStream = pc.getRemoteStreams()[0]
    }

    remoteVideo.srcObject = remoteStream
    remoteVideo.play().catch(function() {
      sess.logger.log('local play was rejected')
    })

    let localStream = new MediaStream()
    if(pc.getSenders){
      pc.getSenders().forEach(function(sender) {
        let {track} = sender
        localStream.addTrack(track)
      })
    } else{
      localStream = pc.getLocalStreams()[0]
    }
    localVideo.srcObject = localStream
    localVideo.play().catch(function() {
      sess.logger.log('local play was rejected')
    })
  }

  initSessEvt = user => {
    let sess = this[`session_${user}`]
    sess.on('terminated', () => {
      this.setState(old => {
        old.connected[user] = false
        return old
      })
    })
    sess.on('accepted', () => {
      //this.updateMedia(user, sess)
      this.setState(old => {
        old.connected[user] = true
        return old
      })
    })
    sess.on('trackAdded', () => {
      this.updateMedia(user, sess)
    })
  }

  initUser = (user) => {
    let domain = 'sipjs.onsip.com'
    let uri = `${user}.${this.token}@${domain}`
    let configuration = {
      transportOptions: {
        traceSip: true
      },
      uri,
      displayName: user,
      register: true,
      autostart: true,
      userAgentString: SIP.C.USER_AGENT + ' sipjs.com'
    }
    let ua = new SIP.UA(configuration.ua)

    ua.on('registered', () => {
      alert('registered:' + user)
      this.log('registered', user)
    })
    ua.on('invite', (session) => {
      session.accept()
      this[`session_${user}`] = session
      this.initSessEvt(user)
    })
    ua.start()
    this[`ua_${user}`] = ua
    this[`uri_${user}`] = uri
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
    this.users.forEach(this.initUser)
  }

  onChange = (e, name) => {
    let val = e.target.value
    this.setState(old => {
      old.text[name] = val
      return old
    })
  }

  replace = async (name) => {
    this.setState(old => {
      old.isLoading[name] = true
    })
    let text = this.state.text[name]
    let audioURI = await getVoiceFromText(text)
    if (!audioURI) {
      return
    }
    audioURI = audioURI.uri
    let audioElem = document.getElementById(
      `hide-audio-${name}`
    )
    audioElem.src = audioURI
    console.log(audioElem)
  }

  renderSection = (name) => {
    let connected = !!this.state.connected[name]
    let tag = connected
      ? 'hung up'
      : 'call'
    let text = this.state.text[name]
    let isLoading = this.state.isLoading[name]
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
        <div className="pd1y">
          <Input
            value={text}
            onChange={e => this.onChange(e, name)}
            addonAfter={
              <span
                onClick={() => this.replace(name)}
              >
                {
                  isLoading
                    ? <Icon type="loading" />
                    : 'replace with text audio'
                }
              </span>
            }
          />
        </div>
        <div className="hide">
          <audio id={`hide-audio-${name}`} />
        </div>
      </Card>
    )
  }

  render() {
    return (
      <div className="main">
        <h1>auto-tel0</h1>
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
