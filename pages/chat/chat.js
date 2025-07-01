const app = getApp()

Page({
  data: {
    chatRecords: [],
    showGuide: false,
    loading: false,
    showSimulator: false,
    simulatorImagePath: '',
    simulatorText: ''
  },

  onLoad() {
    console.log('聊天记录页面加载')
    this.loadChatRecords()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadChatRecords()
  },

  onPullDownRefresh() {
    this.loadChatRecords().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载聊天记录
  async loadChatRecords() {
    try {
      this.setData({ loading: true })
      wx.showLoading({ title: '加载中...' })
      
      const db = app.getDatabase()
      const result = await db.collection('growth_records')
        .where({
          source: 'chat' // 只获取来自聊天的记录
        })
        .orderBy('createTime', 'desc')
        .get()
      
      console.log('聊天记录查询结果:', result)
      
      // 处理数据格式
      const processedRecords = result.data.map(record => ({
        ...record,
        timeText: this.formatTime(record.createTime),
        dateText: this.formatDate(record.createTime)
      }))
      
      this.setData({
        chatRecords: processedRecords
      })
      
    } catch (error) {
      console.error('加载聊天记录失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
      wx.hideLoading()
    }
  },

  // 格式化时间
  formatTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${month}/${day}`
  },

  // 查看聊天详情
  viewChatDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&source=chat`
    })
  },

  // 显示使用教程
  showChatGuide() {
    this.setData({
      showGuide: true
    })
  },

  // 隐藏使用教程
  hideGuide() {
    this.setData({
      showGuide: false
    })
  },

  // 阻止模态框关闭
  preventClose() {
    // 阻止事件冒泡
  },

  // 切换模拟器显示
  toggleSimulator() {
    this.setData({
      showSimulator: !this.data.showSimulator
    })
  },

  // 模拟选择图片
  simulateChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          simulatorImagePath: res.tempFiles[0].tempFilePath
        })
        wx.showToast({
          title: '图片选择成功',
          icon: 'success'
        })
      },
      fail: (error) => {
        console.error('选择图片失败:', error)
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        })
      }
    })
  },

  // 模拟器文本输入
  onSimulatorTextInput(e) {
    this.setData({
      simulatorText: e.detail.value
    })
  },

  // 模拟发送微信消息
  async simulateWechatMessage() {
    const { simulatorImagePath, simulatorText } = this.data
    
    if (!simulatorImagePath || !simulatorText.trim()) {
      wx.showToast({
        title: '请选择图片并输入描述',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '模拟处理中...' })
      
      // 上传图片到云存储
      const cloudPath = `test/simulator_${Date.now()}.jpg`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: simulatorImagePath
      })
      
      console.log('图片上传成功:', uploadResult)
      
      // 创建处理中状态的记录
      const tempRecord = {
        _id: 'temp_' + Date.now(),
        imageUrl: uploadResult.fileID,
        originalText: simulatorText,
        story: '',
        tags: [],
        source: 'chat',
        status: 'processing',
        createTime: new Date(),
        timeText: this.formatTime(new Date()),
        dateText: this.formatDate(new Date())
      }
      
      // 添加到列表顶部
      const updatedRecords = [tempRecord, ...this.data.chatRecords]
      this.setData({
        chatRecords: updatedRecords
      })
      
      // 调用AI处理云函数
      const result = await app.callCloudFunction('aiProcessor', {
        imageUrl: uploadResult.fileID,
        userText: simulatorText,
        source: 'chat',
        messageId: 'simulator_' + Date.now(),
        timestamp: new Date()
      })
      
      console.log('AI处理结果:', result)
      
      if (result.result.success) {
        // 更新记录状态
        const finalRecords = this.data.chatRecords.map(record => {
          if (record._id === tempRecord._id) {
            return {
              ...result.result.data,
              timeText: this.formatTime(result.result.data.createTime),
              dateText: this.formatDate(result.result.data.createTime),
              status: 'completed'
            }
          }
          return record
        })
        
        this.setData({
          chatRecords: finalRecords,
          simulatorImagePath: '',
          simulatorText: ''
        })
        
        wx.showToast({
          title: '模拟处理成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.result.error || '处理失败')
      }
      
    } catch (error) {
      console.error('模拟微信消息失败:', error)
      
      // 移除处理中的记录
      const filteredRecords = this.data.chatRecords.filter(record => 
        !record._id.startsWith('temp_')
      )
      this.setData({
        chatRecords: filteredRecords
      })
      
      wx.showToast({
        title: '模拟处理失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 模拟接收新的聊天消息（用于测试）
  async simulateNewMessage() {
    try {
      wx.showLoading({ title: '处理中...' })
      
      // 模拟调用云函数处理新消息
      const result = await app.callCloudFunction('aiProcessor', {
        imageUrl: 'cloud://test-image.jpg',
        userText: '宝宝今天第一次叫妈妈了！',
        openid: 'test-openid',
        source: 'chat',
        timestamp: new Date()
      })
      
      if (result.result.success) {
        wx.showToast({
          title: '新消息处理成功',
          icon: 'success'
        })
        
        // 刷新聊天记录
        this.loadChatRecords()
      }
      
    } catch (error) {
      console.error('模拟消息处理失败:', error)
      wx.showToast({
        title: '处理失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 清空聊天记录
  async clearChatRecords() {
    const result = await wx.showModal({
      title: '确认清空',
      content: '确定要清空所有聊天记录吗？此操作不可恢复。'
    })
    
    if (result.confirm) {
      try {
        wx.showLoading({ title: '清空中...' })
        
        const db = app.getDatabase()
        
        // 批量删除聊天记录
        const records = this.data.chatRecords
        for (let record of records) {
          await db.collection('growth_records').doc(record._id).remove()
        }
        
        wx.showToast({
          title: '清空成功',
          icon: 'success'
        })
        
        this.setData({
          chatRecords: []
        })
        
      } catch (error) {
        console.error('清空失败:', error)
        wx.showToast({
          title: '清空失败',
          icon: 'error'
        })
      } finally {
        wx.hideLoading()
      }
    }
  },

  // 导出聊天记录
  exportChatRecords() {
    try {
      const records = this.data.chatRecords
      if (records.length === 0) {
        wx.showToast({
          title: '没有记录可导出',
          icon: 'none'
        })
        return
      }
      
      // 生成导出文本
      let exportText = '宝宝成长记录聊天导出\n\n'
      
      records.forEach((record, index) => {
        exportText += `${index + 1}. ${record.dateText} ${record.timeText}\n`
        exportText += `描述：${record.originalText}\n`
        exportText += `故事：${record.story}\n`
        exportText += `标签：${record.tags ? record.tags.join(', ') : '无'}\n\n`
      })
      
      // 复制到剪贴板
      wx.setClipboardData({
        data: exportText,
        success() {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          })
        }
      })
      
    } catch (error) {
      console.error('导出失败:', error)
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      })
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '我的宝宝成长聊天记录',
      path: '/pages/chat/chat',
      imageUrl: '/images/share-chat.jpg'
    }
  },

  onShareTimeline() {
    return {
      title: 'AI记录宝宝成长的每一个温馨时刻'
    }
  }
}) 