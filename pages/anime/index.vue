<template>
  <view class="page">
    <view class="header">
      <text class="title">二次元化身</text>
      <text class="subtitle">AI 次元壁突破，一秒变身动漫主角</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-section" @click="chooseImage" hover-class="upload-hover">
      <view class="upload-content" v-if="!originalImage">
        <view class="icon-wrap"><text class="icon">🪄</text></view>
        <text class="upload-title">上传清晰人像照片</text>
        <text class="upload-desc">最佳效果：正脸、无遮挡、背景简单</text>
      </view>
      <image v-else :src="originalImage" mode="aspectFit" class="preview-img" />
    </view>

    <!-- 处理状态 -->
    <view class="process-card" v-if="isProcessing">
      <view class="spinner"></view>
      <text class="process-text">AI 正在注入灵魂...</text>
      <text class="process-sub">这可能需要一点点时间，魔法即将呈现</text>
    </view>

    <!-- 结果展示区 (对比滑块) -->
    <view class="result-section" v-if="resultImage && !isProcessing">
      <view class="result-header">
        <text class="result-title">次元转变</text>
        <text class="result-hint">按住图片可查看原图</text>
      </view>
      
      <view class="compare-container" 
        @touchstart="showOriginal = true" 
        @touchend="showOriginal = false"
        @touchcancel="showOriginal = false">
        <image :src="showOriginal ? originalImage : resultImage" mode="aspectFit" class="result-img" />
        <view class="compare-badge">{{ showOriginal ? '三次元' : '二次元' }}</view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-group">
        <button class="btn-primary" @click="saveImage" hover-class="btn-hover">
          <text class="btn-icon">💾</text> 保存我的画作
        </button>
        <button class="btn-secondary" @click="reset" hover-class="btn-hover">
          换个造型重试
        </button>
      </view>
    </view>

  </view>
</template>

<script>
import { saveToAlbum } from '../../utils/canvas.js'
import { fileToBase64, animeFace } from '../../utils/baidu.js'

export default {
  name: 'AnimePage',
  data() {
    return {
      originalImage: '',
      resultImage: '',
      isProcessing: false,
      showOriginal: false,
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
        const { base64 } = await fileToBase64(this.originalImage)
        const resultBase64 = await animeFace(base64)
        this.resultImage = `data:image/jpeg;base64,${resultBase64}`
        
        uni.showToast({ title: '魔法完成', icon: 'success' })

      } catch (e) {
        uni.showToast({ title: e.message || '转换失败，请重试', icon: 'none' })
        this.originalImage = ''
      } finally {
        this.isProcessing = false
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
      this.showOriginal = false
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
  display: flex; flex-direction: column; align-items: center; gap: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}
.spinner {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.05); border-top-color: #34C759;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin-bottom: 16rpx;
}
@keyframes spin { to { transform: rotate(360deg); } }
.process-text { font-size: 28rpx; color: #E8E0D0; font-weight: 600; }
.process-sub { font-size: 22rpx; color: #8E8E93; }

/* 结果区 */
.result-section { animation: fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

.result-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24rpx; padding: 0 8rpx;
}
.result-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; }
.result-hint { font-size: 24rpx; color: #34C759; background: rgba(52, 199, 89, 0.1); padding: 8rpx 20rpx; border-radius: 20rpx; }

.compare-container {
  position: relative; height: 600rpx; border-radius: 32rpx; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 40rpx; border: 1rpx solid rgba(255, 255, 255, 0.05);
  background: #121212;
}
.result-img { width: 100%; height: 100%; transition: opacity 0.2s ease; }
.compare-badge {
  position: absolute; top: 24rpx; right: 24rpx;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
  color: #FFF; font-size: 22rpx; padding: 8rpx 20rpx; border-radius: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

/* 按钮组 */
.action-group { display: flex; flex-direction: column; gap: 24rpx; }
.btn-primary {
  background: linear-gradient(135deg, #34C759, #30A852);
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
