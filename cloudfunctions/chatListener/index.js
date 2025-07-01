const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 微信聊天消息监听云函数
 * 功能：捕获用户发送至助理微信号的图片+文本消息
 * 输入：{ imageUrl: string, userText: string, openid: string }
 */
exports.main = async (event, context) => {
  console.log('chatListener 云函数开始执行', event)
  
  try {
    const { imageUrl, userText, openid } = event
    
    // 参数验证
    if (!imageUrl || !userText) {
      return {
        success: false,
        error: '缺少必要参数：imageUrl 或 userText'
      }
    }
    
    console.log('接收到消息:', {
      imageUrl,
      userText: userText.substring(0, 50) + '...', // 只记录前50字符
      openid
    })
    
    // 调用AI处理云函数
    const aiResult = await cloud.callFunction({
      name: 'aiProcessor',
      data: {
        imageUrl,
        userText,
        openid,
        timestamp: new Date()
      }
    })
    
    console.log('AI处理结果:', aiResult)
    
    return {
      success: true,
      data: aiResult.result,
      message: '消息处理成功'
    }
    
  } catch (error) {
    console.error('chatListener 执行失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
} 