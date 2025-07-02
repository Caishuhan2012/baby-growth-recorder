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
    if (method === 'GET') {
      // 微信服务器验证
      console.log('收到微信验证请求:', query)
      
      const { signature, timestamp, nonce, echostr } = query
      
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
      
      if (!signature || !timestamp || !nonce || !echostr) {
        console.log('❌ 缺少部分验证参数')
        return res.status(400).json({
          error: 'INVALID_PARAMS',
          message: '验证参数不完整',
          required: ['signature', 'timestamp', 'nonce', 'echostr'],
          received: { signature: !!signature, timestamp: !!timestamp, nonce: !!nonce, echostr: !!echostr }
        })
      }
      
      // 验证签名
      const token = WECHAT_TOKEN
      const arr = [token, timestamp, nonce].sort()
      const str = arr.join('')
      const sha1 = crypto.createHash('sha1').update(str).digest('hex')
      
      console.log('签名验证:')
      console.log('- 微信签名:', signature)
      console.log('- 计算签名:', sha1)
      console.log('- 验证结果:', signature === sha1)
      console.log('- Token:', token)
      console.log('- 排序参数:', arr)
      console.log('- 拼接字符串:', str)
      
      if (signature === sha1) {
        console.log('✅ 微信验证成功，返回echostr:', echostr)
        return res.status(200).send(echostr)
      } else {
        console.log('❌ 微信验证失败')
        return res.status(200).json({
          error: 'SIGNATURE_FAILED',
          message: '签名验证失败',
          debug: {
            received_signature: signature,
            calculated_signature: sha1,
            token: token,
            timestamp: timestamp,
            nonce: nonce
          }
        })
      }
    }
    
    if (method === 'POST') {
      // 接收微信消息
      console.log('收到微信消息:', body)
      
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
        
        let replyMsg = ''
        
        // 处理不同类型的消息
        if (msgType === 'text') {
          const content = message.Content[0]
          console.log('收到文本消息:', content)
          
          if (content.includes('帮助') || content.includes('教程')) {
            replyMsg = `🤖 宝宝成长记录助手

📸 使用方法：
1. 发送宝宝照片
2. 发送文字描述
3. AI自动生成成长故事
4. 在小程序中查看记录

💡 示例：
发送照片后输入"宝宝今天第一次笑了"

🔗 打开小程序查看完整记录`
          } else {
            replyMsg = `👋 你好！

📱 这是宝宝成长记录助手
📸 请发送宝宝照片开始记录成长时刻
❓ 回复"帮助"查看使用教程

🎯 让AI帮你记录宝宝的每个珍贵瞬间！`
          }
        } else if (msgType === 'image') {
          const mediaId = message.MediaId[0]
          console.log('收到图片消息, MediaId:', mediaId)
          
          replyMsg = `📸 收到照片！

🤖 AI正在分析中...
✍️ 请发送文字描述来完善这个成长记录

💡 例如："宝宝今天学会爬了，好开心！"`
        } else {
          replyMsg = `🤖 抱歉，我只能处理文字和图片消息

📸 请发送宝宝照片开始记录
❓ 回复"帮助"查看使用教程`
        }
        
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
    }
    
    // 不支持的方法
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: '不支持的请求方法',
      allowedMethods: ['GET', 'POST']
    })
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