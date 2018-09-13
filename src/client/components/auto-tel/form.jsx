import {Component} from 'react'
import {
  Form, Button, Input
} from 'antd'
import {validateFieldsAndScroll} from '../../common/dec-validate-and-scroll'
import InputAutoFocus from '../common/input-auto-focus'
import {formItemLayout, tailFormItemLayout} from '../../common/form-layout'

const {TextArea} = Input
const FormItem = Form.Item

@Form.create()
@validateFieldsAndScroll
class AutoTelForm extends Component {

  handleSubmit = async (e) => {
    e.preventDefault()
    let res = await this.validateFieldsAndScroll()
    if (!res) return
    this.props.queue(res)
    this.reset()
  }

  reset = () => {
    this.props.form.resetFields()
  }

  render() {
    const {getFieldDecorator} = this.props.form
    const {
      numbers,
      text
    } = this.props
    return (
      <Form onSubmit={this.handleSubmit} className="form-wrap">
        <FormItem
          {...formItemLayout}
          label="numbers"
          hasFeedback
        >
          {getFieldDecorator('numbers', {
            rules: [{
              max: 5000, message: '5000 chars max'
            }, {
              required: true, message: 'numbers required'
            }],
            initialValue: numbers
          })(
            <InputAutoFocus
              inputType="textarea"
              rows={10}
              placeholder="phone numbers to call, one number per line"
            />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="text"
          hasFeedback
        >
          {getFieldDecorator('text', {
            rules: [{
              max: 400, message: '400 chars max'
            }, {
              required: true, message: 'text required'
            }],
            initialValue: text
          })(
            <TextArea
              placeholder="text will read to target number"
            />
          )}
        </FormItem>
        <FormItem {...tailFormItemLayout}>
          <p>
            <Button
              type="primary"
              htmlType="submit"
              className="mg1r"
              loading={this.props.loading}
            >queue</Button>
            <Button
              type="ghost"
              onClick={this.reset}
            >reset</Button>
          </p>
        </FormItem>
      </Form>
    )
  }

}

export default AutoTelForm
