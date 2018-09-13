/**
 * pack
 */

const {exec, echo, rm, cp, mkdir} = require('shelljs')
const cwd = process.cwd()

echo('start pack')

const timeStart = + new Date()
echo('clean')
exec('npm run clean')
exec('npm run ver')
exec('npm run build')

rm('-rf', 'work')
mkdir('-p', 'work/auto-tel')
cp('-r', [
  'app',
  'version',
  'config.default.js',
  'version',
  'node_modules',
  'data',
  'bin/pm2.yaml',
  'bin/update',
  'public',
  'src/views',
  'package.json'
], 'work/auto-tel/')
exec(`cd work/auto-tel && npm prune --production && cd ${cwd}`)
//yarn auto clean
cp('-r', 'bin/.yarnclean', 'work/auto-tel/')
exec(`cd work/auto-tel && yarn generate-lock-entry > yarn.lock && yarn autoclean --force && cd ${cwd}`)
rm('-rf',  'work/auto-tel/.yarnclean')
rm('-rf',  'work/auto-tel/package-lock.json')
rm('-rf',  'work/auto-tel/yarn.lock')
exec(`cd work && tar czf auto-tel.tar.gz auto-tel && cd ${cwd}`)

const endTime = +new Date()
echo(`done pack in ${(endTime - timeStart)/1000} s`)
