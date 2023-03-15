const fs = require('fs-extra')
const path = require('path')
const xlsx = require('node-xlsx')
const router = require('koa-router')()

router.prefix('/apis')

const dataFile = path.join(__dirname,'../data/data.json')

router.get('/__clear__', async (ctx, next) => {
  fs.removeSync(dataFile)
  ctx.body = { success: true }
})

router.get('/find', async (ctx, next) => {
  const query = ctx.request.query
  if (!query.type) {
    ctx.body = {
      success: false,
      message: '参数不能为空'
    }
    return
  }
  let result = {}
  if (fs.existsSync(dataFile)) {
    result = fs.readJSONSync(dataFile)
  }

  // const { city, brand, company } = current
  const brands = Object.keys(result)
  for (const brand of brands) {
    const brandData = result[brand]
    const companies = Object.keys(brandData)
    for (const company of companies) {
      const typeList = brandData[company]
      if (typeList.length && typeList.includes(query.type)) {
        ctx.body = {
          success: true,
          data: {
            type: query.type,
            brand,
            company,
          }
        }
        return
      }
    }
  }

  ctx.body = {
    success: false,
    message: '气源适配性目录中找不到该型号'
  }
})

router.post('/upload', async (ctx, next) => {
  const file = ctx.request.files?.file
  if (!file) {
    ctx.body = {
      success: false,
      message: '文件不存在'
    }
    return
  }
  const filepath = file.filepath
  const sheets = xlsx.parse(filepath)

  if (!sheets.length) {
    ctx.body = {
      success: false,
      message: '页面不存在'
    }
    return
  }
  
  const sheet = sheets[0]
  const data = sheet.data

  let result = {}
  if (fs.existsSync(dataFile)) {
    result = fs.readJSONSync(dataFile)
  }

  // 输出每行内容
  let current = {}
  data.forEach(row => {
    if (row.length !== 5) {
      return
    }
    const [idx, rBrand, rType, rCompany, rCity] = row
    if (rBrand === undefined && rCompany !== undefined) {
      current.company = rCompany.trim()
    } else if (idx !== undefined) {
      current.city = rCity.trim()
      if (rCompany !== undefined) {
        current.company = rCompany.trim()
      }
      if (rBrand !== undefined) {
        current.brand = rBrand.trim()
      }
    }
    if (rType === undefined) {
      return
    }
    const type = rType.trim()
    const { city, brand, company } = current
    if (city !== '长沙市') {
      return
    }
    if (!result[brand]) {
      result[brand] = {}
    }
    if (!result[brand][company]) {
      result[brand][company] = []
    }
    if (!result[brand][company].includes(type)) {
      result[brand][company].push(type)
    }
  })
  
  fs.ensureFileSync(dataFile)
  fs.writeJSONSync(dataFile, result, { spaces: 2 })

  ctx.body = {
    success: true
  }
})

module.exports = router
