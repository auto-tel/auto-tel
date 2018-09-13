// eslint-disable */
/**
 * simplified webphone constructor
 * from ringcentral-web-phone
 */

import SIP from 'sip.js'

let messages = {
  park: {
    reqid: 1,
    command: 'callpark'
  },
  startRecord: {
    reqid: 2,
    command: 'startcallrecord'
  },
  stopRecord: {
    reqid: 3,
    command: 'stopcallrecord'
  },
  flip: {
    reqid: 3,
    command: 'callflip',
    target: ''
  },
  monitor: {
    reqid: 4,
    command: 'monitor'
  },
  barge: {
    reqid: 5,
    command: 'barge'
  },
  whisper: {
    reqid: 6,
    command: 'whisper'
  },
  takeover: {
    reqid: 7,
    command: 'takeover'
  },
  toVoicemail: {
    reqid: 11,
    command: 'toVoicemail'
  },
  receiveConfirm: {
    reqid: 17,
    command: 'receiveConfirm'
  },
  replyWithMessage: {
    reqid: 14,
    command: 'replyWithMessage'
  }
}

let uuidKey = 'auto-tel-uuid'

let responseTimeout = 60000

let defaultMediaConstraints = {
  audio: true,
  video: false
}


function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms)
  })
}

function extend(dst, src) {
  src = src || {}
  dst = dst || {}
  Object.keys(src).forEach(function (k) {
    dst[k] = src[k]
  })
  return dst
}


/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @param {object} regData
 * @param {object} [options]
 * @param {string} [options.uuid]
 * @param {string} [options.appKey]
 * @param {string} [options.appName]
 * @param {string} [options.appVersion]
 * @param {string} [options.onSession] fired each time UserAgent starts working with session
 * @constructor
 */
function WebPhone(_regData, _options) {

  let regData = _regData || {}
  let options = _options || {}

  this.sipInfo = regData.sipInfo[0] || regData.sipInfo
  this.sipFlags = regData.sipFlags

  this.uuidKey = options.uuidKey || uuidKey

  let id = options.uuid || localStorage.getItem(this.uuidKey) || uuid() //TODO Make configurable
  localStorage.setItem(this.uuidKey, id)

  this.appKey = options.appKey
  this.appName = options.appName
  this.appVersion = options.appVersion

  let userAgentString = (
    (options.appName ? (options.appName + (options.appVersion ? '/' + options.appVersion : '')) + ' ' : '') +
    'RCWEBPHONE/' + WebPhone.version
  )

  let modifiers = options.modifiers || []
  modifiers.push(SIP.Web.Modifiers.stripTcpCandidates)



  let sessionDescriptionHandlerFactoryOptions = options.sessionDescriptionHandlerFactoryOptions || {
    peerConnectionOptions: {
      iceCheckingTimeout: this.sipInfo.iceCheckingTimeout || this.sipInfo.iceGatheringTimeout || 500,
      rtcConfiguration: {
        rtcpMuxPolicy: 'negotiate'
      }
    },
    constraints: defaultMediaConstraints,
    modifiers: modifiers
  }


  let browserUa = navigator.userAgent.toLowerCase()
  let isFirefox = false

  if (browserUa.indexOf('firefox') > -1 && browserUa.indexOf('chrome') < 0) {
    isFirefox = true
  }

  if (isFirefox) {
    sessionDescriptionHandlerFactoryOptions.alwaysAcquireMediaFirst = true
  }
  //todo is safari

  let sessionDescriptionHandlerFactory = options.sessionDescriptionHandlerFactory || []

  let configuration = {
    uri: 'sip:' + this.sipInfo.username + '@' + this.sipInfo.domain,
    authorizationUser: this.sipInfo.authorizationId,
    password: this.sipInfo.password,
    stunServers: this.sipInfo.stunServers || ['stun:74.125.194.127:19302'], //FIXME Hardcoded?
    turnServers: [],
    log: {
      level: options.logLevel || 1 //FIXME LOG LEVEL 3
    },
    domain: this.sipInfo.domain,
    autostart: true,
    register: true,
    userAgentString: userAgentString,
    transportOptions: {
      wsServers: this.sipInfo.outboundProxy && this.sipInfo.transport
        ? this.sipInfo.transport.toLowerCase() + '://' + this.sipInfo.outboundProxy
        : this.sipInfo.wsServers,
      //connectionTimeout
      maxReconnectionAttempts: options.wsServerMaxReconnection || 3,
      //reconnectionTimeout
      //keepAliveInterval
      //keepAliveDebounce
      traceSip: true
    },
    //wsServerMaxReconnection: options.wsServerMaxReconnection || 3,
    //connectionRecoveryMaxInterval: options.connectionRecoveryMaxInterval || 60,
    //connectionRecoveryMinInterval: options.connectionRecoveryMinInterval || 2,
    sessionDescriptionHandlerFactoryOptions,
    sessionDescriptionHandlerFactory
  }
  this.userAgent = new SIP.UA(configuration)

  this.userAgent.defaultHeaders = [
    'P-rc-endpoint-id: ' + id,
    'Client-id:' + options.appKey
  ]

  this.userAgent.sipInfo = this.sipInfo

  this.userAgent.__invite = this.userAgent.invite
  this.userAgent.invite = invite

  this.userAgent.__register = this.userAgent.register
  this.userAgent.register = register

  this.userAgent.__unregister = this.userAgent.unregister
  this.userAgent.unregister = unregister

  this.userAgent.onSession = options.onSession || null
  this.userAgent.createRcMessage = createRcMessage
  this.userAgent.sendMessage = sendMessage
  this.userAgent.transport._onMessage = this.userAgent.transport.onMessage
  this.userAgent.transport.onMessage = onMessage
  this.userAgent.register()

}

/*--------------------------------------------------------------------------------------------------------------------*/

WebPhone.version = '0.5.0'
WebPhone.uuid = uuid
WebPhone.delay = delay
WebPhone.extend = extend

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @param {object} options
 * @return {String}
 */
function createRcMessage(options) {
  options.body = options.body || ''
  let msgBody = '<Msg><Hdr SID="' + options.sid + '" Req="' + options.request + '" From="' + options.from + '" To="' + options.to + '" Cmd="' + options.reqid + '"/> <Bdy Cln="' + this.sipInfo.authorizationId + '" ' + options.body + '/></Msg>'
  return msgBody
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.UserAgent}
 * @param {object} options
 * @return {Promise}
 */
function sendMessage(to, messageData) {
  let userAgent = this
  let sipOptions = {}
  sipOptions.contentType = 'x-rc/agent'
  sipOptions.extraHeaders = []
  sipOptions.extraHeaders.push('P-rc-ws: ' + this.contact)

  return new Promise(function (resolve, reject) {
    let message = userAgent.message(to, messageData, sipOptions)

    message.once('accepted', function () {
      resolve()
    })
    message.once('failed', function (response, cause) {
      reject(new Error(cause))
    })
  })
}

/*--------------------------------------------------------------------------------------------------------------------*/

function onMessage(e) {
  // This is a temporary solution to avoid timeout errors for MESSAGE responses.
  // Timeout is caused by port specification in host field within Via header.
  // sip.js requires received viaHost in a response to be the same as ours via host therefore
  // messages with the same host but with port are ignored.
  // This is the exact case for WSX: it send host:port inn via header in MESSAGE responses.
  // To overcome this, we will preprocess MESSAGE messages and remove port from viaHost field.
  let data = e.data

  // WebSocket binary message.
  if (typeof data !== 'string') {
    try {
      data = String.fromCharCode.apply(null, new Uint8Array(data))
    } catch (error) {
      return this._onMessage.apply(this, [e])
    }
  }

  if (data.match(/CSeq:\s*\d+\s+MESSAGE/i)) {
    let re = new RegExp(this.ua.configuration.viaHost + ':\\d+', 'g')
    let newData = e.data.replace(re, this.ua.configuration.viaHost)
    Object.defineProperty(e, 'data', {
      value: newData,
      writable: false
    })
  }

  return this._onMessage.apply(this, [e])
}

/*--------------------------------------------------------------------------------------------------------------------*/




function patchSession(session) {

  if (session.__patched) return session

  session.__patched = true

  session.__sendRequest = session.sendRequest
  session.__receiveRequest = session.receiveRequest
  session.__accept = session.accept
  session.__hold = session.hold
  session.__unhold = session.unhold
  session.__dtmf = session.dtmf
  session.__reinvite = session.reinvite

  session.sendRequest = sendRequest
  session.receiveRequest = receiveRequest
  session.accept = accept
  session.hold = hold
  session.unhold = unhold
  session.dtmf = dtmf
  session.reinvite = reinvite

  session.warmTransfer = warmTransfer
  session.blindTransfer = blindTransfer
  session.transfer = transfer
  session.park = park
  session.forward = forward
  session.startRecord = startRecord
  session.stopRecord = stopRecord
  session.flip = flip

  session.mute = mute
  session.unmute = unmute
  session.onLocalHold = onLocalHold

  session.media = session.ua.media

  session.on('replaced', patchSession)

  // Audio
  session.on('progress', function (incomingResponse) {
    stopPlaying()
    if (incomingResponse.status_code === 183 && incomingResponse.body) {
      session.createDialog(incomingResponse, 'UAC')
      session.sessionDescriptionHandler.setDescription(incomingResponse.body).then(function () {
        session.status = 11 //C.STATUS_EARLY_MEDIA
        session.hasAnswer = true
      })
    }
  })
  session.on('accepted', stopPlaying)
  session.on('rejected', stopPlaying)
  session.on('bye', stopPlaying)
  session.on('terminated', stopPlaying)
  session.on('cancel', stopPlaying)
  session.on('failed', stopPlaying)
  session.on('replaced', stopPlaying)


  function stopPlaying() {
    session.removeListener('accepted', stopPlaying)
    session.removeListener('rejected', stopPlaying)
    session.removeListener('bye', stopPlaying)
    session.removeListener('terminated', stopPlaying)
    session.removeListener('cancel', stopPlaying)
    session.removeListener('failed', stopPlaying)
    session.removeListener('replaced', stopPlaying)
  }

  if (session.ua.onSession) session.ua.onSession(session)

  return session

}



/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @private
 * @param {SIP.Session} session
 * @param {object} command
 * @param {object} [options]
 * @return {Promise}
 */
function sendReceive(session, command, options) {
  options = options || {}

  extend(command, options)

  let cseq = null

  return new Promise(function (resolve, reject) {

    let extraHeaders = (options.extraHeaders || []).concat(session.ua.defaultHeaders).concat([
      'Content-Type: application/jsoncharset=utf-8'
    ])

    session.sendRequest(SIP.C.INFO, {
      body: JSON.stringify({
        request: command
      }),
      extraHeaders,
      receiveResponse: function (response) {
        let timeout = null
        if (response.status_code === 200) {
          cseq = response.cseq
          let onInfo = function (request) {
            if (response.cseq === cseq) {

              let body = request && request.body || '{}'
              let obj

              try {
                obj = JSON.parse(body)
              } catch (e) {
                obj = {}
              }

              if (obj.response && obj.response.command === command.command) {
                if (obj.response.result) {
                  if (obj.response.result.code === 0) {
                    return resolve(obj.response.result)
                  } else {
                    return reject(obj.response.result)
                  }
                }
              }
              timeout && clearTimeout(timeout)
              session.removeListener('RC_SIP_INFO', onInfo)
              resolve(null) //FIXME What to resolve
            }
          }

          timeout = setTimeout(function () {
            reject(new Error('Timeout: no reply'))
            session.removeListener('RC_SIP_INFO', onInfo)
          }, responseTimeout)
          session.on('RC_SIP_INFO', onInfo)
        } else {
          reject(new Error('The INFO response status code is: ' + response.status_code + ' (waiting for 200)'))
        }
      }
    })

  })

}

/*--------------------------------------------------------------------------------------------------------------------*/

function register(options) {
  options = options || {}
  options.extraHeaders = (options.extraHeaders || []).concat(this.defaultHeaders)
  console.log('regi options', options)
  return this.__register.call(this, options)
}

/*--------------------------------------------------------------------------------------------------------------------*/

function unregister(options) {
  options = options || {}
  options.extraHeaders = (options.extraHeaders || []).concat(this.defaultHeaders)
  return this.__unregister.call(this, options)
}

/*--------------------------------------------------------------------------------------------------------------------*/

function sendRequest(type, config) {
  if (type === SIP.C.PRACK) {
    // type = SIP.C.ACK
    return this
  }
  return this.__sendRequest(type, config)
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @private
 * @param {SIP.Session} session
 * @param {boolean} flag
 * @return {Promise}
 */
function setRecord(session, flag) {

  let message = !!flag ?
    messages.startRecord :
    messages.stopRecord

  if ((session.__onRecord && !flag) || (!session.__onRecord && flag)) {
    return sendReceive(session, message)
      .then(function (data) {
        session.__onRecord = !!flag
        return data
      })
  }

}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @private
 * @param {SIP.Session} session
 * @param {boolean} flag
 * @return {Promise}
 */
function setLocalHold(session, flag) {
  return new Promise(function (resolve, reject) {

    let options = {
      eventHandlers: {
        succeeded: resolve,
        failed: reject
      }
    }

    if (flag) {
      resolve(session.__hold(options))
    } else {
      resolve(session.__unhold(options))
    }

  })
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.UA}
 * @param number
 * @param options
 * @return {SIP.Session}
 */
function invite(number, options) {

  let ua = this

  options = options || {}
  options.extraHeaders = (options.extraHeaders || []).concat(ua.defaultHeaders)

  options.extraHeaders.push('P-Asserted-Identity: sip:' + (options.fromNumber || ua.sipInfo.username) + '@' + ua.sipInfo.domain) //FIXME Phone Number

  //FIXME Backend should know it already
  if (options.homeCountryId) {
    options.extraHeaders.push('P-rc-country-id: ' + options.homeCountryId)
  }

  options.media = options.media || {}
  options.media.constraints = options.media.constraints || defaultMediaConstraints

  options.RTCConstraints = options.RTCConstraints || {
    optional: [{
      DtlsSrtpKeyAgreement: 'true'
    }]
  }

  return patchSession(ua.__invite(number, options), )

}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @param request
 * @return {*}
 */
function receiveRequest(request) {
  let session = this
  switch (request.method) {
    case SIP.C.INFO:
      session.emit('RC_SIP_INFO', request)
      //SIP.js does not support application/json content type, so we monkey override its behaviour in this case
      if (session.status === SIP.Session.C.STATUS_CONFIRMED || session.status === SIP.Session.C.STATUS_WAITING_FOR_ACK) {
        let contentType = request.getHeader('content-type')
        if (contentType.match(/^application\/json/i)) {
          request.reply(200)
          return session
        }
      }
      break
  }
  return session.__receiveRequest.apply(session, arguments)
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @param {object} options
 * @return {Promise}
 */
function accept(options) {

  let session = this

  options = options || {}
  options.extraHeaders = (options.extraHeaders || []).concat(session.ua.defaultHeaders)
  options.media = options.media || {}
  options.media.constraints = options.media.constraints || defaultMediaConstraints

  options.RTCConstraints = options.RTCConstraints || {
    optional: [{
      DtlsSrtpKeyAgreement: 'true'
    }]
  }

  return new Promise(function (resolve, reject) {

    function onAnswered() {
      resolve(session)
      session.removeListener('failed', onFail)
    }

    function onFail(e) {
      reject(e)
      session.removeListener('accepted', onAnswered)
    }

    //TODO More events?
    session.once('accepted', onAnswered)
    session.once('failed', onFail)
    session.__accept(options)
  })


}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session} session
 * @param {string} dtmf
 * @param {number} duration
 * @return {Promise}
 */
function dtmf(dtmf, duration) {
  let session = this
  duration = parseInt(duration) || 1000
  let pc = session.sessionDescriptionHandler.peerConnection
  let senders = pc.getSenders()
  let audioSender = senders.find(function (sender) {
    return sender.track && sender.track.kind === 'audio'
  })
  let dtmfSender = audioSender.dtmf
  if (dtmfSender !== undefined && dtmfSender) {
    return dtmfSender.insertDTMF(dtmf, duration)
  }
  throw new Error('Send DTMF failed: ' + (!dtmfSender ? 'no sender' : (!dtmfSender.canInsertDTMF ? 'can\'t insert DTMF' : 'Unknown')))
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session} session
 * @return {Promise}
 */
function hold() {
  return setLocalHold(this, true)
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session} session
 * @return {Promise}
 */
function unhold() {
  return setLocalHold(this, false)
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session} session
 * @param {string} target
 * @param {object} options
 * @return {Promise}
 */
function blindTransfer(target, options) {
  options = options || {}
  let session = this
  return Promise.resolve(
    session.refer(target, options)
  )
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session} session
 * @param {SIP.Session} target
 * @param {object} transferOptions
 * @return {Promise}
 */
function warmTransfer(target, transferOptions) {

  let session = this

  return (session.local_hold ? Promise.resolve(null) : session.hold())
    .then(function () {
      return delay(300)
    })
    .then(function () {

      let referTo = '<' + target.dialog.remote_target.toString() +
        '?Replaces=' + target.dialog.id.call_id +
        '%3Bto-tag%3D' + target.dialog.id.remote_tag +
        '%3Bfrom-tag%3D' + target.dialog.id.local_tag + '>'

      transferOptions = transferOptions || {}
      transferOptions.extraHeaders = (transferOptions.extraHeaders || [])
        .concat(session.ua.defaultHeaders)
        .concat(['Referred-By: ' + session.dialog.remote_target.toString()])

      //TODO return session.refer(newSession)
      return session.blindTransfer(referTo, transferOptions)

    })

}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @param {string} target
 * @param {object} options
 * @return {Promise}
 */
function transfer(target, options) {

  let session = this

  return (session.local_hold ? Promise.resolve(null) : session.hold())
    .then(function () {
      return delay(300)
    })
    .then(function () {
      return session.blindTransfer(target, options)
    })

}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @param {string} target
 * @param {object} acceptOptions
 * @param {object} [transferOptions]
 * @return {Promise}
 */
function forward(target, acceptOptions, transferOptions) {

  let interval = null,
    session = this

  return session.accept(acceptOptions)
    .then(function () {

      return new Promise(function (resolve) {
        interval = setInterval(function () {
          if (session.status === 12) {
            clearInterval(interval)
            session.mute()
            setTimeout(function () {
              resolve(session.transfer(target, transferOptions))
            }, 700)
          }
        }, 50)
      })

    })

}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @return {Promise}
 */
function startRecord() {
  return setRecord(this, true)
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @return {Promise}
 */
function stopRecord() {
  return setRecord(this, false)
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @param target
 * @return {Promise}
 */
function flip(target) {
  return sendReceive(this, messages.flip, {
    target: target
  })
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @return {Promise}
 */
function park() {
  return sendReceive(this, messages.park)
}

/*--------------------------------------------------------------------------------------------------------------------*/
/**
 * @this {SIP.Session}
 * @return {Promise}
 */

function reinvite(options, modifier) {
  let session = this
  options = options || {}
  options.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions || {}
  options.sessionDescriptionHandlerOptions.constraints = options.sessionDescriptionHandlerOptions.constraints || defaultMediaConstraints
  return session.__reinvite(options, modifier)
}

/*--------------------------------------------------------------------------------------------------------------------*/


function toggleMute(session, mute) {
  let pc = session.sessionDescriptionHandler.peerConnection
  if (pc.getSenders) {
    pc.getSenders().forEach(function (sender) {
      if (sender.track) {
        sender.track.enabled = !mute
      }
    })
  }
}

/*--------------------------------------------------------------------------------------------------------------------*/
function mute(silent) {
  if (this.state !== this.STATUS_CONNECTED) {
    this.logger.warn('An acitve call is required to mute audio')
    return
  }
  this.logger.log('Muting Audio')
  if (!silent) {
    this.emit('muted', this.session)
  }
  return toggleMute(this, true)
}

/*--------------------------------------------------------------------------------------------------------------------*/

function unmute(silent) {
  if (this.state !== this.STATUS_CONNECTED) {
    this.logger.warn('An active call is required to unmute audio')
    return
  }
  this.logger.log('Unmuting Audio')
  if (!silent) {
    this.emit('unmuted', this.session)
  }
  return toggleMute(this, false)
}

/*--------------------------------------------------------------------------------------------------------------------*/

/**
 * @this {SIP.Session}
 * @return boolean
 */

function onLocalHold() {
  let session = this
  return session.local_hold
}

export default WebPhone
