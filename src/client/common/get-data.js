import fetch from './fetch'

/**
 * get voice from text
 * @param {text} text
 */

export const getVoiceFromText = async text => {
  let res = await fetch.get('/api/polly', {text})
  if (res) {
    return res.uri
  }
}
