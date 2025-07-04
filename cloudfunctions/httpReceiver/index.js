const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * HTTP接收器云函数
 * 接收来自Vercel的微信消息数据并处理
 * 支持HTTP触发器访问
 */
exports.main = async (event, context) => {
  console.log('httpReceiver 接收到请求:', event)
  
  try {
    // 检查是否是HTTP触发器调用
    const isHTTPTrigger = event.httpMethod || event.path || event.headers
    
    if (isHTTPTrigger) {
      // HTTP触发器方式
      const { httpMethod, body, headers } = event
      
      // 简单的身份验证
      const authToken = headers['authorization'] || headers['Authorization']
      if (!authToken || authToken !== 'Bearer ' + process.env.VERCEL_AUTH_TOKEN) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized' })
        }
      }
      
      if (httpMethod === 'POST') {
        const requestData = JSON.parse(body)
        const result = await processVercelRequest(requestData)
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        }
      }
      
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method Not Allowed' })
      }
    } else {
      // 直接云函数调用
      return await processVercelRequest(event)
    }
    
  } catch (error) {
    console.error('httpReceiver 处理失败:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      })
    }
  }
}

/**
 * 处理来自Vercel的请求
 */
async function processVercelRequest(requestData) {
  const { action, data } = requestData
  
  console.log('处理Vercel请求:', action, data)
  
  switch (action) {
    case 'logMessage':
      return await logMessage(data)
    case 'savePendingImage':
      return await savePendingImage(data)
    case 'findPendingImage':
      return await findPendingImage(data)
    case 'markImageAsProcessed':
      return await markImageAsProcessed(data)
    case 'aiProcessor':
      return await callAIProcessor(data)
    case 'uploadImage':
      return await uploadImage(data)
    default:
      throw new Error(`未知的action: ${action}`)
  }
}

/**
 * 记录消息日志
 */
async function logMessage(messageData) {
  try {
    const result = await db.collection('message_logs').add({
      data: {
        messageId: messageData.messageId,
        messageType: messageData.messageType,
        fromUser: messageData.fromUser,
        toUser: messageData.toUser,
        content: messageData.content,
        mediaId: messageData.mediaId,
        status: 'processing',
        createTime: new Date(),
        updateTime: new Date()
      }
    })
    
    console.log('消息日志记录成功:', result._id)
    return { success: true, data: { logId: result._id } }
    
  } catch (error) {
    console.error('记录消息日志失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 保存待处理图片
 */
async function savePendingImage(imageData) {
  try {
    const result = await db.collection('pending_images').add({
      data: {
        openid: imageData.openid,
        mediaId: imageData.mediaId,
        imageUrl: imageData.imageUrl,
        messageId: imageData.messageId,
        createTime: imageData.createTime,
        status: 'pending',
        processed: false
      }
    })
    
    console.log('待处理图片保存成功:', result._id)
    return { success: true, data: { imageId: result._id } }
    
  } catch (error) {
    console.error('保存待处理图片失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 查找待处理图片
 */
async function findPendingImage(queryData) {
  try {
    const result = await db.collection('pending_images')
      .where({
        openid: queryData.openid,
        processed: false
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()
    
    const pendingImage = result.data.length > 0 ? result.data[0] : null
    console.log('查找待处理图片结果:', pendingImage ? '找到' : '未找到')
    
    return { success: true, data: pendingImage }
    
  } catch (error) {
    console.error('查找待处理图片失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 标记图片已处理
 */
async function markImageAsProcessed(updateData) {
  try {
    const result = await db.collection('pending_images')
      .doc(updateData.imageId)
      .update({
        data: {
          processed: true,
          description: updateData.description,
          processTime: new Date()
        }
      })
    
    console.log('图片标记已处理:', result)
    return { success: true, data: result }
    
  } catch (error) {
    console.error('标记图片已处理失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 调用AI处理器
 */
async function callAIProcessor(aiData) {
  try {
    const result = await cloud.callFunction({
      name: 'aiProcessor',
      data: {
        imageUrl: aiData.imageUrl,
        userText: aiData.userText,
        openid: aiData.openid,
        source: aiData.source || 'wechat',
        messageId: aiData.messageId,
        timestamp: new Date()
      }
    })
    
    console.log('AI处理调用成功:', result.result)
    return { success: true, data: result.result }
    
  } catch (error) {
    console.error('调用AI处理器失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 上传图片到云存储
 */
async function uploadImage(uploadData) {
  try {
    const { imageBuffer, mediaId } = uploadData
    
    // 将base64转换为Buffer
    const buffer = Buffer.from(imageBuffer, 'base64')
    
    // 上传到云存储
    const cloudPath = `wechat/images/${mediaId}_${Date.now()}.jpg`
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer
    })
    
    console.log('图片上传成功:', uploadResult.fileID)
    return { success: true, data: { fileID: uploadResult.fileID } }
    
  } catch (error) {
    console.error('上传图片失败:', error)
    return { success: false, error: error.message }
  }
} 