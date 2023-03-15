const path = require('path')
const fs = require('fs-extra')

const Koa = require('koa')
const body = require('koa-body')
const json = require('koa-json')
const views = require('koa-views')
const logger = require('koa-logger')
const onerror = require('koa-onerror')

const apis = require('./routes/apis')
const index = require('./routes/index')

const tmpDir = path.join(__dirname,'./tmp')
fs.ensureDirSync(tmpDir)

const app = new Koa()

// error handler
onerror(app)

// middlewares
app.use(body.default({
  multipart: true,
  formidable: {
    uploadDir: tmpDir,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 设置上传文件大小最大限制，默认2M
  },
}))

app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(apis.routes(), apis.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
