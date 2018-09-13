import React from 'react'
import {
  Button,
  Tabs,
  Badge,
  List
} from 'antd'
import AutoTelForm from './form'
import {getVoiceFromText} from '../../common/get-data'
import {generate} from 'shortid'
import CallHandler from './call-handler'
import copy from 'json-deep-copy'
import _ from 'lodash'
import './main.styl'

const {TabPane} = Tabs

export default class Main extends React.Component {

  state = {
    tasks: [],
    success: [],
    failed: [],
    loadingVoice: false,
    curretTarget: null,
    started: false,
    working: false
  }

  pause = () => {
    this.setState({
      curretTarget: null,
      working: false
    })
  }

  resume = () => {
    this.setState({
      working: true,
      curretTarget: this.state.tasks[0]
    })
  }

  onChange = (e, name) => {
    this.setState({
      [name]: e.target.value
    })
  }

  onReportId = null
  //this means one phone call finished
  //lets handle the result
  onReport = ({result, message, target = {}}) => {
    if (!this.state.working || !target.id) {
      return
    }
    if (this.onReportId === target.id) {
      return
    }
    this.onReportId = target.id
    this.setState(old => {
      let {id} = target
      let tasks = copy(old.tasks).filter(t => t.id !== id)
      let finalTarget = {
        ...target,
        result,
        message
      }
      if (result === 'success') {
        old.success.unshift(finalTarget)
      } else {
        old.failed.unshift(finalTarget)
      }
      old.tasks = tasks
      old.curretTarget = tasks[0]
      return old
    }, () => {
      this.onReportId = ''
    })
  }

  queue = async ({numbers, text}) => {
    let ns = numbers.split(/\s+/)
    let uri = await getVoiceFromText(text)
    if (!uri) {
      return
    }
    let tasks = ns.map(number => {
      return {
        number,
        voiceURI: uri,
        id: 'v-' + generate()
      }
    })
    this.setState(old => {
      old.tasks = [
        ...old.tasks,
        ...tasks
      ]
      return old
    }, this.afterQueue)
  }

  afterQueue = () => {
    let {tasks, started} = this.state
    if (!started && tasks.length) {
      this.setState({
        working: true,
        started: true,
        curretTarget: tasks[0] || null
      })
    }
  }

  renderCurrentTarget = () => {
    let {curretTarget} = this.state
    if (!curretTarget) {
      return null
    }
    let {
      number,
      voiceURI
    } = curretTarget
    return (
      <div className="current-target pd1">
        calling {number}...when connect, will play this audio clip:
        <audio src={voiceURI} className="iblock" controls />
      </div>
    )
  }

  styleMap = {
    tasks: {
      backgroundColor: '#fff',
      color: '#999',
      boxShadow: '0 0 0 1px #d9d9d9 inset'
    },
    success: {
      backgroundColor: '#52c41a'
    },
    failed: undefined
  }

  renderPaneTitle = (name, arr) => {
    return (
      <Badge
        count={arr.length}
        style={this.styleMap[name]}
      >
        <span className="iblock pd2x">{name}</span>
      </Badge>
    )
  }

  renderItem = item => {
    let {
      number,
      voiceURI,
      id
    } = item
    return (
      <div className="fix pd2" key={id}>
        <div className="fleft">
          {number}
        </div>
        <div className="fright">
          <audio src={voiceURI} controls />
        </div>
      </div>
    )
  }

  renderList = arr => {
    return (
      <List
        dataSource={arr}
        bordered
        renderItem={this.renderItem}
      />
    )
  }

  renderPane = (name) => {
    let arr = this.state[name]
    return (
      <TabPane
        key={name}
        tab={this.renderPaneTitle(name, arr)}
      >
        {
          this.renderList(arr)
        }
      </TabPane>
    )
  }

  renderQueueList = () => {
    let {
      working,
      started
    } = this.state
    let extra = started
      ? (
        <Button
          type="primary"
          onClick={
            working
              ? this.pause
              : this.resume
          }
        >
          {
            working
              ? 'pause'
              : 'resume'
          }
        </Button>
      )
      : null
    let arrNames = [
      'tasks',
      'success',
      'failed'
    ]
    return (
      <Tabs
        defaultActiveKey={arrNames[0]}
        tabBarExtraContent={extra}
      >
        {
          arrNames.map(this.renderPane)
        }
      </Tabs>
    )
  }

  renderProgress = () => {
    return (
      <div className="queue-process">
        {this.renderCurrentTarget()}
        {this.renderQueueList()}
      </div>
    )
  }

  render() {
    let {
      loadingVoice,
      curretTarget
    } = this.state
    return (
      <div className="auto-tel-main pd2">
        <p className="mg1b borderb">
          Automatically call numbers and play message from text.
        </p>
        <AutoTelForm
          queue={this.queue}
          loading={loadingVoice}
        />
        {this.renderProgress()}
        <CallHandler
          phone={this.props.phone}
          target={curretTarget}
          report={this.onReport}
        />
      </div>
    )
  }
}
