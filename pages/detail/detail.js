const app = getApp()

Page({
  data: {
    record: null,
    isEditing: false,
    editContent: '',
    showDeleteModal: false,
    recordId: null
  },

  onLoad(options) {
    console.log('详情页面加载', options)
    const id = parseInt(options.id)
    if (id) {
      this.setData({ recordId: id })
      this.loadRecord(id)
    } else {
      wx.showToast({
        title: '记录不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载记录详情
  loadRecord(id) {
    try {
      const records = app.recordManager.getAllRecords()
      const record = records.find(item => item.id === id)
      
      if (record) {
        const processedRecord = {
          ...record,
          createTimeText: app.formatTime(new Date(record.createTime)),
          updateTimeText: app.formatTime(new Date(record.updateTime))
        }
        
        this.setData({
          record: processedRecord
        })
      } else {
        wx.showToast({
          title: '记录不存在',
          icon: 'error'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (e) {
      console.error('加载记录失败:', e)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  // 开始编辑
  editRecord() {
    this.setData({
      isEditing: true,
      editContent: this.data.record.content
    })
  },

  // 编辑内容变化
  onEditInput(e) {
    this.setData({
      editContent: e.detail.value
    })
  },

  // 取消编辑
  cancelEdit() {
    // 检查是否有未保存的修改
    if (this.data.editContent !== this.data.record.content) {
      wx.showModal({
        title: '确认取消？',
        content: '当前修改未保存，确定要取消编辑吗？',
        confirmText: '取消编辑',
        cancelText: '继续编辑',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              isEditing: false,
              editContent: ''
            })
          }
        }
      })
    } else {
      this.setData({
        isEditing: false,
        editContent: ''
      })
    }
  },

  // 保存编辑
  saveEdit() {
    const content = this.data.editContent.trim()
    
    if (!content) {
      wx.showToast({
        title: '内容不能为空',
        icon: 'none'
      })
      return
    }

    if (content === this.data.record.content) {
      // 内容没有变化，直接退出编辑模式
      this.setData({
        isEditing: false,
        editContent: ''
      })
      return
    }

    // 保存修改
    const success = app.recordManager.updateRecord(this.data.recordId, content)
    
    if (success) {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 重新加载记录
      this.loadRecord(this.data.recordId)
      this.setData({
        isEditing: false,
        editContent: ''
      })
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  // 复制内容
  copyContent() {
    wx.setClipboardData({
      data: this.data.record.content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'error'
        })
      }
    })
  },

  // 分享记录
  shareRecord() {
    const record = this.data.record
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 显示删除确认
  showDeleteConfirm() {
    this.setData({
      showDeleteModal: true
    })
  },

  // 隐藏删除确认
  hideDeleteModal() {
    this.setData({
      showDeleteModal: false
    })
  },

  // 阻止模态框关闭
  preventClose() {
    // 阻止事件冒泡
  },

  // 确认删除
  confirmDelete() {
    const success = app.recordManager.deleteRecord(this.data.recordId)
    
    if (success) {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    } else {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }
    
    this.hideDeleteModal()
  },

  // 分享配置
  onShareAppMessage() {
    const record = this.data.record
    return {
      title: `花生记录：${record.content.slice(0, 20)}${record.content.length > 20 ? '...' : ''}`,
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    const record = this.data.record
    return {
      title: `花生记录：${record.content.slice(0, 30)}${record.content.length > 30 ? '...' : ''}`
    }
  }
}) 