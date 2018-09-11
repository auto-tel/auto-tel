import fetch from './fetch'

/**
 * get voice from text
 * @param {text} text
 */

export const getVoiceFromText = text => {
  return fetch.get('/api/polly', {text})
}
