const cloud = require('wx-server-sdk')
const axios = require('axios')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * AI处理云函数
 * 功能：调用AI服务生成叙事文本并存储数据
 */
exports.main = async (event, context) => {
  console.log('aiProcessor 云函数开始执行', event)
  
  try {
    const { imageUrl, userText, openid, timestamp, source, messageId } = event
    
    // 1. 使用腾讯云AI识别图片内容（模拟实现）
    const imageAnalysis = await analyzeImage(imageUrl)
    console.log('图片分析结果:', imageAnalysis)
    
    // 2. 调用DeepSeek API生成故事
    const story = await generateStory(imageAnalysis, userText)
    console.log('生成的故事:', story)
    
    // 3. 根据用户文本提取标签
    const tags = generateTags(userText)
    console.log('生成的标签:', tags)
    
    // 4. 存储到云数据库
    const recordData = {
      imageUrl,
      originalText: userText,
      story,
      tags,
      imageAnalysis,
      openid,
      source: source || 'unknown', // 记录来源：wechat/chat/manual
      messageId: messageId || null, // 微信消息ID
      timestamp: timestamp || new Date(),
      createTime: db.serverDate()
    }
    
    const result = await db.collection('growth_records').add({
      data: recordData
    })
    
    console.log('数据库存储结果:', result)
    
    return {
      success: true,
      data: {
        recordId: result._id,
        story,
        tags,
        imageAnalysis
      },
      message: 'AI处理并存储成功'
    }
    
  } catch (error) {
    console.error('aiProcessor 执行失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}

/**
 * 图片分析函数（腾讯云AI集成）
 */
async function analyzeImage(imageUrl) {
  try {
    // TODO: 集成腾讯云图像识别API
    // 这里先返回模拟数据
    const mockAnalysis = {
      objects: ['婴儿', '玩具', '床'],
      scenes: ['卧室', '温馨', '柔和光线'],
      emotions: ['快乐', '好奇'],
      colors: ['粉色', '白色', '暖色调']
    }
    
    // 实际实现时的代码框架：
    // const tencentAI = require('tencentcloud-sdk-nodejs')
    // const client = new tencentAI.tiia.v20190529.Client({...})
    // const response = await client.DetectLabel({ImageUrl: imageUrl})
    
    return mockAnalysis
  } catch (error) {
    console.error('图片分析失败:', error)
    return {
      objects: ['宝宝'],
      scenes: ['日常'],
      emotions: ['温馨'],
      colors: ['自然']
    }
  }
}

/**
 * DeepSeek API调用生成故事
 */
async function generateStory(imageAnalysis, userText) {
  try {
    const prompt = createStoryPrompt(imageAnalysis, userText)
    
    // TODO: 集成DeepSeek API
    // 这里先返回模拟生成的故事
    const mockStory = generateMockStory(imageAnalysis, userText)
    
    // 实际API调用代码框架：
    // const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    //   model: 'deepseek-chat',
    //   messages: [{ role: 'user', content: prompt }],
    //   max_tokens: 200
    // }, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // })
    
    return mockStory
  } catch (error) {
    console.error('故事生成失败:', error)
    return `今天，小宝贝又有了新的成长足迹。${userText}，这一刻值得永远珍藏。`
  }
}

/**
 * 创建故事生成提示词
 */
function createStoryPrompt(imageAnalysis, userText) {
  const { objects, scenes, emotions } = imageAnalysis
  
  return `图片内容：${objects.join(', ')}；场景：${scenes.join(', ')}；
用户描述：${userText}；
请生成一段80字左右的中文故事，风格温暖优雅，适合记录宝宝成长时光。`
}

/**
 * 模拟故事生成（用于测试）
 */
function generateMockStory(imageAnalysis, userText) {
  const storyTemplates = [
    `阳光透过窗帘洒在房间里，小宝贝${userText}。这一刻，时光仿佛为TA而停留，温馨的画面定格在这个美好的瞬间。`,
    `今天是特别的一天，小天使${userText}。每一个成长的足迹都闪闪发光，记录着生命中最珍贵的时光。`,
    `在这个充满爱的时刻，宝贝${userText}。家人的陪伴，温暖的怀抱，构成了最美的成长故事。`
  ]
  
  const randomIndex = Math.floor(Math.random() * storyTemplates.length)
  return storyTemplates[randomIndex]
}

/**
 * 智能标签生成函数
 */
function generateTags(userText) {
  const tags = []
  
  // 第一次相关
  if (userText.includes('第一次')) {
    tags.push('宝宝的第一次')
  }
  
  // 成长指标相关
  if (userText.includes('身高') || userText.includes('体重') || userText.includes('长高') || userText.includes('重了')) {
    tags.push('成长曲线')
  }
  
  // 技能发展相关
  if (userText.includes('爬') || userText.includes('坐') || userText.includes('站') || userText.includes('走')) {
    tags.push('运动发展')
  }
  
  if (userText.includes('说话') || userText.includes('叫') || userText.includes('喊')) {
    tags.push('语言发展')
  }
  
  // 日常生活相关
  if (userText.includes('吃饭') || userText.includes('喝奶') || userText.includes('睡觉')) {
    tags.push('日常生活')
  }
  
  // 情感表达相关
  if (userText.includes('笑') || userText.includes('哭') || userText.includes('高兴') || userText.includes('开心')) {
    tags.push('情感表达')
  }
  
  // 特殊节日相关
  if (userText.includes('生日') || userText.includes('节日') || userText.includes('过年')) {
    tags.push('特殊时刻')
  }
  
  // 如果没有匹配到特定标签，添加默认标签
  if (tags.length === 0) {
    tags.push('成长记录')
  }
  
  return tags
} 