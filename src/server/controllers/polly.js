/**
 * aws polly api handler
 */

import * as Polly from '../services/polly'

export const polly = async (ctx) => {
  let {text} = ctx.q
  let uri = await Polly.getAudioResouce(text, ctx.local.cdn)
  ctx.body = {uri}
}
