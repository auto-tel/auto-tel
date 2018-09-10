/**
 * aws polly api handler
 */

import Polly from '../services/polly'

export default async (ctx) => {
  let {text} = ctx.query
  let uri = await Polly.getAudioResouce(text, ctx.local.cdn)
  ctx.body = uri
}
