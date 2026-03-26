<template>
  <view class="page">
    <!-- 顶部说明 -->
    <view class="header">
      <text class="title">AI 智能抠图</text>
      <text class="subtitle">发丝级精准提取，一键去除背景</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-section" @click="chooseImage" hover-class="upload-hover">
      <view class="upload-content" v-if="!originalImage">
        <view class="icon-wrap"><text class="icon">📤</text></view>
        <text class="upload-title">点击上传图片</text>
        <text class="upload-desc">支持 JPG / PNG 格式</text>
      </view>
      <image v-else :src="originalImage" mode="aspectFit" class="preview-img" />
    </view>

    <!-- 处理状态 -->
    <view class="process-card" v-if="isProcessing">
      <view class="spinner"></view>
      <text class="process-text">AI 正在努力抠图中...</text>
    </view>

    <!-- 结果展示区 -->
    <view class="result-section" v-if="resultImage && !isProcessing">
      <view class="result-header">
        <text class="result-title">抠图结果</text>
        <view class="bg-toggle">
          <text :class="['toggle-item', bgMode === 'transparent' ? 'active' : '']" @click="bgMode = 'transparent'">透明</text>
          <text :class="['toggle-item', bgMode === 'white' ? 'active' : '']" @click="bgMode = 'white'">白底</text>
          <text :class="['toggle-item', bgMode === 'black' ? 'active' : '']" @click="bgMode = 'black'">黑底</text>
        </view>
      </view>
      
      <view :class="['result-preview', `bg-${bgMode}`]">
        <image :src="resultImage" mode="aspectFit" class="result-img" @click="previewResult" />
      </view>

      <!-- 操作按钮 -->
      <view class="action-group">
        <button class="btn-primary" @click="saveImage" hover-class="btn-hover">
          <text class="btn-icon">💾</text> 保存到相册
        </button>
        <button class="btn-secondary" @click="reset" hover-class="btn-hover">
          重新上传
        </button>
      </view>
    </view>

  </view>
</template>

<script>
import { segmentHuman } from '../../utils/baidu.js'
import { saveToAlbum } from '../../utils/canvas.js'

export default {
  name: 'MattingPage',
  data() {
    return {
      originalImage: '',
      resultImage: '',
      isProcessing: false,
      bgMode: 'transparent', // transparent, white, black
    }
  },
  methods: {
    async chooseImage() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        })
        this.originalImage = res.tempFilePaths[0]
        this.processImage()
      } catch (e) {
        console.log('取消选择图片')
      }
    },

    async processImage() {
      if (!this.originalImage) return
      
      this.isProcessing = true
      this.resultImage = ''

      try {
        // 1. 获取图片 base64
        const base64 = await new Promise((resolve, reject) => {
          uni.getFileSystemManager().readFile({
            filePath: this.originalImage,
            encoding: 'base64',
            success: res => resolve(res.data),
            fail: err => reject(err)
          })
        })

        // 2. 调用百度 API
          this.resultBase64 = await segmentHuman(base64)

        // 3. 将 base64 转为临时文件用于显示
        const fs = uni.getFileSystemManager()
        const tempFilePath = `${uni.env.USER_DATA_PATH}/matting_result_${Date.now()}.png`
        
        await new Promise((resolve, reject) => {
          fs.writeFile({
            filePath: tempFilePath,
            data: fgBase64,
            encoding: 'base64',
            success: () => resolve(),
            fail: (err) => reject(err)
          })
        })

        this.resultImage = tempFilePath

      } catch (e) {
        uni.showToast({ title: e.message || '抠图失败，请重试', icon: 'none' })
        this.originalImage = ''
      } finally {
        this.isProcessing = false
      }
    },

    previewResult() {
      if (this.resultImage) {
        uni.previewImage({ urls: [this.resultImage] })
      }
    },

    async saveImage() {
      if (!this.resultImage) return
      uni.showLoading({ title: '保存中...' })
      try {
        await saveToAlbum(this.resultImage)
        uni.hideLoading()
        uni.showToast({ title: '已保存到相册', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        if (e.message !== '已取消') {
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    },

    reset() {
      this.originalImage = ''
      this.resultImage = ''
      this.isProcessing = false
    }
  }
}
</script>

<style scoped>
page { background: #000000; }
.page { background: #000000; min-height: 100vh; padding: 40rpx 32rpx 120rpx; }

/* 头部 */
.header { margin-bottom: 48rpx; text-align: center; }
.title { display: block; font-size: 48rpx; font-weight: 900; color: #E8E0D0; margin-bottom: 12rpx; letter-spacing: 2rpx; }
.subtitle { display: block; font-size: 26rpx; color: #8E8E93; }

/* 上传区 */
.upload-section {
  background: #1C1C1E; border: 2rpx dashed rgba(255, 255, 255, 0.15);
  border-radius: 40rpx; height: 400rpx;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 40rpx; overflow: hidden;
  transition: all 0.3s ease;
}
.upload-hover { background: rgba(255, 255, 255, 0.05); border-color: #34C759; }
.upload-content { display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.icon-wrap {
  width: 100rpx; height: 100rpx; border-radius: 50%;
  background: rgba(52, 199, 89, 0.1);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16rpx;
}
.icon { font-size: 48rpx; }
.upload-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; }
.upload-desc { font-size: 24rpx; color: #8E8E93; }
.preview-img { width: 100%; height: 100%; }

/* 处理状态 */
.process-card {
  background: #1C1C1E; border-radius: 32rpx; padding: 60rpx;
  display: flex; flex-direction: column; align-items: center; gap: 32rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}
.spinner {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.05); border-top-color: #34C759;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.process-text { font-size: 28rpx; color: #E8E0D0; font-weight: 600; }

/* 结果区 */
.result-section { animation: fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

.result-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24rpx; padding: 0 8rpx;
}
.result-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; }
.bg-toggle {
  display: flex; background: #1C1C1E; border-radius: 16rpx; padding: 6rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}
.toggle-item {
  padding: 10rpx 24rpx; font-size: 24rpx; color: #8E8E93; border-radius: 12rpx;
  transition: all 0.2s ease;
}
.toggle-item.active { background: rgba(255, 255, 255, 0.1); color: #E8E0D0; font-weight: 600; }

.result-preview {
  height: 600rpx; border-radius: 32rpx; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 40rpx; border: 1rpx solid rgba(255, 255, 255, 0.05);
  transition: background 0.3s ease;
}
.bg-transparent {
  background-image: linear-gradient(45deg, #1C1C1E 25%, transparent 25%), 
                    linear-gradient(-45deg, #1C1C1E 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #1C1C1E 75%), 
                    linear-gradient(-45deg, transparent 75%, #1C1C1E 75%);
  background-size: 40rpx 40rpx;
  background-position: 0 0, 0 20rpx, 20rpx -20rpx, -20rpx 0px;
  background-color: #121212;
}
.bg-white { background: #FFFFFF; }
.bg-black { background: #000000; }
.result-img { width: 100%; height: 100%; }

/* 按钮组 */
.action-group { display: flex; flex-direction: column; gap: 24rpx; }
.btn-primary {
  background: linear-gradient(135deg, #34C759, #28A745);
  color: #FFFFFF; border: none; border-radius: 24rpx; padding: 32rpx;
  font-size: 32rpx; font-weight: 800; letter-spacing: 2rpx;
  display: flex; align-items: center; justify-content: center; gap: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(52, 199, 89, 0.3);
  transition: all 0.25s ease;
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.05); color: #E8E0D0;
  border: 1rpx solid rgba(255, 255, 255, 0.1); border-radius: 24rpx; padding: 32rpx;
  font-size: 30rpx; font-weight: 600;
  transition: all 0.25s ease;
}
.btn-hover { transform: scale(0.96); }
.btn-primary.btn-hover { box-shadow: 0 4rpx 12rpx rgba(52, 199, 89, 0.2); }
</style>