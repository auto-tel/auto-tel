/**
 * view factory
 */

export const view = (name) => {
  return async (ctx) => {
    ctx.render(name, ctx.local)
  }
}
