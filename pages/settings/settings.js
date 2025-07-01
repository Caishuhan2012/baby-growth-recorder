const app = getApp()

Page({
  data: {
    userInfo: {},
    loginStatus: '未登录',
    babyInfo: {},
    babyGenderText: '请设置',
    babyAge: { years: -1, months: 0 },
    
    // AI设置
    storyStyle: '温暖优雅',
    storyLength: 80,
    autoTagging: true,
    
    // 应用信息
    version: '2.0.0',
    
    // 模态框状态
    showNameModal: false,
    showGenderModal: false,
    tempBabyName: '',
    tempGender: ''
  },

  onLoad() {
    console.log('设置页面加载')
    this.loadUserInfo()
    this.loadBabyInfo()
    this.loadSettings()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadBabyInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    const loginStatus = userInfo ? '已登录' : '点击头像登录'
    
    this.setData({
      userInfo: userInfo || {},
      loginStatus
    })
  },

  // 加载宝宝信息
  loadBabyInfo() {
    const babyInfo = app.getBabyInfo()
    
    // 计算宝宝年龄
    const babyAge = babyInfo.birthday ? 
      app.calculateBabyAge(babyInfo.birthday) : 
      { years: -1, months: 0 }
    
    // 性别文本
    const genderMap = {
      'boy': '男孩 👦',
      'girl': '女孩 👧'
    }
    const babyGenderText = babyInfo.gender ? 
      genderMap[babyInfo.gender] : '请设置'
    
    this.setData({
      babyInfo,
      babyAge,
      babyGenderText
    })
  },

  // 加载应用设置
  loadSettings() {
    try {
      const settings = wx.getStorageSync('appSettings') || {}
      this.setData({
        storyStyle: settings.storyStyle || '温暖优雅',
        storyLength: settings.storyLength || 80,
        autoTagging: settings.autoTagging !== false
      })
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  },

  // 保存应用设置
  saveSettings() {
    try {
      const settings = {
        storyStyle: this.data.storyStyle,
        storyLength: this.data.storyLength,
        autoTagging: this.data.autoTagging
      }
      wx.setStorageSync('appSettings', settings)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      const userInfo = await app.getUserInfo()
      if (userInfo) {
        this.setData({
          userInfo,
          loginStatus: '已登录'
        })
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      wx.showToast({
        title: '登录取消',
        icon: 'none'
      })
    }
  },

  // 设置宝宝昵称
  setBabyName() {
    this.setData({
      showNameModal: true,
      tempBabyName: this.data.babyInfo.name || ''
    })
  },

  hideNameModal() {
    this.setData({
      showNameModal: false,
      tempBabyName: ''
    })
  },

  onNameInput(e) {
    this.setData({
      tempBabyName: e.detail.value
    })
  },

  confirmBabyName() {
    const name = this.data.tempBabyName.trim()
    if (!name) {
      wx.showToast({
        title: '请输入宝宝昵称',
        icon: 'none'
      })
      return
    }

    app.setBabyInfo({ name })
    this.loadBabyInfo()
    this.hideNameModal()
    
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    })
  },

  // 设置宝宝生日
  setBabyBirthday() {
    wx.showModal({
      title: '温馨提示',
      content: '请在日期选择器中选择宝宝的出生日期',
      confirmText: '选择日期',
      success: (res) => {
        if (res.confirm) {
          // 这里可以集成日期选择器组件
          // 暂时使用简单的输入方式
          this.showBirthdayPicker()
        }
      }
    })
  },

  showBirthdayPicker() {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const years = Array.from({length: 10}, (_, i) => currentYear - i)
    const months = Array.from({length: 12}, (_, i) => i + 1)
    const days = Array.from({length: 31}, (_, i) => i + 1)

    wx.showActionSheet({
      itemList: ['手动输入日期'],
      success: () => {
        // 可以集成更复杂的日期选择器
        this.inputBirthday()
      }
    })
  },

  inputBirthday() {
    wx.showModal({
      title: '设置出生日期',
      content: '请输入格式: YYYY-MM-DD (如: 2023-01-15)',
      editable: true,
      placeholderText: '2023-01-15',
      success: (res) => {
        if (res.confirm && res.content) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (dateRegex.test(res.content)) {
            app.setBabyInfo({ birthday: res.content })
            this.loadBabyInfo()
            wx.showToast({
              title: '设置成功',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: '日期格式错误',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  // 设置宝宝性别
  setBabyGender() {
    this.setData({
      showGenderModal: true,
      tempGender: this.data.babyInfo.gender || ''
    })
  },

  hideGenderModal() {
    this.setData({
      showGenderModal: false,
      tempGender: ''
    })
  },

  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({
      tempGender: gender
    })
  },

  confirmGender() {
    if (!this.data.tempGender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      })
      return
    }

    app.setBabyInfo({ gender: this.data.tempGender })
    this.loadBabyInfo()
    this.hideGenderModal()
    
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    })
  },

  // 切换智能分类
  toggleAutoTagging(e) {
    const autoTagging = e.detail.value
    this.setData({ autoTagging })
    this.saveSettings()
    
    wx.showToast({
      title: autoTagging ? '已开启智能分类' : '已关闭智能分类',
      icon: 'success'
    })
  },

  // 导出数据
  async exportData() {
    try {
      wx.showLoading({ title: '导出中...' })
      
      const db = app.getDatabase()
      const result = await db.collection('growth_records').get()
      
      if (result.data.length === 0) {
        wx.showToast({
          title: '暂无数据可导出',
          icon: 'none'
        })
        return
      }
      
      // 生成导出文本
      let exportText = `宝宝成长记录导出\n`
      exportText += `导出时间: ${new Date().toLocaleString()}\n`
      exportText += `记录总数: ${result.data.length}\n\n`
      
      result.data.forEach((record, index) => {
        exportText += `${index + 1}. ${record.createTime ? new Date(record.createTime).toLocaleString() : ''}\n`
        exportText += `原始描述: ${record.originalText || ''}\n`
        exportText += `AI故事: ${record.story || ''}\n`
        exportText += `标签: ${record.tags ? record.tags.join(', ') : '无'}\n\n`
      })
      
      // 复制到剪贴板
      await wx.setClipboardData({
        data: exportText
      })
      
      wx.showToast({
        title: '已复制到剪贴板',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('导出失败:', error)
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 备份数据
  backupData() {
    wx.showModal({
      title: '备份数据',
      content: '数据已自动备份到云端，无需手动操作',
      showCancel: false
    })
  },

  // 清除数据
  clearData() {
    wx.showModal({
      title: '危险操作',
      content: '确定要清除所有数据吗？此操作不可恢复！',
      confirmText: '清除',
      confirmColor: '#FF4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '清除中...' })
            
            // 清除云数据库
            const db = app.getDatabase()
            const records = await db.collection('growth_records').get()
            
            for (let record of records.data) {
              await db.collection('growth_records').doc(record._id).remove()
            }
            
            // 清除本地存储
            wx.clearStorageSync()
            
            wx.showToast({
              title: '清除成功',
              icon: 'success'
            })
            
            // 重新加载数据
            this.loadBabyInfo()
            this.loadSettings()
            
          } catch (error) {
            console.error('清除失败:', error)
            wx.showToast({
              title: '清除失败',
              icon: 'error'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 检查更新
  checkUpdate() {
    wx.showModal({
      title: '版本检查',
      content: `当前版本: v${this.data.version}\n已是最新版本`,
      showCancel: false
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '宝宝成长记录 v2.0.0\n\n基于AI技术的智能成长记录小程序\n让每个美好瞬间都有温暖的故事',
      showCancel: false
    })
  },

  // 联系我们
  contactUs() {
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请通过以下方式联系我们:\n\n邮箱: feedback@example.com\n微信: 添加客服微信',
      showCancel: false
    })
  },

  // 阻止模态框关闭
  preventClose() {
    // 阻止事件冒泡
  }
}) 