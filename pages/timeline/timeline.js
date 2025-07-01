const app = getApp()

Page({
  data: {
    records: [],
    filterTags: ['全部', '宝宝的第一次', '成长曲线', '运动发展', '语言发展', '日常生活', '情感表达', '特殊时刻'],
    currentTag: '全部',
    showAddModal: false,
    tempImagePath: '',
    tempDescription: '',
    isLoading: false
  },

  onLoad() {
    console.log('时光轴页面加载')
    this.initCloud()
    this.loadRecords()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadRecords()
  },

  onPullDownRefresh() {
    this.loadRecords().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 初始化云开发
  async initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    
    try {
      await wx.cloud.init({
        env: 'your-env-id', // 需要替换为实际的云环境ID
        traceUser: true
      })
      console.log('云开发初始化成功')
    } catch (error) {
      console.error('云开发初始化失败:', error)
    }
  },

  // 加载成长记录
  async loadRecords() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      // 临时使用模拟数据，避免云开发环境错误
      const mockRecords = [
        {
          _id: 'mock1',
          imageUrl: 'https://picsum.photos/300/200?random=1',
          originalText: '宝宝今天第一次笑了，好开心！',
          story: '今天是个特别的日子，小宝贝绽放出了人生中第一个真正的笑容。那灿烂的笑脸如阳光般温暖，仿佛在告诉爸爸妈妈："我很快乐，我爱你们！"这一刻将永远珍藏在心中，成为家庭最珍贵的回忆。',
          tags: ['宝宝的第一次', '情感发展', '快乐时光'],
          createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          source: 'manual'
        },
        {
          _id: 'mock2',
          imageUrl: 'https://picsum.photos/300/200?random=2',
          originalText: '小天使安静地睡着了',
          story: '夜幕降临，小天使静静地进入了梦乡。月光透过窗帘洒在那张天真无邪的小脸上，呼吸轻柔而规律。在梦里，或许正在和小动物们玩耍，或许在妈妈的怀抱中感受无尽的爱。这份宁静美好，是成长路上最温柔的时光。',
          tags: ['安静时光', '健康成长', '甜美梦境'],
          createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          source: 'chat'
        },
        {
          _id: 'mock3',
          imageUrl: 'https://picsum.photos/300/200?random=3',
          originalText: '宝宝学会爬了！',
          story: '激动人心的时刻到了！小宝贝终于学会了爬行，这是探索世界的第一步。看着那股认真劲儿，一步一步向前爬，虽然还有些笨拙，但那份坚持和好奇心让人感动。这是独立成长的开始，也是冒险精神的萌芽。',
          tags: ['运动发展', '宝宝的第一次', '成长曲线'],
          createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          source: 'chat'
        }
      ]
      
      // 根据标签筛选模拟数据
      let filteredRecords = mockRecords
      if (this.data.currentTag && this.data.currentTag !== '全部') {
        filteredRecords = mockRecords.filter(record => 
          record.tags.includes(this.data.currentTag)
        )
      }
      
      // 处理数据格式
      const processedRecords = filteredRecords.map(record => ({
        ...record,
        dateText: this.formatDate(record.createTime),
        timeText: this.formatTime(record.createTime)
      }))
      
      this.setData({
        records: processedRecords
      })
      
      // 显示提示信息
      if (processedRecords.length > 0) {
        wx.showToast({
          title: '云开发环境配置中，当前显示模拟数据',
          icon: 'none',
          duration: 2000
        })
      }
      
    } catch (error) {
      console.error('加载记录失败:', error)
      // 即使是模拟数据也要处理错误
      this.setData({
        records: []
      })
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${month}/${day}`
  },

  // 格式化时间
  formatTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  },

  // 切换筛选标签
  switchTag(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({
      currentTag: tag
    })
    this.loadRecords()
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 显示添加模态框
  showAddModal() {
    this.setData({
      showAddModal: true,
      tempImagePath: '',
      tempDescription: ''
    })
  },

  // 隐藏添加模态框
  hideAddModal() {
    this.setData({
      showAddModal: false,
      tempImagePath: '',
      tempDescription: ''
    })
  },

  // 阻止模态框关闭
  preventClose() {
    // 阻止事件冒泡
  },

  // 选择图片
  async chooseImage() {
    try {
      const result = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })
      
      if (result.tempFiles && result.tempFiles.length > 0) {
        this.setData({
          tempImagePath: result.tempFiles[0].tempFilePath
        })
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      wx.showToast({
        title: '选择图片失败',
        icon: 'error'
      })
    }
  },

  // 描述内容输入
  onDescriptionInput(e) {
    this.setData({
      tempDescription: e.detail.value
    })
  },

  // 提交记录
  async submitRecord() {
    const { tempImagePath, tempDescription } = this.data
    
    if (!tempImagePath || !tempDescription.trim()) {
      wx.showToast({
        title: '请完善信息',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ isLoading: true })
      wx.showLoading({ title: 'AI生成中...' })
      
      // 1. 上传图片到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: `growth_images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
        filePath: tempImagePath
      })
      
      console.log('图片上传成功:', uploadResult)
      
      // 2. 调用AI处理云函数
      const aiResult = await wx.cloud.callFunction({
        name: 'aiProcessor',
        data: {
          imageUrl: uploadResult.fileID,
          userText: tempDescription,
          openid: '', // 会自动注入
          timestamp: new Date()
        }
      })
      
      console.log('AI处理结果:', aiResult)
      
      if (aiResult.result.success) {
        wx.showToast({
          title: '记录生成成功',
          icon: 'success'
        })
        
        // 隐藏模态框并刷新数据
        this.hideAddModal()
        this.loadRecords()
      } else {
        throw new Error(aiResult.result.error || 'AI处理失败')
      }
      
    } catch (error) {
      console.error('提交记录失败:', error)
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'error'
      })
    } finally {
      this.setData({ isLoading: false })
      wx.hideLoading()
    }
  },

  // 图片加载成功
  onImageLoad() {
    console.log('图片加载成功')
  },

  // 图片加载失败
  onImageError(e) {
    console.error('图片加载失败:', e)
  },

  // 导航功能
  goToTimeline() {
    // 当前页面，无需跳转
  },

  goToChat() {
    wx.navigateTo({
      url: '/pages/chat/chat'
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '我的宝宝成长时光轴',
      path: '/pages/timeline/timeline',
      imageUrl: '/images/share-cover.jpg'
    }
  },

  onShareTimeline() {
    return {
      title: '记录宝宝成长的每一个美好瞬间'
    }
  }
}) 