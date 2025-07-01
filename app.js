// app.js
App({
  onLaunch() {
    console.log('宝宝成长记录小程序启动')
    
    // 初始化云开发
    this.initCloud()
    
    // 检查基础库版本
    this.checkLibVersion()
  },

  onShow() {
    console.log('宝宝成长记录小程序显示')
  },

  onHide() {
    console.log('宝宝成长记录小程序隐藏')
  },

  onError(msg) {
    console.error('小程序错误:', msg)
  },

  // 初始化云开发
  async initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    try {
      await wx.cloud.init({
        // 暂时移除env配置，让系统自动检测
        traceUser: true
      })
      console.log('云开发初始化成功')
      
      // 设置全局数据
      this.globalData.cloudInitialized = true
      
    } catch (error) {
      console.error('云开发初始化失败:', error)
      this.globalData.cloudInitialized = false
    }
  },

  // 检查基础库版本
  checkLibVersion() {
    const version = wx.getSystemInfoSync().SDKVersion
    if (this.compareVersion(version, '2.2.3') < 0) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  },

  // 版本比较函数
  compareVersion(v1, v2) {
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)

    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }

    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i])
      const num2 = parseInt(v2[i])

      if (num1 > num2) {
        return 1
      } else if (num1 < num2) {
        return -1
      }
    }
    return 0
  },

  // 全局数据
  globalData: {
    userInfo: null,
    openid: null,
    cloudInitialized: false,
    version: '2.0.0',
    babyInfo: {
      name: '宝贝',
      birthday: null,
      gender: null
    }
  },

  // 工具函数：格式化时间
  formatTime(date) {
    if (!date) return ''
    
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = d.getHours()
    const minute = d.getMinutes()

    return `${year}-${this.formatNumber(month)}-${this.formatNumber(day)} ${this.formatNumber(hour)}:${this.formatNumber(minute)}`
  },

  formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },

  // 格式化相对时间
  formatRelativeTime(date) {
    if (!date) return ''
    
    const now = new Date()
    const target = new Date(date)
    const diff = now - target
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const months = Math.floor(days / 30)

    if (minutes < 1) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 30) {
      return `${days}天前`
    } else if (months < 12) {
      return `${months}个月前`
    } else {
      return this.formatTime(date)
    }
  },

  // 云函数调用封装
  async callCloudFunction(name, data = {}) {
    try {
      if (!this.globalData.cloudInitialized) {
        throw new Error('云开发未初始化')
      }

      console.log(`调用云函数 ${name}:`, data)
      
      const result = await wx.cloud.callFunction({
        name,
        data
      })
      
      console.log(`云函数 ${name} 返回:`, result)
      return result
      
    } catch (error) {
      console.error(`云函数 ${name} 调用失败:`, error)
      throw error
    }
  },

  // 云数据库操作封装
  getDatabase() {
    if (!this.globalData.cloudInitialized) {
      throw new Error('云开发未初始化')
    }
    return wx.cloud.database()
  },

  // 云存储操作封装
  async uploadFile(filePath, cloudPath) {
    try {
      if (!this.globalData.cloudInitialized) {
        throw new Error('云开发未初始化')
      }

      const result = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
      
      console.log('文件上传成功:', result)
      return result
      
    } catch (error) {
      console.error('文件上传失败:', error)
      throw error
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      if (this.globalData.userInfo) {
        return this.globalData.userInfo
      }

      // 获取用户信息
      const userInfo = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      this.globalData.userInfo = userInfo.userInfo
      return userInfo.userInfo
      
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  },

  // 获取OpenID
  async getOpenId() {
    try {
      if (this.globalData.openid) {
        return this.globalData.openid
      }

      const result = await this.callCloudFunction('getOpenId')
      if (result.result.success) {
        this.globalData.openid = result.result.openid
        return result.result.openid
      }
      
      throw new Error(result.result.error || '获取OpenID失败')
      
    } catch (error) {
      console.error('获取OpenID失败:', error)
      return null
    }
  },

  // 设置宝宝信息
  setBabyInfo(babyInfo) {
    this.globalData.babyInfo = {
      ...this.globalData.babyInfo,
      ...babyInfo
    }
    
    // 保存到本地存储
    wx.setStorageSync('babyInfo', this.globalData.babyInfo)
  },

  // 获取宝宝信息
  getBabyInfo() {
    try {
      const stored = wx.getStorageSync('babyInfo')
      if (stored) {
        this.globalData.babyInfo = {
          ...this.globalData.babyInfo,
          ...stored
        }
      }
      return this.globalData.babyInfo
    } catch (error) {
      console.error('获取宝宝信息失败:', error)
      return this.globalData.babyInfo
    }
  },

  // 计算宝宝年龄
  calculateBabyAge(birthday) {
    if (!birthday) return { years: 0, months: 0 }
    
    const birth = new Date(birthday)
    const now = new Date()
    
    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    
    if (months < 0) {
      years--
      months += 12
    }
    
    return { years, months }
  },

  // 错误处理
  showError(message, title = '提示') {
    wx.showModal({
      title,
      content: message,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 成功提示
  showSuccess(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    })
  }
}) 