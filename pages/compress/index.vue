<template>
  <view class="page">
    <view class="header">
      <text class="title">格式转换与压缩</text>
      <text class="subtitle">本地处理，保护隐私，快速高效</text>
    </view>

    <!-- 上传区域 -->
    <view class="upload-section" @click="chooseImage" hover-class="upload-hover">
      <view class="upload-content" v-if="!originalImage">
        <view class="icon-wrap"><text class="icon">📦</text></view>
        <text class="upload-title">选择需要处理的图片</text>
        <text class="upload-desc">支持多图批量选择</text>
      </view>
      <image v-else :src="originalImage" mode="aspectFit" class="preview-img" />
    </view>

    <!-- 设置面板 -->
    <view class="settings-panel" v-if="originalImage">
      <view class="panel-title">处理设置</view>
      
      <!-- 格式选择 -->
      <view class="setting-item">
        <text class="setting-label">目标格式</text>
        <view class="format-group">
          <text :class="['format-btn', targetFormat === 'jpg' ? 'active' : '']" @click="targetFormat = 'jpg'">JPG</text>
          <text :class="['format-btn', targetFormat === 'png' ? 'active' : '']" @click="targetFormat = 'png'">PNG</text>
        </view>
      </view>

      <!-- 压缩质量 -->
      <view class="setting-item">
        <view class="setting-header">
          <text class="setting-label">压缩质量</text>
          <text class="setting-val">{{ quality }}%</text>
        </view>
        <slider 
          :value="quality" 
          min="10" max="100" step="5"
          activeColor="#0A84FF" backgroundColor="rgba(255,255,255,0.1)" block-color="#FFFFFF"
          @change="onQualityChange"
        />
        <text class="setting-desc">数值越小，文件越小，但画质会有所降低</text>
      </view>

      <!-- 操作按钮 -->
      <button class="btn-primary" @click="processImage" :disabled="isProcessing" hover-class="btn-hover">
        {{ isProcessing ? '处理中...' : '开始处理' }}
      </button>
    </view>

    <!-- 结果展示 -->
    <view class="result-panel" v-if="resultImage">
      <view class="result-info">
        <view class="info-item">
          <text class="info-label">原图大小</text>
          <text class="info-val">{{ originalSize }}</text>
        </view>
        <view class="info-arrow">→</view>
        <view class="info-item">
          <text class="info-label">处理后</text>
          <text class="info-val highlight">{{ resultSize }}</text>
        </view>
      </view>
      
      <view class="action-group">
        <button class="btn-save" @click="saveImage" hover-class="btn-hover">保存到相册</button>
        <button class="btn-reset" @click="reset" hover-class="btn-hover">重新选择</button>
      </view>
    </view>

    <!-- 隐藏的 Canvas 用于处理图片 -->
    <canvas type="2d" id="processCanvas" class="hidden-canvas" :style="{ width: canvasW + 'px', height: canvasH + 'px' }"></canvas>

  </view>
</template>

<script>
import { getCanvasNode } from '../../utils/canvas.js'

export default {
  name: 'CompressPage',
  data() {
    return {
      originalImage: '',
      originalSize: '0 KB',
      resultImage: '',
      resultSize: '0 KB',
      targetFormat: 'jpg',
      quality: 80,
      isProcessing: false,
      canvasW: 1,
      canvasH: 1,
    }
  },
  methods: {
    async chooseImage() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ['original'],
          sourceType: ['album', 'camera']
        })
        this.originalImage = res.tempFilePaths[0]
        this.resultImage = ''
        
        // 获取原图大小
        uni.getFileInfo({
          filePath: this.originalImage,
          success: (info) => {
            this.originalSize = (info.size / 1024).toFixed(1) + ' KB'
          }
        })
      } catch (e) {
        console.log('取消选择')
      }
    },

    onQualityChange(e) {
      this.quality = e.detail.value
    },

    async processImage() {
      if (!this.originalImage || this.isProcessing) return
      this.isProcessing = true
      uni.showLoading({ title: '处理中...' })

      try {
        // 1. 获取图片信息
        const imgInfo = await new Promise((resolve, reject) => {
          uni.getImageInfo({
            src: this.originalImage,
            success: resolve,
            fail: reject
          })
        })

        this.canvasW = imgInfo.width
        this.canvasH = imgInfo.height

        // 等待 canvas 尺寸更新
        await new Promise(resolve => setTimeout(resolve, 100))

        // 2. 获取 Canvas 节点并绘制
        const canvas = await getCanvasNode('processCanvas', this)
        const ctx = canvas.getContext('2d')
        
        const img = canvas.createImage()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = this.originalImage
        })

        // 如果是转 JPG，先填充白底（防止 PNG 透明变黑）
        if (this.targetFormat === 'jpg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, this.canvasW, this.canvasH)
        }
        
        ctx.drawImage(img, 0, 0, this.canvasW, this.canvasH)

        // 3. 导出图片
        const destPath = await new Promise((resolve, reject) => {
          uni.canvasToTempFilePath({
            canvas,
            fileType: this.targetFormat,
            quality: this.quality / 100,
            success: res => resolve(res.tempFilePath),
            fail: reject
          }, this)
        })

        this.resultImage = destPath

        // 4. 获取处理后的大小
        uni.getFileInfo({
          filePath: this.resultImage,
          success: (info) => {
            this.resultSize = (info.size / 1024).toFixed(1) + ' KB'
          }
        })

      } catch (e) {
        uni.showToast({ title: '处理失败', icon: 'none' })
      } finally {
        uni.hideLoading()
        this.isProcessing = false
      }
    },

    saveImage() {
      if (!this.resultImage) return
      uni.saveImageToPhotosAlbum({
        filePath: this.resultImage,
        success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
        fail: () => uni.showToast({ title: '保存失败', icon: 'none' })
      })
    },

    reset() {
      this.originalImage = ''
      this.resultImage = ''
      this.originalSize = '0 KB'
      this.resultSize = '0 KB'
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
  border-radius: 40rpx; height: 360rpx;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 40rpx; overflow: hidden;
  transition: all 0.3s ease;
}
.upload-hover { background: rgba(255, 255, 255, 0.05); border-color: #0A84FF; }
.upload-content { display: flex; flex-direction: column; align-items: center; gap: 16rpx; }
.icon-wrap {
  width: 100rpx; height: 100rpx; border-radius: 50%;
  background: rgba(10, 132, 255, 0.1);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16rpx;
}
.icon { font-size: 48rpx; }
.upload-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; }
.upload-desc { font-size: 24rpx; color: #8E8E93; }
.preview-img { width: 100%; height: 100%; }

/* 设置面板 */
.settings-panel {
  background: #1C1C1E; border-radius: 32rpx; padding: 40rpx 32rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
  margin-bottom: 40rpx; animation: fadeIn 0.4s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }

.panel-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; margin-bottom: 32rpx; }

.setting-item { margin-bottom: 40rpx; }
.setting-label { font-size: 28rpx; color: #8E8E93; margin-bottom: 16rpx; display: block; }
.setting-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.setting-header .setting-label { margin-bottom: 0; }
.setting-val { font-size: 28rpx; color: #0A84FF; font-weight: 700; font-family: monospace; }
.setting-desc { font-size: 22rpx; color: #666; margin-top: 12rpx; display: block; }

.format-group { display: flex; gap: 24rpx; }
.format-btn {
  flex: 1; text-align: center; padding: 20rpx 0;
  background: rgba(255, 255, 255, 0.05); border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 20rpx; font-size: 28rpx; color: #8E8E93; font-weight: 600;
  transition: all 0.2s ease;
}
.format-btn.active {
  background: rgba(10, 132, 255, 0.1); border-color: #0A84FF;
  color: #0A84FF; transform: scale(1.02);
}

.btn-primary {
  background: linear-gradient(135deg, #0A84FF, #0066CC);
  color: #FFFFFF; border: none; border-radius: 24rpx; padding: 28rpx;
  font-size: 32rpx; font-weight: 800; letter-spacing: 2rpx;
  box-shadow: 0 8rpx 24rpx rgba(10, 132, 255, 0.3);
  transition: all 0.25s ease;
}
.btn-primary[disabled] { opacity: 0.6; box-shadow: none; }

/* 结果面板 */
.result-panel {
  background: rgba(10, 132, 255, 0.05); border-radius: 32rpx; padding: 40rpx 32rpx;
  border: 1rpx solid rgba(10, 132, 255, 0.2);
  animation: fadeIn 0.4s ease;
}
.result-info {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 40rpx; padding: 0 20rpx;
}
.info-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.info-label { font-size: 24rpx; color: #8E8E93; }
.info-val { font-size: 36rpx; color: #E8E0D0; font-weight: 700; font-family: monospace; }
.info-val.highlight { color: #34C759; }
.info-arrow { font-size: 40rpx; color: #666; }

.action-group { display: flex; gap: 20rpx; }
.btn-save {
  flex: 2; background: #34C759; color: #FFF; border-radius: 20rpx;
  font-size: 30rpx; font-weight: 700; padding: 24rpx;
}
.btn-reset {
  flex: 1; background: rgba(255, 255, 255, 0.1); color: #E8E0D0; border-radius: 20rpx;
  font-size: 30rpx; font-weight: 600; padding: 24rpx;
}
.btn-hover { transform: scale(0.96); }

.hidden-canvas { position: fixed; top: -9999px; left: -9999px; }
</style>