const crypto = require('crypto')

// 微信公众号配置
const WECHAT_TOKEN = 'babyGrowthRecord2024'

/**
 * 解析XML消息
 */
function parseXmlMessage(xml) {
  const message = {}
  
  // 简单的XML解析
  const patterns = {
    ToUserName: /<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/,
    FromUserName: /<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/,
    CreateTime: /<CreateTime>(\d+)<\/CreateTime>/,
    MsgType: /<MsgType><!\[CDATA\[(.*?)\]\]><\/MsgType>/,
    Content: /<Content><!\[CDATA\[(.*?)\]\]><\/Content>/,
    MediaId: /<MediaId><!\[CDATA\[(.*?)\]\]><\/MediaId>/,
    MsgId: /<MsgId>(\d+)<\/MsgId>/
  }
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = xml.match(pattern)
    if (match) {
      message[key] = match[1]
    }
  }
  
  return message
}

/**
 * 创建回复XML
 */
function createReplyXml(toUser, fromUser, content) {
  const timestamp = Math.floor(Date.now() / 1000)
  
  return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`
}

export default function handler(req, res) {
  const { method, query, headers, url, body } = req
  
  // 强制设置200状态码和正确的响应头
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // 记录详细日志
  console.log(`=== 微信接口请求开始 ===`)
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`方法: ${method}`)
  console.log(`URL: ${url}`)
  console.log(`Query:`, query)
  console.log(`Headers:`, JSON.stringify(headers, null, 2))
  
  // 处理OPTIONS预检请求
  if (method === 'OPTIONS') {
    console.log('🔧 处理OPTIONS预检请求')
    console.log('=== 微信接口请求结束 ===\n')
    return res.status(200).end()
  }
  
  // 处理GET请求（微信验证）
  if (method === 'GET') {
    console.log('🔍 处理微信验证请求')
    
    const { signature, timestamp, nonce, echostr } = query
    
    console.log('验证参数详情:')
    console.log(`- signature: ${signature || 'undefined'}`)
    console.log(`- timestamp: ${timestamp || 'undefined'}`) 
    console.log(`- nonce: ${nonce || 'undefined'}`)
    console.log(`- echostr: ${echostr || 'undefined'}`)
    
    // 如果没有任何验证参数，说明是直接访问
    if (!signature && !timestamp && !nonce && !echostr) {
      console.log('❌ 直接访问，无验证参数')
      console.log('=== 微信接口请求结束 ===\n')
      return res.status(200).send('WeChat verification endpoint. Please configure in WeChat backend.')
    }
    
    // 检查是否有完整的验证参数
    if (!signature || !timestamp || !nonce || !echostr) {
      console.log('❌ 验证参数不完整')
      console.log(`- 缺少参数: ${!signature ? 'signature ' : ''}${!timestamp ? 'timestamp ' : ''}${!nonce ? 'nonce ' : ''}${!echostr ? 'echostr' : ''}`)
      console.log('=== 微信接口请求结束 ===\n')
      return res.status(200).send('Missing verification parameters')
    }
    
    // 验证签名
    try {
      console.log('🔐 开始签名验证')
      const token = WECHAT_TOKEN
      const arr = [token, timestamp, nonce].sort()
      const str = arr.join('')
      const sha1 = crypto.createHash('sha1').update(str).digest('hex')
      
      console.log('签名计算详情:')
      console.log(`- Token: ${token}`)
      console.log(`- 参数数组: [${arr.join(', ')}]`)
      console.log(`- 拼接字符串: ${str}`)
      console.log(`- 计算SHA1: ${sha1}`)
      console.log(`- 微信签名: ${signature}`)
      console.log(`- 验证结果: ${signature === sha1}`)
      
      if (signature === sha1) {
        console.log('✅ 验证成功！返回 echostr')
        console.log(`✅ 返回内容: ${echostr}`)
        console.log('=== 微信接口请求结束 ===\n')
        return res.status(200).send(echostr)
      } else {
        console.log('❌ 签名验证失败')
        console.log('=== 微信接口请求结束 ===\n')
        return res.status(200).send('Signature verification failed')
      }
    } catch (error) {
      console.error('💥 验证过程异常:', error)
      console.error('💥 错误堆栈:', error.stack)
      console.log('=== 微信接口请求结束 ===\n')
      return res.status(200).send('Internal server error')
    }
  } 
  
  // 处理POST请求（接收消息）
  else if (method === 'POST') {
    console.log('📨 处理微信消息推送')
    console.log('请求体:', typeof body === 'string' ? body.substring(0, 200) + '...' : body)
    
    try {
      // 解析XML消息
      const message = parseXmlMessage(body)
      console.log('解析后的消息:', message)
      
      const { ToUserName, FromUserName, CreateTime, MsgType, Content, MediaId, MsgId } = message
      
      // 构造云函数调用参数
      const eventData = {
        messageId: MsgId,
        messageType: MsgType,
        fromUser: FromUserName,
        toUser: ToUserName,
        content: Content,
        mediaId: MediaId,
        createTime: CreateTime
      }
      
      // 这里需要调用云函数 wechatReceiver
      // 由于Vercel API无法直接调用云函数，我们先记录消息并返回响应
      console.log('消息解析完成，需要转发到云函数处理:', eventData)
      
      // 构造回复消息
      let replyText = ''
      if (MsgType === 'text') {
        if (Content.includes('帮助') || Content.includes('教程') || Content.includes('怎么用')) {
          replyText = `🤖 宝宝成长记录助手使用方法：

📸 发送照片：直接发送宝宝照片
✍️ 添加描述：照片后发送文字描述
🎯 AI处理：自动生成温暖故事和智能标签
📱 小程序查看：在"花生成长记录"小程序中查看完整记录

💡 示例：
1. 发送宝宝笑脸照片
2. 发送"宝宝今天第一次笑了，好开心！"
3. 等待AI生成成长故事
4. 在小程序中查看时光轴

回复"开始"体验功能！`
        } else {
          replyText = '👋 你好！请发送宝宝照片开始记录成长时刻，或回复"帮助"查看使用教程。'
        }
      } else if (MsgType === 'image') {
        replyText = '📸 收到照片！AI正在分析中，请稍等片刻...'
      } else {
        replyText = '🤖 我只能处理照片和文字哦，请发送宝宝照片开始记录！'
      }
      
      // 构造回复XML
      const replyXml = createReplyXml(FromUserName, ToUserName, replyText)
      
      console.log('发送回复消息:', replyText)
      console.log('=== 微信接口请求结束 ===\n')
      
      res.setHeader('Content-Type', 'application/xml')
      return res.status(200).send(replyXml)
      
    } catch (error) {
      console.error('💥 处理消息失败:', error)
      console.error('💥 错误堆栈:', error.stack)
      console.log('=== 微信接口请求结束 ===\n')
      return res.status(200).send('success')
    }
  } 
  
  // 不支持的方法
  else {
    console.log(`❌ 不支持的请求方法: ${method}`)
    console.log('=== 微信接口请求结束 ===\n')
    return res.status(200).send(`Method ${method} not allowed`)
  }
} 