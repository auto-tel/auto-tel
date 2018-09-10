/**
 * router defs
 */
import Router from 'koa-router'
import {polly} from '../controllers'

const prefix = 'api'
export default (app) => {
  let router = new Router()
  router.get(`/${prefix}/polly`, polly)
  app
    .use(router.routes())
    .use(router.allowedMethods())
}
