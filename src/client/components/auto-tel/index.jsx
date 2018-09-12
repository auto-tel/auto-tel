import React from 'react'
import {Button, Card, Input, Icon} from 'antd'
import {getVoiceFromText} from '../../common/get-data'
import './main.styl'

const { TextArea } = Input

export default class Main extends React.Component {

  state = {
    numbers: '',
    text: '',
    tasks: [],
    success: [],
    failed: []
  }

  onChange = (e, name) => {
    this.setState({
      [name]: e.target.value
    })
  }

  renderProgress = () => {
    return (
      <div className="queue-process">

      </div>
    )
  }

  render() {
    let {
      numbers,
      text
    } = this.state
    return (
      <div className="auto-tel-main">
        <div className="numders-to-call pd1b">
          <TextArea
            placeholder="phone numbers to call, one number per line"
            value={numbers}
            onChange={e => this.onChange(e, 'numbers')}
          />
        </div>
        <div className="numders-to-call pd1b">
          <TextArea
            placeholder="text will read to target number"
            value={text}
            onChange={e => this.onChange(e, 'text')}
          />
        </div>
        <div clas="pd1y">
          <Button
            type="primary"
            onClick={this.queue}
          >
            queue
          </Button>
        </div>
        {this.renderProgress()}
      </div>
    )
  }
}
