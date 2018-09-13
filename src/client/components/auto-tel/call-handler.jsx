/**
 * handle auto call process in this component
 * since rc-webphone has no onTrackAdded option
 * have to use a custom webphone
 */

import {Component} from 'react'
import WebPhone from './web-phone'
import _ from 'lodash'
import copy from 'json-deep-copy'

export default class CallProcess extends Component {

  state = {
    inited: false,
    registered: false
  }

  componentDidMount() {
    this.init()
    let localAudio = document.getElementById('target-audio')
    localAudio.onplay = this.onPlay
    localAudio.onended = this.onEnded
    this.localAudio = localAudio
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
    this.stopCall()
  }

  p = 'phone.client.service.platform'

  checkStausInterval = 500
  checker = null

  init = async () => {
    if (!_.get(this.props, this.p)) {
      return
    }
    let platform = this.props.phone.client.service.platform()
    this.platform = platform
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
      appVersion: window.et.version
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
    this.endPhone()
    this.sess.terminate()
  }

  delay = 500

  recallTimer = null

  startCall = () => {
    clearTimeout(this.recallTimer)
    let {registered} = this.state
    let {webphone} = this
    if (!this.props.target) {
      return
    }
    if (!registered || !webphone) {
      this.init()
      return this.recallTimer = setTimeout(this.startCall, this.delay)
    }
    let {
      number
    } = this.props.target
    let sess = webphone.userAgent.invite(number)
    sess.on('bye', this.onEndPossibleSuccess)
    sess.on('cancel', this.onEnd)
    sess.on('failed', this.onEnd)
    sess.on('rejected', this.onEnd)
    this.sess = sess
    this.sess.on('accepted', this.onTrackAdded)
    this.checkPhoneStatus()
  }

  checkPhoneStatus = async () => {
    clearTimeout(this.checker)
    if (!this.props.target) {
      return this.endPhone()
    }
    let status = await this.getPhoneStatus()
    if (status !== 'Success') {
      return this.checker = setTimeout(
        this.checkPhoneStatus,
        this.checkStausInterval
      )
    } else {
      this.localAudio.play()
    }
  }

  getCurrentCallTelephonySessionId = async () => {
    let {platform} = this
    let res = await platform
      .get(
        '/restapi/v1.0/account/~/extension/~/presence?detailedTelephonyState=true'
      ).then(res => res.json())
    let  telephonySessionId = _.get(res, 'activeCalls[0].telephonySessionId')
    this.telephonySessionId = telephonySessionId
    return telephonySessionId
  }

  getPhoneStatus = async () => {
    let telephonySessionId = this.telephonySessionId || await this.getCurrentCallTelephonySessionId()
    if (!telephonySessionId) {
      return ''
    }
    let {platform} = this
    let res = await platform
      .get(
        `/restapi/v1.0/account/~/extension/~/ring-out/${telephonySessionId}`
      ).then(res => res.json())
    return res.status.callStatus
  }

  onEnd = (response, cause) => {
    this.endPhone()
    this.props.report({
      result: 'failed',
      message: cause || '',
      target: copy(this.props.target)
    })
  }

  onEndPossibleSuccess = (response, cause) => {
    this.endPhone()
    this.props.report({
      result: 'success',
      message: cause || '',
      target: copy(this.props.target)
    })
  }

  endPhone = () => {
    this.localAudio.pause()
    this.localAudio.currentTime = 0
    clearTimeout(this.checker)
    clearTimeout(this.recallTimer)
    clearTimeout(this.deadTimer)
    delete this.localAudio.onplay
    this.telephonySessionId = null
    //this.sess.terminate()
  }

  onTrackAdded = () => {
    if (!this.props.target) {
      return
    }
    this.updateMedia(
      this.props.target.voiceURI,
      this.sess
    )
  }

  updateMedia = (voiceURI) => {
    let {localAudio} = this
    localAudio.src = voiceURI
    localAudio.onplay = this.onPlay
    this.setDeadline()
  }

  setDeadline = (duation = 20) => {
    clearTimeout(this.deadTimer)
    this.deadTimer = setTimeout(() => {
      console.log('times up, end it')
      this.sess.terminate()
      this.onEndPossibleSuccess()
    }, duation * 3 * 1000)
  }

  onPlay = () => {
    let stream = this.localAudio.captureStream()
    let tracksToAdd = stream.getTracks()
    let pc = this.sess.sessionDescriptionHandler.peerConnection
    pc.getSenders().forEach((sender) => {
      sender.replaceTrack(tracksToAdd[0])
        .then(() => {
          //console.log('replace Track done')
        })
        .catch(e => {
          console.log('repalce Track fails')
          console.log(e)
        })
    })
  }

  onEnded = () => {
    this.localAudio.play()
  }

  changeCall = () => {
    this.startCall()
  }

  render() {
    return (
      <div className="hide">
        <audio id="target-audio" muted="mute" />
        <audio id="remote-audio" muted="mute" />
        <audio id="local-audio" muted="mute" loop />
      </div>
    )
  }

}

