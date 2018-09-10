/**
 * 各系统图标生成程序
 */

const {resolve} = require('path')
const {exec, echo} = require('shelljs')
const dir = resolve(__dirname, '../../auto-tel-resource/build')
const src = resolve(__dirname, '../../auto-tel-resource/static/images/auto-tel-grey-1024x1024.png')
const bin = './node_modules/.bin'


echo('start build')

const timeStart = + new Date()

echo('clean')

echo('building icons')
exec(`${bin}/png2icons ${src} ${dir}/icons -allp`)

const endTime = +new Date()
echo(`done in ${(endTime - timeStart)/1000} s`)
