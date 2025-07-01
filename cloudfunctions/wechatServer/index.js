const cloud = require('wx-server-sdk')
const crypto = require('crypto')

// 云函数配置，支持HTTP触发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 微信公众号服务器云函数
 * 处理微信公众号的消息接收和验证
 * 支持HTTP触发器访问
 */
exports.main = async (event, context) => {
  console.log('wechatServer 接收到请求:', event)
  
  // 检查是否是HTTP触发器调用
  const isHTTPTrigger = event.httpMethod || event.path || event.headers
  
  if (isHTTPTrigger) {
    // HTTP触发器方式
    const { httpMethod, queryStringParameters, body, headers } = event
    
    try {
      // GET请求：微信服务器验证
      if (httpMethod === 'GET') {
        return handleVerification(queryStringParameters)
      }
      
      // POST请求：接收微信消息
      if (httpMethod === 'POST') {
        return await handleMessage(body, queryStringParameters)
      }
      
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'Method Not Allowed'
      }
      
    } catch (error) {
      console.error('HTTP触发器处理失败:', error)
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'Internal Server Error'
      }
    }
  } else {
    // 普通云函数调用方式（兼容）
    const { httpMethod, queryStringParameters, body } = event
    
    try {
      // GET请求：微信服务器验证
      if (httpMethod === 'GET') {
        return handleVerification(queryStringParameters)
      }
      
      // POST请求：接收微信消息
      if (httpMethod === 'POST') {
        return await handleMessage(body, queryStringParameters)
      }
      
      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      }
      
    } catch (error) {
      console.error('wechatServer 处理失败:', error)
      return {
        statusCode: 500,
        body: 'Internal Server Error'
      }
    }
  }
}

/**
 * 处理微信服务器验证
 */
function handleVerification(query) {
  const { signature, timestamp, nonce, echostr } = query
  const token = 'babyGrowthRecord2024' // 与公众号后台配置保持一致
  
  // 验证签名
  const arr = [token, timestamp, nonce].sort()
  const str = arr.join('')
  const sha1 = crypto.createHash('sha1').update(str).digest('hex')
  
  console.log('验证签名:', { signature, calculated: sha1 })
  
  if (signature === sha1) {
    console.log('微信验证成功')
    return {
      statusCode: 200,
      body: echostr
    }
  } else {
    console.log('微信验证失败')
    return {
      statusCode: 403,
      body: 'Forbidden'
    }
  }
}

/**
 * 处理微信消息
 */
async function handleMessage(xmlBody, query) {
  console.log('收到微信消息:', xmlBody)
  
  try {
    // 解析XML消息
    const message = parseXmlMessage(xmlBody)
    console.log('解析后的消息:', message)
    
    const { ToUserName, FromUserName, CreateTime, MsgType, MsgId } = message
    
    // 图片消息处理
    if (MsgType === 'image') {
      await handleImageMessage(message)
      return createTextResponse(FromUserName, ToUserName, '📸 收到照片！AI正在分析中，请稍等片刻...')
    }
    
    // 文本消息处理
    if (MsgType === 'text') {
      const content = message.Content
      
      // 检查是否是使用教程请求
      if (content.includes('帮助') || content.includes('教程') || content.includes('怎么用')) {
        const helpText = `🤖 宝宝成长记录助手使用方法：

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
        
        return createTextResponse(FromUserName, ToUserName, helpText)
      }
      
      // 检查是否有待处理的图片
      const pendingImage = await findPendingImage(FromUserName)
      if (pendingImage) {
        // 有待处理图片，将文本作为描述处理
        await processImageWithText(pendingImage, content, FromUserName)
        return createTextResponse(FromUserName, ToUserName, '✨ 正在生成AI故事，请在小程序中查看结果！')
      }
      
      // 普通文本回复
      return createTextResponse(FromUserName, ToUserName, '👋 你好！请发送宝宝照片开始记录成长时刻，或回复"帮助"查看使用教程。')
    }
    
    // 其他类型消息
    return createTextResponse(FromUserName, ToUserName, '🤖 我只能处理照片和文字哦，请发送宝宝照片开始记录！')
    
  } catch (error) {
    console.error('处理消息失败:', error)
    return createTextResponse('', '', '抱歉，处理消息时出现错误，请稍后重试。')
  }
}

/**
 * 处理图片消息
 */
async function handleImageMessage(message) {
  const { FromUserName, MediaId, MsgId, CreateTime } = message
  
  try {
    // 记录待处理的图片
    await db.collection('pending_images').add({
      data: {
        openid: FromUserName,
        mediaId: MediaId,
        msgId: MsgId,
        createTime: new Date(CreateTime * 1000),
        status: 'pending',
        processed: false
      }
    })
    
    console.log('图片消息已记录，等待文本描述')
    
  } catch (error) {
    console.error('记录图片消息失败:', error)
  }
}

/**
 * 查找待处理的图片
 */
async function findPendingImage(openid) {
  try {
    const result = await db.collection('pending_images')
      .where({
        openid: openid,
        processed: false
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()
    
    return result.data.length > 0 ? result.data[0] : null
  } catch (error) {
    console.error('查找待处理图片失败:', error)
    return null
  }
}

/**
 * 处理图片和文本组合
 */
async function processImageWithText(imageRecord, text, openid) {
  try {
    // 标记图片已处理
    await db.collection('pending_images').doc(imageRecord._id).update({
      data: {
        processed: true,
        description: text,
        processTime: new Date()
      }
    })
    
    // 下载微信图片并上传到云存储
    const imageUrl = await downloadAndUploadImage(imageRecord.mediaId)
    
    // 调用AI处理云函数
    const aiResult = await cloud.callFunction({
      name: 'aiProcessor',
      data: {
        imageUrl: imageUrl,
        userText: text,
        openid: openid,
        source: 'wechat',
        messageId: imageRecord.msgId,
        timestamp: new Date()
      }
    })
    
    console.log('AI处理完成:', aiResult.result)
    
  } catch (error) {
    console.error('处理图片文本组合失败:', error)
  }
}

/**
 * 下载微信图片并上传到云存储
 */
async function downloadAndUploadImage(mediaId) {
  // 注意：这里需要获取微信访问令牌来下载图片
  // 暂时返回占位符，实际部署时需要完善
  const cloudPath = `wechat/images/${mediaId}_${Date.now()}.jpg`
  
  // TODO: 实现真实的图片下载和上传逻辑
  console.log('需要下载媒体文件:', mediaId)
  
  return `cloud://temp-image-${mediaId}.jpg`
}

/**
 * 创建文本回复消息
 */
function createTextResponse(toUser, fromUser, content) {
  const timestamp = Math.floor(Date.now() / 1000)
  
  const xml = `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml'
    },
    body: xml
  }
}

/**
 * 解析XML消息
 */
function parseXmlMessage(xml) {
  const message = {}
  
  // 简单的XML解析（生产环境建议使用专业XML解析库）
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