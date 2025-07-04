const crypto = require('crypto')
const axios = require('axios')

// 微信公众号配置
const WECHAT_TOKEN = 'babyGrowthRecord2024'
const WECHAT_APPID = 'wx65271d6f2f1b3f21'
const WECHAT_APPSECRET = process.env.WECHAT_APPSECRET

// 小程序云开发配置
const CLOUD_HTTP_URL = process.env.CLOUD_HTTP_URL  // 云函数HTTP触发URL
const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN || 'default_auth_token_2024'

/**
 * Vercel部署的微信消息处理器
 * 完整处理微信消息并转发到小程序云开发
 */
export default async function handler(req, res) {
  const { method, query, body } = req
  
  // 设置响应头
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  console.log(`=== Vercel微信处理器 ===`)
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`方法: ${method}`)
  console.log(`Query:`, query)
  
  try {
    // GET请求：微信验证
    if (method === 'GET') {
      const verifyResult = handleWechatVerification(query)
      console.log('微信验证结果:', verifyResult)
      return res.status(200).send(verifyResult)
    }
    
    // POST请求：处理消息
    if (method === 'POST') {
      const replyXml = await handleWechatMessage(body)
      console.log('消息处理完成，返回回复')
      return res.status(200).send(replyXml)
    }
    
    return res.status(405).send('Method not allowed')
    
  } catch (error) {
    console.error('微信处理器错误:', error)
    return res.status(200).send('success')
  }
}

/**
 * 处理微信验证
 */
function handleWechatVerification(query) {
  const { signature, timestamp, nonce, echostr } = query
  
  if (!signature || !timestamp || !nonce || !echostr) {
    return 'Missing verification parameters'
  }
  
  // 验证签名
  const arr = [WECHAT_TOKEN, timestamp, nonce].sort()
  const str = arr.join('')
  const sha1 = crypto.createHash('sha1').update(str).digest('hex')
  
  if (signature === sha1) {
    console.log('✅ 微信验证成功')
    return echostr
  } else {
    console.log('❌ 微信验证失败')
    return 'Verification failed'
  }
}

/**
 * 处理微信消息
 */
async function handleWechatMessage(xmlBody) {
  console.log('处理微信消息:', xmlBody.substring(0, 200) + '...')
  
  try {
    // 解析XML消息
    const message = parseXmlMessage(xmlBody)
    console.log('解析后的消息:', message)
    
    const { FromUserName, ToUserName, MsgType, Content, MediaId, MsgId, CreateTime } = message
    
    // 构造消息数据
    const messageData = {
      messageId: MsgId,
      messageType: MsgType,
      fromUser: FromUserName,
      toUser: ToUserName,
      content: Content,
      mediaId: MediaId,
      createTime: CreateTime,
      timestamp: new Date()
    }
    
    // 异步处理消息（不等待结果）
    processMessageAsync(messageData).catch(error => {
      console.error('异步处理消息失败:', error)
    })
    
    // 立即返回回复
    let replyText = ''
    if (MsgType === 'text') {
      replyText = handleTextMessage(Content)
    } else if (MsgType === 'image') {
      replyText = '📸 收到照片！AI正在分析中，请稍等片刻...'
    } else {
      replyText = '🤖 我只能处理照片和文字哦，请发送宝宝照片开始记录！'
    }
    
    return createReplyXml(FromUserName, ToUserName, replyText)
    
  } catch (error) {
    console.error('处理消息失败:', error)
    return createReplyXml('', '', '抱歉，处理消息时出现错误，请稍后重试。')
  }
}

/**
 * 处理文本消息
 */
function handleTextMessage(content) {
  if (content.includes('帮助') || content.includes('教程') || content.includes('怎么用')) {
    return `🤖 宝宝成长记录助手使用方法：

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
  }
  
  return '👋 你好！请发送宝宝照片开始记录成长时刻，或回复"帮助"查看使用教程。'
}

/**
 * 异步处理消息
 */
async function processMessageAsync(messageData) {
  console.log('开始异步处理消息:', messageData.messageId)
  
  try {
    // 1. 记录消息日志
    await logMessageToCloud(messageData)
    
    // 2. 根据消息类型处理
    if (messageData.messageType === 'image') {
      await handleImageMessageAsync(messageData)
    } else if (messageData.messageType === 'text') {
      await handleTextMessageAsync(messageData)
    }
    
    console.log('消息处理完成:', messageData.messageId)
    
  } catch (error) {
    console.error('异步处理消息失败:', error)
  }
}

/**
 * 处理图片消息（异步）
 */
async function handleImageMessageAsync(messageData) {
  const { mediaId, fromUser, messageId, createTime } = messageData
  
  console.log('处理图片消息:', mediaId)
  
  try {
    // 1. 下载微信图片
    const imageBuffer = await downloadWechatImage(mediaId)
    
    // 2. 上传到云存储
    const imageUrl = await uploadToCloudStorage(imageBuffer, mediaId)
    
    // 3. 记录待处理图片
    await savePendingImage({
      openid: fromUser,
      mediaId: mediaId,
      imageUrl: imageUrl,
      messageId: messageId,
      createTime: new Date(createTime * 1000),
      status: 'pending',
      processed: false
    })
    
    console.log('图片消息处理完成:', imageUrl)
    
  } catch (error) {
    console.error('处理图片消息失败:', error)
  }
}

/**
 * 处理文本消息（异步）
 */
async function handleTextMessageAsync(messageData) {
  const { content, fromUser, messageId } = messageData
  
  console.log('处理文本消息:', content)
  
  try {
    // 查找待处理的图片
    const pendingImage = await findPendingImage(fromUser)
    
    if (pendingImage) {
      // 有待处理图片，调用AI处理
      console.log('找到待处理图片，开始AI处理')
      
      const aiResult = await callAIProcessor({
        imageUrl: pendingImage.imageUrl,
        userText: content,
        openid: fromUser,
        source: 'wechat',
        messageId: messageId
      })
      
      console.log('AI处理结果:', aiResult)
      
      // 标记图片已处理
      await markImageAsProcessed(pendingImage._id, content)
    }
    
  } catch (error) {
    console.error('处理文本消息失败:', error)
  }
}

/**
 * 下载微信图片
 */
async function downloadWechatImage(mediaId) {
  try {
    const accessToken = await getWechatAccessToken()
    const mediaUrl = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`
    
    console.log('下载微信图片:', mediaUrl)
    
    const response = await axios({
      method: 'get',
      url: mediaUrl,
      responseType: 'arraybuffer',
      timeout: 10000
    })
    
    console.log('图片下载成功，大小:', response.data.length)
    return Buffer.from(response.data)
    
  } catch (error) {
    console.error('下载微信图片失败:', error)
    throw error
  }
}

/**
 * 获取微信访问令牌
 */
async function getWechatAccessToken() {
  try {
    if (!WECHAT_APPSECRET) {
      throw new Error('微信AppSecret未配置')
    }
    
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}`
    
    const response = await axios.get(tokenUrl)
    
    if (response.data.access_token) {
      return response.data.access_token
    } else {
      throw new Error('获取access_token失败: ' + JSON.stringify(response.data))
    }
    
  } catch (error) {
    console.error('获取微信访问令牌失败:', error)
    throw error
  }
}

/**
 * 上传到云存储
 */
async function uploadToCloudStorage(imageBuffer, mediaId) {
  try {
    const result = await callCloudAPI('uploadImage', {
      imageBuffer: imageBuffer.toString('base64'),
      mediaId: mediaId
    })
    
    if (result.success) {
      console.log('云存储上传成功:', result.data.fileID)
      return result.data.fileID
    } else {
      throw new Error(result.error)
    }
    
  } catch (error) {
    console.error('上传到云存储失败:', error)
    
    // 返回占位符，确保流程继续
    const cloudPath = `wechat/images/${mediaId}_${Date.now()}.jpg`
    return `cloud://${cloudPath}`
  }
}

/**
 * 调用小程序云开发API
 */
async function callCloudAPI(action, data) {
  try {
    if (!CLOUD_HTTP_URL) {
      console.log('云函数HTTP URL未配置，返回模拟结果')
      return { success: true, data: {} }
    }
    
    console.log(`调用云函数: ${action}`, data)
    
    const response = await axios.post(CLOUD_HTTP_URL, {
      action: action,
      data: data
    }, {
      headers: {
        'Authorization': `Bearer ${VERCEL_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    
    console.log(`云函数${action}调用结果:`, response.data)
    return response.data
    
  } catch (error) {
    console.error(`调用云函数${action}失败:`, error.message)
    
    // 非关键操作失败时返回默认值，确保流程继续
    return { success: false, error: error.message }
  }
}

/**
 * 记录消息日志到云数据库
 */
async function logMessageToCloud(messageData) {
  return callCloudAPI('logMessage', messageData)
}

/**
 * 保存待处理图片
 */
async function savePendingImage(imageData) {
  return callCloudAPI('savePendingImage', imageData)
}

/**
 * 查找待处理图片
 */
async function findPendingImage(openid) {
  const result = await callCloudAPI('findPendingImage', { openid })
  return result.data
}

/**
 * 标记图片已处理
 */
async function markImageAsProcessed(imageId, description) {
  return callCloudAPI('markImageAsProcessed', { imageId, description })
}

/**
 * 调用AI处理器
 */
async function callAIProcessor(data) {
  return callCloudAPI('aiProcessor', data)
}

/**
 * 解析XML消息
 */
function parseXmlMessage(xml) {
  const message = {}
  
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