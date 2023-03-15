const router = require('koa-router')()

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: '查询'
  })
})

router.get('/upload', async (ctx, next) => {
  await ctx.render('upload', {
    title: '上传'
  })
})

module.exports = router
