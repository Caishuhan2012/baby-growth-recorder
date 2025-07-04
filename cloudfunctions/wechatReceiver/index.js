const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const axios = require('axios')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 微信消息接收器云函数
 * 功能：接收来自微信公众号的消息，进行预处理和转发
 */
exports.main = async (event, context) => {
  console.log('wechatReceiver 云函数开始执行', event)
  
  try {
    const { 
      messageId, 
      messageType, 
      fromUser, 
      toUser, 
      content, 
      mediaId, 
      createTime 
    } = event
    
    // 参数验证
    if (!messageId || !messageType || !fromUser) {
      return {
        success: false,
        error: '缺少必要参数：messageId, messageType, fromUser'
      }
    }
    
    console.log('接收到微信消息:', {
      messageId,
      messageType,
      fromUser,
      content: content ? content.substring(0, 50) + '...' : '',
      mediaId
    })
    
    // 消息去重检查
    const existingMessage = await checkMessageDuplicate(messageId)
    if (existingMessage) {
      console.log('消息重复，跳过处理')
      return {
        success: true,
        message: '消息重复，已跳过处理'
      }
    }
    
    // 记录消息日志
    await logMessage(messageId, messageType, fromUser, 'processing')
    
    // 根据消息类型处理
    let result
    if (messageType === 'text') {
      result = await handleTextMessage(event)
    } else if (messageType === 'image') {
      result = await handleImageMessage(event)
    } else {
      result = await handleOtherMessage(event)
    }
    
    // 更新消息状态
    await updateMessageStatus(messageId, result.success ? 'completed' : 'failed', result)
    
    return result
    
  } catch (error) {
    console.error('wechatReceiver 执行失败:', error)
    
    // 记录错误日志
    if (event.messageId) {
      await updateMessageStatus(event.messageId, 'failed', {
        error: error.message,
        stack: error.stack
      })
    }
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}

/**
 * 检查消息是否重复
 */
async function checkMessageDuplicate(messageId) {
  try {
    const result = await db.collection('message_logs')
      .where({
        messageId: messageId
      })
      .limit(1)
      .get()
    
    return result.data.length > 0
  } catch (error) {
    console.error('检查消息重复失败:', error)
    return false
  }
}

/**
 * 记录消息日志
 */
async function logMessage(messageId, messageType, fromUser, status) {
  try {
    await db.collection('message_logs').add({
      data: {
        messageId,
        messageType,
        fromUser,
        status,
        createTime: new Date(),
        updateTime: new Date()
      }
    })
  } catch (error) {
    console.error('记录消息日志失败:', error)
  }
}

/**
 * 更新消息状态
 */
async function updateMessageStatus(messageId, status, result) {
  try {
    await db.collection('message_logs')
      .where({
        messageId: messageId
      })
      .update({
        data: {
          status,
          result,
          updateTime: new Date()
        }
      })
  } catch (error) {
    console.error('更新消息状态失败:', error)
  }
}

/**
 * 处理文本消息
 */
async function handleTextMessage(event) {
  const { content, fromUser, messageId } = event
  
  console.log('处理文本消息:', content)
  
  try {
    // 检查是否有待处理的图片
    const pendingImage = await findPendingImage(fromUser)
    
    if (pendingImage) {
      // 有待处理图片，作为描述文本处理
      console.log('找到待处理图片，开始组合处理')
      
      // 调用AI处理云函数
      const aiResult = await cloud.callFunction({
        name: 'aiProcessor',
        data: {
          imageUrl: pendingImage.imageUrl,
          userText: content,
          openid: fromUser,
          source: 'wechat',
          messageId: messageId,
          timestamp: new Date()
        }
      })
      
      console.log('AI处理结果:', aiResult.result)
      
      // 标记图片已处理
      await markImageAsProcessed(pendingImage._id, content)
      
      return {
        success: true,
        type: 'image_with_text',
        data: aiResult.result,
        message: '图片+文本处理完成'
      }
    } else {
      // 普通文本消息
      console.log('普通文本消息，无需特殊处理')
      return {
        success: true,
        type: 'text_only',
        message: '文本消息已记录'
      }
    }
    
  } catch (error) {
    console.error('处理文本消息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 处理图片消息
 */
async function handleImageMessage(event) {
  const { mediaId, fromUser, messageId, createTime } = event
  
  console.log('处理图片消息:', mediaId)
  
  try {
    // 下载微信图片并上传到云存储
    const imageUrl = await downloadAndUploadWechatImage(mediaId)
    
    // 记录待处理的图片
    await db.collection('pending_images').add({
      data: {
        openid: fromUser,
        mediaId: mediaId,
        imageUrl: imageUrl,
        messageId: messageId,
        createTime: new Date(createTime * 1000),
        status: 'pending',
        processed: false
      }
    })
    
    console.log('图片消息已记录，等待文本描述')
    
    return {
      success: true,
      type: 'image_only',
      data: {
        imageUrl: imageUrl,
        mediaId: mediaId
      },
      message: '图片已接收，等待文本描述'
    }
    
  } catch (error) {
    console.error('处理图片消息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 处理其他类型消息
 */
async function handleOtherMessage(event) {
  const { messageType } = event
  
  console.log('处理其他类型消息:', messageType)
  
  return {
    success: true,
    type: 'other',
    message: `已接收${messageType}类型消息，暂不处理`
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
 * 标记图片已处理
 */
async function markImageAsProcessed(imageId, description) {
  try {
    await db.collection('pending_images').doc(imageId).update({
      data: {
        processed: true,
        description: description,
        processTime: new Date()
      }
    })
  } catch (error) {
    console.error('标记图片已处理失败:', error)
  }
}

/**
 * 下载微信图片并上传到云存储
 */
async function downloadAndUploadWechatImage(mediaId) {
  try {
    // 获取微信访问令牌
    const accessToken = await getWechatAccessToken()
    
    if (accessToken === 'placeholder_access_token') {
      console.log('使用占位符token，跳过真实下载')
      return `cloud://wechat/placeholder/${mediaId}.jpg`
    }
    
    // 构造微信媒体文件下载URL
    const mediaUrl = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`
    
    console.log('开始下载微信图片:', mediaUrl)
    
    // 使用axios下载图片
    const response = await axios({
      method: 'get',
      url: mediaUrl,
      responseType: 'arraybuffer'
    })
    
    console.log('图片下载成功，大小:', response.data.length)
    
    // 上传到云存储
    const cloudPath = `wechat/images/${mediaId}_${Date.now()}.jpg`
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: Buffer.from(response.data)
    })
    
    console.log('图片上传成功:', uploadResult.fileID)
    
    return uploadResult.fileID
    
  } catch (error) {
    console.error('下载上传微信图片失败:', error)
    
    // 返回占位符，确保流程继续
    const placeholderPath = `wechat/placeholder/${mediaId}.jpg`
    console.log('使用占位符:', placeholderPath)
    
    return `cloud://${placeholderPath}`
  }
}

/**
 * 获取微信访问令牌
 */
async function getWechatAccessToken() {
  try {
    // 从环境变量或云存储获取配置
    const appId = process.env.WECHAT_APPID || 'wx65271d6f2f1b3f21'
    const appSecret = process.env.WECHAT_APPSECRET
    
    if (!appSecret || appSecret === 'your_app_secret_here') {
      console.log('需要配置微信AppSecret获取access_token')
      return 'placeholder_access_token'
    }
    
    // 检查是否有缓存的token
    const cachedToken = await getCachedAccessToken()
    if (cachedToken && cachedToken.expireTime > Date.now()) {
      console.log('使用缓存的access_token')
      return cachedToken.token
    }
    
    // 调用微信API获取access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
    
    console.log('请求新的access_token')
    const response = await axios.get(tokenUrl)
    
    if (response.data.access_token) {
      // 缓存token（有效期7200秒，提前5分钟过期）
      await cacheAccessToken(response.data.access_token, Date.now() + (7200 - 300) * 1000)
      console.log('获取access_token成功')
      return response.data.access_token
    } else {
      console.error('获取access_token失败:', response.data)
      return 'placeholder_access_token'
    }
    
  } catch (error) {
    console.error('获取微信访问令牌失败:', error)
    return 'placeholder_access_token'
  }
}

/**
 * 获取缓存的访问令牌
 */
async function getCachedAccessToken() {
  try {
    const result = await db.collection('wechat_config')
      .where({
        type: 'access_token'
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()
    
    return result.data.length > 0 ? result.data[0] : null
  } catch (error) {
    console.error('获取缓存token失败:', error)
    return null
  }
}

/**
 * 缓存访问令牌
 */
async function cacheAccessToken(token, expireTime) {
  try {
    await db.collection('wechat_config').add({
      data: {
        type: 'access_token',
        token,
        expireTime,
        createTime: new Date()
      }
    })
  } catch (error) {
    console.error('缓存token失败:', error)
  }
} 