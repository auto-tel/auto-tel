import RcModule from 'ringcentral-integration/lib/RcModule'
import { Module } from 'ringcentral-integration/lib/di'
import _ from 'lodash'
import PubSub from 'pubsub-js'

import getReducer, { getCustomizeDataReducer, getPersonalCustomizeDataReducer } from './get-reducer'
import actionTypes from './action-types'


@Module({
  deps: [
    { dep: 'DetailedPresence' },
    { dep: 'GlobalStorage' },
    { dep: 'Storage' },
    { dep: 'LocalPresenceOptions', optional: true, spread: true }
  ]
})
export default class LocalPresence extends RcModule {
  constructor({
    detailedPresence,
    storage,
    globalStorage,
    ...options
  }) {
    super({
      actionTypes,
      ...options
    })

    this._detailedPresence = detailedPresence
    this._storage = storage
    this._globalStorage = globalStorage

    this._reducer = getReducer(this.actionTypes)

    this._globalStorageKey = 'localPresenceGlobalData'
    this._storageKey = 'localPresenceData'

    this._globalStorage.registerReducer({
      key: this._globalStorageKey,
      reducer: getCustomizeDataReducer(this.actionTypes)
    })
    this._storage.registerReducer({
      key: this._storageKey,
      reducer: getPersonalCustomizeDataReducer(this.actionTypes)
    })

    // your codes here
  }
  // your codes here

  // Codes on state change
  async _onStateChange() {
    if (this._shouldInit()) {
      this.store.dispatch({
        type: this.actionTypes.initSuccess
      })
    } else if (this._shouldReset()) {
      this.store.dispatch({
        type: this.actionTypes.resetSuccess
      })
    }
    if (this.ready) {
      if (this._lastCalls !== this._detailedPresence.calls) {
        this._lastCalls = this._detailedPresence.calls
        console.log(this._lastCalls)
        let call = _.get(this._lastCalls, [0]) || {}
        if (call.telephonyStatus === 'CallConnected') {
          PubSub.publish('connected')
        }
      }
    }
  }

  _shouldInit() {
    return (
      this._detailedPresence.ready &&
      this.pending
    )
  }

  _shouldReset() {
    return (
      (
        !this._detailedPresence.ready
      ) &&
      this.ready
    )
  }

  updateCustomizeData(data) {
    this.store.dispatch({
      type: this.actionTypes.saveCustomizeData,
      data
    })
  }

  updatePersonalCustomizeData(data) {
    this.store.dispatch({
      type: this.actionTypes.savePersonalCustomizeData,
      data
    })
  }

  get status() {
    return this.state.status
  }

  get customizeData() {
    return this._globalStorage.getItem(this._globalStorageKey)
  }

  get personalCustomizeData() {
    return this._storage.getItem(this._storageKey)
  }
}
