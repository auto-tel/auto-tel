/**
 * aws.polly service
 */

import config from '../config'
import AWS from 'aws-sdk'
import fs from 'fs'
import CryptoJS from 'crypto-js'

const fsPromises = fs.promises
const cwd = process.cwd()
const MAXLEN = 400

// Create an Polly client
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: config.awsServer
})

const params = {
  OutputFormat: 'mp3',
  TextType: 'text',
  VoiceId: config.VoiceId
}

const getAudioBuffer = (text) => {
  return new Promise((resolve, reject) => {
    Polly.synthesizeSpeech(
      {
        ...params,
        Text: text
      },
      (err, data) => {
        if (err) {
          return reject(err)
        }
        if (
          data ||
          data.AudioStream instanceof Buffer
        ) {
          return resolve(data.AudioStream)
        } else {
          reject(
            new Error('polly api returns no data')
          )
        }
      }
    )
  })
}

const createPathFromMD5 = (md5) => {
  return cwd + '/data/' + md5 + '.mp3'
}
const createURLFromMD5 = (md5, cdn) => {
  return cdn + '/data/' + md5 + '.mp3'
}

export const getAudioResouce = async (text, cdn) => {
  if (text.length > MAXLEN) {
    throw new Error(`text max length: ${MAXLEN}`)
  }
  let hash = CryptoJS.MD5(text)
  let fp = createPathFromMD5(hash)
  let exist = fs.existsSync(fp)
  if (exist) {
    return createURLFromMD5(hash, cdn)
  }
  let buf = await getAudioBuffer(text)
  await fsPromises.writeFile(
    fp,
    buf
  )
  return createURLFromMD5(hash, cdn)
}

