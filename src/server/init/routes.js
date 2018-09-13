/**
 * router defs
 */
import Router from 'koa-router'
import {polly, view} from '../controllers'

const prefix = 'api'
export default (app) => {
  let router = new Router()
  router
    .get('/', view('index'))
    .get('/redirect.html', view('redirect'))
    .get('/proxy.html', view('proxy'))
    .get(`/${prefix}/polly`, polly)
  app
    .use(router.routes())
    .use(router.allowedMethods())
}
