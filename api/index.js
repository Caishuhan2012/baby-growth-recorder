const crypto = require('crypto')
const xml2js = require('xml2js')

// 微信公众号配置
const WECHAT_TOKEN = 'babyGrowthRecord2024'
const WECHAT_APPID = 'wx65271d6f2f1b3f21'

export default async function handler(req, res) {
  const { method, url, query, body } = req
  
  // 移除/api前缀来处理路径
  const path = url.replace('/api', '') || '/'
  
  console.log(`${new Date().toISOString()} - ${method} ${path}`)
  console.log('Query:', query)
  console.log('Headers:', req.headers)
  
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // 路由处理
  if (path === '/' || path === '/index') {
    // 根路径
    const serverInfo = {
      message: '宝宝成长记录 - 微信公众号服务器',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        wechat: '/api/wechat',
        health: '/api/health'
      },
      config: {
        token: WECHAT_TOKEN ? '已配置' : '未配置',
        appid: WECHAT_APPID ? '已配置' : '未配置'
      }
    }
    
    console.log('根路径访问:', serverInfo)
    return res.status(200).json(serverInfo)
  }
  
  if (path === '/health') {
    // 健康检查接口
    const healthData = {
      status: 'ok',
      message: '微信公众号服务器运行正常',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0'
    }
    
    console.log('健康检查请求:', healthData)
    return res.status(200).json(healthData)
  }
  
  if (path === '/wechat') {
    // 微信验证和消息处理
    console.log('微信接口请求:', method)
    
    if (method === 'GET') {
      // 微信服务器验证
      const { signature, timestamp, nonce, echostr } = query
      
      console.log('微信验证参数:')
      console.log('- signature:', signature)
      console.log('- timestamp:', timestamp) 
      console.log('- nonce:', nonce)
      console.log('- echostr:', echostr)
      
      // 检查是否有微信验证参数
      if (!signature && !timestamp && !nonce && !echostr) {
        // 直接访问，返回错误信息但状态码200
        console.log('❌ 直接访问微信接口，没有验证参数')
        return res.status(200).json({
          error: 'MISSING_PARAMS',
          message: '这是微信公众号验证接口，需要微信服务器调用',
          note: '请在微信公众号后台配置此URL进行验证'
        })
      }
      
      // 必须有所有验证参数
      if (!signature || !timestamp || !nonce || !echostr) {
        console.log('❌ 缺少部分验证参数')
        return res.status(200).send('error: missing parameters')
      }
      
      try {
        // 验证签名
        const token = WECHAT_TOKEN
        const arr = [token, timestamp, nonce].sort()
        const str = arr.join('')
        const sha1 = crypto.createHash('sha1').update(str).digest('hex')
        
        console.log('签名计算过程:')
        console.log('- Token:', token)
        console.log('- 排序后数组:', arr)
        console.log('- 拼接字符串:', str)
        console.log('- 计算SHA1:', sha1)
        console.log('- 微信签名:', signature)
        console.log('- 验证结果:', signature === sha1)
        
        if (signature === sha1) {
          console.log('✅ 验证成功，返回echostr:', echostr)
          return res.status(200).send(echostr)
        } else {
          console.log('❌ 签名验证失败')
          return res.status(200).send('error: signature verification failed')
        }
      } catch (error) {
        console.error('验证过程出错:', error)
        return res.status(200).send('error: internal server error')
      }
    } else if (method === 'POST') {
      // POST请求处理消息
      console.log('收到POST微信消息请求')
      console.log('消息内容:', body)
      
      try {
        // 解析XML消息
        const parser = new xml2js.Parser()
        const result = await parser.parseStringPromise(body)
        const message = result.xml
        
        console.log('解析后的消息:', JSON.stringify(message, null, 2))
        
        const fromUser = message.FromUserName[0]
        const toUser = message.ToUserName[0] 
        const msgType = message.MsgType[0]
        const createTime = Math.floor(Date.now() / 1000)
        
        let replyMsg = '👋 你好！这是宝宝成长记录助手，功能正在开发中...'
        
        // 构造回复消息XML
        const replyXml = `<xml>
<ToUserName><![CDATA[${fromUser}]]></ToUserName>
<FromUserName><![CDATA[${toUser}]]></FromUserName>
<CreateTime>${createTime}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${replyMsg}]]></Content>
</xml>`
        
        console.log('发送回复:', replyMsg)
        res.setHeader('Content-Type', 'text/xml')
        return res.status(200).send(replyXml)
        
      } catch (error) {
        console.error('处理消息失败:', error)
        return res.status(200).send('success')
      }
    } else {
      console.log('不支持的请求方法:', method)
      return res.status(200).send('error: method not allowed')
    }
  }
  
  // 404处理
  console.log('404 - 未找到路径:', path)
  return res.status(404).json({
    error: 'NOT_FOUND',
    message: `API路径 ${path} 未找到`,
    availableEndpoints: [
      '/api',
      '/api/health', 
      '/api/wechat'
    ],
    timestamp: new Date().toISOString()
  })
} 