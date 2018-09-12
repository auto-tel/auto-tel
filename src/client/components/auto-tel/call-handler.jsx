/**
 * handle auto call process in this component
 * since rc-webphone has no onTrackAdded option
 * have to use a custom webphone
 */

import {Component} from 'react'
import WebPhone from './web-phone'
import _ from 'lodash'
import PubSub from 'pubsub-js'

export default class CallProcess extends Component {

  state = {
    inited: false,
    registered: false
  }

  componentDidMount() {
    console.log(this.props)
    this.init()
    this.localAudio = document.getElementById('target-audio')
  }

  componentDidUpdate(prevProps) {
    if (!this.state.inited) {
      this.init()
    }
    if (
      prevProps.target && !this.props.target
    ) {
      this.stopCall()
    } else if (
      !prevProps.target && this.props.target
    ) {
      this.startCall()
    } else if (
      prevProps.target && this.props.target &&
      (prevProps.target.id !== this.props.target.id)
    ) {
      this.changeCall()
    }
  }

  componentWillUnmount() {
    if (this.sess) {
      this.sess.terminate()
    }
  }

  p = 'phone.client.service.platform'

  init = async () => {
    let webphone = _.get(this.props, this.p)
    if (!webphone) {
      return
    }
    let platform = this.props.phone.client.service.platform()
    //webphone.userAgent.unregister()
    let info = await platform.post(
      '/client-info/sip-provision',
      {
        sipInfo: [
          {
            transport: 'WSS'
          }
        ]
      }
    )

    info = info.json()
    let options = {
      appKey: window.et.appKey,
      appName: 'auto-tel',
      appVersion: window.et.version,
      media: {
        remove: document.getElementById('remote-audio'),
        local: document.getElementById('local-audio')
      }
    }
    this.webphone = new WebPhone(info, options)
    this.setState({
      inited: true
    })
    this.webphone.userAgent.on('registered', this.onRegister)
  }

  onRegister = () => {
    this.setState({
      registered: true
    })
  }

  stopCall = () => {

  }

  delay = 500

  recallTimer = null

  startCall = () => {
    clearTimeout(this.recallTimer)
    let {registered} = this.state
    let {webphone} = this
    if (!registered || !webphone) {
      this.init()
      return this.recallTimer = setTimeout(this.startCall, this.delay)
    }
    let {
      number,
      voiceURI
    } = this.props.target
    let sess = webphone.userAgent.invite(number)
    sess.on('trackAdded', () => {
      //this.updateMedia(voiceURI, sess)
      let session = sess
      let pc = session.sessionDescriptionHandler.peerConnection
    
      // Gets remote tracks
      let remoteAudio = document.getElementById('remote-audio')
      let remoteStream = new MediaStream()
    
      if (pc.getReceivers) {
        pc.getReceivers().forEach(function (receiver) {
          let rtrack = receiver.track
          if (rtrack) {
            remoteStream.addTrack(rtrack)
          }
        })
      } else {
        remoteStream = pc.getRemoteStreams()[0]
      }
      remoteAudio.srcObject = remoteStream
      remoteAudio.play().catch(function () {
        session.logger.log('local play was rejected')
      })

      this.updateMedia(voiceURI, sess)
    
      // // Gets local tracks
      // let localAudio = document.getElementById('local-audio')
      // let localStream = new MediaStream()

      // if (pc.getSenders) {
      //   pc.getSenders().forEach(function (sender) {
      //     let strack = sender.track
      //     if (strack && strack.kind === 'audio') {
      //       localStream.addTrack(strack)
      //     }
      //   })
      // } else {
      //   console.log('use getlocal')
      //   localStream = pc.getLocalStreams()[0]
      // }
      // localAudio.srcObject = localStream
      // localAudio.play().catch(function () {
      //   session.logger.log('local play was rejected')
      // })

    })
    sess.on('accepted', (data) => {
      console.log('===============')
      console.log(data)
      console.log('===============')
      //this.localAudio.play()
    })
    sess.on('progress', (res) => {
      console.log('===========pp====')
      console.log(res)
      console.log('==========pp=====')
      this.localAudio.play()
    })
    this.sess = sess
  }

  updateMedia = (voiceURI) => {
    // We need to check the peer connection to determine which track was added
    let localAudio = document.getElementById('target-audio')
    localAudio.src = voiceURI
    localAudio.onplay = () => {
      let stream = localAudio.captureStream()
      let tracksToAdd = stream.getTracks()
      let pc = this.sess.sessionDescriptionHandler.peerConnection
      pc.getSenders().forEach((sender) => {
        sender.replaceTrack(tracksToAdd[0])
          .then(res => {
            console.log(res, 'sddfsdf')
          })
          .catch(e => {
            console.log('erer')
            console.log(e)
          })
      })
      tracksToAdd.forEach(track => {
        pc.addTrack(track)
      })
    }
    PubSub.subscribe('connected', () => {
      localAudio.play()
    })
    //
  }

  changeCall = () => {

  }

  addTrack = () => {

  }

  render() {
    return (
      <div className="hide">
        <audio id="target-audio" muted="mute" />
        <audio id="remote-audio" />
        <audio id="local-audio" muted="mute" />
      </div>
    )
  }

}

