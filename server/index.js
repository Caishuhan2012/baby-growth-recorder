const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const xml2js = require('xml2js')
const app = express()

// 配置中间件
app.use(bodyParser.text({ type: 'text/xml' }))
app.use(bodyParser.urlencoded({ extended: true }))

// 微信公众号配置
const WECHAT_TOKEN = 'babyGrowthRecord2024'
const WECHAT_APPID = 'wx65271d6f2f1b3f21'  // 你的公众号AppID

console.log('微信公众号服务器启动中...')
console.log('配置信息:')
console.log('- Token:', WECHAT_TOKEN)
console.log('- AppID:', WECHAT_APPID)

/**
 * 微信服务器验证 (GET请求)
 */
app.get('/wechat', (req, res) => {
  console.log('收到微信验证请求:', req.query)
  
  const { signature, timestamp, nonce, echostr } = req.query
  
  // 验证签名
  const token = WECHAT_TOKEN
  const arr = [token, timestamp, nonce].sort()
  const str = arr.join('')
  const sha1 = crypto.createHash('sha1').update(str).digest('hex')
  
  console.log('签名验证:')
  console.log('- 微信签名:', signature)
  console.log('- 计算签名:', sha1)
  console.log('- 验证结果:', signature === sha1)
  
  if (signature === sha1) {
    console.log('✅ 微信验证成功，返回echostr:', echostr)
    res.send(echostr)
  } else {
    console.log('❌ 微信验证失败')
    res.status(403).send('验证失败')
  }
})

/**
 * 接收微信消息 (POST请求)
 */
app.post('/wechat', async (req, res) => {
  console.log('收到微信消息:', req.body)
  
  try {
    // 解析XML消息
    const parser = new xml2js.Parser()
    const result = await parser.parseStringPromise(req.body)
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
      
      // TODO: 这里将来集成AI处理逻辑
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
    res.set('Content-Type', 'text/xml')
    res.send(replyXml)
    
  } catch (error) {
    console.error('处理消息失败:', error)
    res.send('success')
  }
})

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '微信公众号服务器运行正常',
    timestamp: new Date().toISOString()
  })
})

/**
 * 根路径
 */
app.get('/', (req, res) => {
  res.json({
    message: '宝宝成长记录 - 微信公众号服务器',
    version: '1.0.0',
    endpoints: {
      wechat: '/wechat',
      health: '/health'
    }
  })
})

// 启动服务器
const PORT = process.env.PORT || 80
app.listen(PORT, () => {
  console.log(`🚀 服务器启动成功！`)
  console.log(`📍 端口: ${PORT}`)
  console.log(`🔗 访问地址: http://localhost:${PORT}`)
  console.log(`📱 微信接口: /wechat`)
  console.log(`❤️  健康检查: /health`)
}) 