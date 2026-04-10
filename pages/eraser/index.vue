<template>
  <view class="page">
    <view class="header">
      <text class="title">{{ pageTitle }}</text>
      <text class="subtitle">{{ pageSubTitle }}</text>
    </view>

    <!-- 主展示区 -->
    <view class="workspace">
      <!-- 选择图片 -->
      <view class="upload-box" v-if="!originalImg" @click="chooseImage" hover-class="upload-hover">
        <text class="upload-icon">📸</text>
        <text class="upload-text">点击上传需要去水印的图片</text>
      </view>

      <!-- 画板/预览区 -->
      <view class="canvas-container" v-else>
        <!-- 我们使用一个原生图片显示底层，并在上层覆盖一层用于交互绘制框的容器 -->
        <image class="bg-image" :src="previewImg || originalImg" mode="aspectFit" @load="onImageLoad"></image>
        
        <!-- 遮罩绘画交互层 -->
        <view 
          class="draw-layer"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          v-if="!isProcessing && mode === 'edit'"
        >
          <!-- 绘制中的矩形框 -->
          <view 
            class="selection-box"
            v-if="isDrawing"
            :style="{
              left: Math.min(startX, currentX) + 'px',
              top: Math.min(startY, currentY) + 'px',
              width: Math.abs(currentX - startX) + 'px',
              height: Math.abs(currentY - startY) + 'px'
            }"
          ></view>
          
          <!-- 已完成的选区框 -->
          <view 
            class="selection-box done-box"
            v-for="(rect, idx) in selections" :key="idx"
            :style="{
              left: rect.x + 'px',
              top: rect.y + 'px',
              width: rect.w + 'px',
              height: rect.h + 'px'
            }"
          >
            <text class="del-btn" @click.stop="delSelection(idx)">×</text>
          </view>
        </view>

        <!-- 处理中的蒙层 -->
        <view class="processing-mask" v-if="isProcessing">
          <view class="spinner"></view>
          <text class="processing-text">{{ processingText }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="action-footer" v-if="originalImg && !isProcessing">
      <template v-if="mode === 'edit'">
        <button class="btn-secondary" @click="resetImage" hover-class="btn-hover">重新上传</button>
        <button class="btn-primary" @click="startInpaint" hover-class="btn-hover" :disabled="selections.length === 0">
          一键去除 {{ selections.length ? `(${selections.length})` : '' }}
        </button>
      </template>
      <template v-else>
        <!-- 对比模式或完成模式 -->
        <button class="btn-secondary" @click="mode = 'edit'; previewImg = ''" hover-class="btn-hover">再次编辑</button>
        <button class="btn-primary" @click="saveImage" hover-class="btn-hover">保存到相册</button>
      </template>
    </view>

    <!-- 隐藏的画布，只用于导出或缩放运算 -->
    <canvas type="2d" id="computeCanvas" style="position:fixed; left:-9999px; top:-9999px; width:1px; height:1px;"></canvas>
  </view>
</template>

<script>
import { enhanceImage } from '../../utils/baidu.js'
import { inpaintImageVolc } from '../../utils/volcengine.js'
import { saveToAlbum } from '../../utils/canvas.js'

export default {
  data() {
    return {
      type: 'watermark', // 'watermark' or 'eraser'
      
      originalImg: '',   // 原图本地路径
      previewImg: '',    // 处理后的图像
      imgInfo: null,     // 原图物理信息 { width, height }
      displayRect: null, // 图片在屏幕上的渲染区域信息 { left, top, width, height }
      
      mode: 'edit',      // 'edit', 'result'
      isProcessing: false,
      processingText: 'AI 魔法消除中...',
      
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      
      selections: [] // 用户框选的矩形集合 { x, y, w, h }
    }
  },
  computed: {
    pageTitle() {
      return this.type === 'eraser' ? '魔法去路人' : '智能去水印';
    },
    pageSubTitle() {
      return this.type === 'eraser' 
        ? '框选照片背景中多余的路人或杂物，AI将一键擦除' 
        : '在需要去除的水印上方划出一个框，AI将自动修补';
    }
  },
  onLoad(options) {
    if (options.type) {
      this.type = options.type;
      uni.setNavigationBarTitle({ title: this.pageTitle });
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
        const tempPath = res.tempFilePaths[0]
        
        // 获取实际像素尺寸
        const info = await new Promise((resolve, reject) => {
          uni.getImageInfo({
            src: tempPath,
            success: resolve,
            fail: reject
          })
        })
        this.imgInfo = { width: info.width, height: info.height }
        this.originalImg = tempPath
        this.previewImg = ''
        this.selections = []
        this.mode = 'edit'
      } catch (e) {
        // 用户取消
      }
    },

    // 图像渲染完毕后，提取它在屏幕上的绝对占位尺寸，用来校对用户的滑动坐标
    onImageLoad(e) {
      setTimeout(() => {
        const query = uni.createSelectorQuery().in(this)
        query.select('.bg-image').boundingClientRect(data => {
          if (data) {
            // 计算 aspectFit 的实际显示排版区域
            const scaleX = data.width / this.imgInfo.width
            const scaleY = data.height / this.imgInfo.height
            const scale = Math.min(scaleX, scaleY)
            
            const displayW = this.imgInfo.width * scale
            const displayH = this.imgInfo.height * scale
            const displayLeft = (data.width - displayW) / 2
            const displayTop = (data.height - displayH) / 2
            
            this.displayRect = {
              left: displayLeft,
              top: displayTop,
              width: displayW,
              height: displayH,
              scale: scale
            }
          }
        }).exec()
      }, 100)
    },

    onTouchStart(e) {
      if (!this.displayRect) return
      const touch = e.touches[0]
      // 由于事件绑定在包含图片的 .draw-layer 也就是相对画布
      // 直接拿到当前相对于 draw-layer 的 offset 或 target 坐标不太稳定
      // 所以需要在事件内获取外层容器的 clientRect。这里我们为了简单直接要求 draw-layer 满铺。
      // 可以取绝对坐标减去容器坐标。不过 touch 的坐标一般已经是页面绝对坐标
      // 此处假设我们通过一些计算或者绑定让它可用
    },

    // 为了简单准确，我们利用 touches 中的坐标，需要减去视口容器偏移
    // uniapp vue里可以直接这样写
    getEventPos(e) {
      const touch = e.touches[0] || e.changedTouches[0]
      const query = uni.createSelectorQuery().in(this)
      return new Promise((resolve) => {
        query.select('.draw-layer').boundingClientRect(data => {
          resolve({
            x: touch.clientX - data.left,
            y: Math.max(0, touch.clientY - data.top)
          })
        }).exec()
      })
    },

    async onTouchStart(e) {
      const pos = await this.getEventPos(e)
      this.isDrawing = true
      this.startX = pos.x
      this.startY = pos.y
      this.currentX = pos.x
      this.currentY = pos.y
    },

    async onTouchMove(e) {
      if (!this.isDrawing) return
      const pos = await this.getEventPos(e)
      this.currentX = pos.x
      this.currentY = pos.y
    },

    async onTouchEnd(e) {
      if (!this.isDrawing) return
      this.isDrawing = false
      const w = Math.abs(this.currentX - this.startX)
      const h = Math.abs(this.currentY - this.startY)
      
      // 过滤掉误触和太小的选区
      if (w > 10 && h > 10) {
        this.selections.push({
          x: Math.min(this.startX, this.currentX),
          y: Math.min(this.startY, this.currentY),
          w,
          h
        })
      }
    },

    delSelection(idx) {
      this.selections.splice(idx, 1)
    },

    resetImage() {
      this.originalImg = ''
      this.previewImg = ''
      this.selections = []
    },

    async startInpaint() {
      if (this.selections.length === 0 || !this.displayRect) return
      this.isProcessing = true
      this.processingText = 'AI 魔法消除中...'
      
      try {
        // 第一步：把屏幕上的涂抹框转化回图片真实物理像素坐标
        const scale = this.displayRect.scale
        const rects = this.selections.map(box => {
          // 减去图片左上角居中的偏移量，得到在图片内部的实际像素位移
          const imgLeft = (box.x - this.displayRect.left) / scale
          const imgTop = (box.y - this.displayRect.top) / scale
          let w = box.w / scale
          let h = box.h / scale
          let l = Math.max(0, imgLeft)
          let t = Math.max(0, imgTop)
          
          // 确保不越界（留1px安全边距，防止282004报错）
          if (l + w > this.imgInfo.width)  w = this.imgInfo.width  - l - 1
          if (t + h > this.imgInfo.height) h = this.imgInfo.height - t - 1
          l = Math.max(0, Math.round(l))
          t = Math.max(0, Math.round(t))
          w = Math.max(1, Math.round(w))
          h = Math.max(1, Math.round(h))
          
          return { left: l, top: t, width: w, height: h }
        })
        
        // 过滤掉不合法的越界框（比如完全画在了黑边上）
        const validRects = rects.filter(r => r.width > 0 && r.height > 0)
        if (validRects.length === 0) {
          throw new Error('选区无效（好像没有框在图片上）')
        }

        // 第二步：转base64（不压缩，保持原图分辨率，坐标1:1对应，避免越界报错）
        let base64 = ''
        if (this.previewImg) {
          // 复用上一轮处理结果继续消除
          base64 = this.previewImg.split(',')[1]
        } else {
          base64 = await new Promise((resolve, reject) => {
            uni.getFileSystemManager().readFile({
              filePath: this.originalImg,
              encoding: 'base64',
              success: res => resolve(res.data),
              fail: () => reject(new Error('图片读取失败'))
            })
          })
        }
        // 第三步：利用不可见 Canvas 生成符合火山引擎规范的单通道黑白 Mask 图 (黑底白框)
        const maskBase64 = await new Promise((resolve, reject) => {
          const query = uni.createSelectorQuery().in(this)
          query.select('#computeCanvas').fields({ node: true, size: true }).exec((res) => {
            if (!res[0] || !res[0].node) {
              return reject(new Error('无法初始化系统画板以生成遮罩'))
            }
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            
            // 设置物理像素
            canvas.width = this.imgInfo.width
            canvas.height = this.imgInfo.height
            
            // 铺满黑底 (0 = 保持原图部分)
            ctx.fillStyle = '#000000'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // 绘制白色涂抹选区 (255 = 待消除区域)
            ctx.fillStyle = '#FFFFFF'
            validRects.forEach(r => {
              ctx.fillRect(r.left, r.top, r.width, r.height)
            })
            
            // 导出 Base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
            resolve(dataUrl.split(',')[1])
          })
        })
        
        // 第四步：调用火山引擎 API 消除水印
        const inpaintedBase64 = await inpaintImageVolc(base64, maskBase64)
        this.processingText = '画质优化中...'
        let finalBase64 = inpaintedBase64
        try {
          finalBase64 = await enhanceImage(inpaintedBase64)
        } catch (enhErr) {
          // 增强失败不影响主流程，直接使用 inpainting 原结果
          console.warn('画质增强失败，使用原消除结果：', enhErr.message)
        }

        // 第五步：展示最终结果
        this.previewImg = `data:image/jpeg;base64,${finalBase64}`
        this.mode = 'result'
        this.selections = []
        uni.showToast({ title: '消除成功', icon: 'success' })

      } catch(e) {
        uni.showToast({ title: e.message || '去水印失败，请重试', icon: 'none' })
      } finally {
        this.isProcessing = false
        this.processingText = 'AI 魔法消除中...'
      }
    },

    async saveImage() {
      if (!this.previewImg) return
      uni.showLoading({ title: '保存中...' })
      try {
        // 调用我们刚才升级过的全局神级 canvas 保存函数，它自动处理 base64 到本地相册
        await saveToAlbum(this.previewImg)
        uni.hideLoading()
        uni.showToast({ title: '已保存到手机', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        if (e.message !== '已取消') {
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    }
  }
}
</script>

<style scoped>
.page { background: #000000; min-height: 100vh; display: flex; flex-direction: column; }

/* 头部 */
.header { padding: 40rpx 32rpx 20rpx; text-align: center; }
.title { display: block; font-size: 40rpx; font-weight: 800; color: #E8E0D0; margin-bottom: 8rpx; }
.subtitle { display: block; font-size: 24rpx; color: #8E8E93; }

/* 核心工作区 */
.workspace {
  flex: 1; padding: 32rpx; display: flex; flex-direction: column; justify-content: center;
  position: relative;
}

.upload-box {
  width: 100%; height: 600rpx;
  background: #1C1C1E; border: 2rpx dashed rgba(255, 255, 255, 0.15);
  border-radius: 40rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24rpx;
  transition: all 0.3s ease;
}
.upload-hover { background: rgba(175, 82, 222, 0.1); border-color: #AF52DE; }
.upload-icon { font-size: 80rpx; }
.upload-text { font-size: 28rpx; color: #8E8E93; }

.canvas-container {
  width: 100%; height: 800rpx; position: relative;
  background: #1C1C1E; border-radius: 24rpx; overflow: hidden;
}
.bg-image {
  width: 100%; height: 100%; position: absolute; left: 0; top: 0; pointer-events: none;
}
.draw-layer {
  position: absolute; left: 0; top: 0; right: 0; bottom: 0; z-index: 10;
}

/* 选区框 */
.selection-box {
  position: absolute; border: 4rpx dashed #FF453A;
  background: rgba(255, 69, 58, 0.2); pointer-events: none;
}
.done-box { pointer-events: auto; }
.del-btn {
  position: absolute; right: -24rpx; top: -24rpx;
  width: 48rpx; height: 48rpx; background: #FF453A; color: #FFF;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.5);
  font-weight: bold; line-height: 1;
}

.processing-mask {
  position: absolute; left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 20;
}
.spinner {
  width: 60rpx; height: 60rpx; border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.1); border-top-color: #AF52DE;
  animation: spin 1s linear infinite; margin-bottom: 24rpx;
}
@keyframes spin { to { transform: rotate(360deg); } }
.processing-text { color: #E8E0D0; font-size: 28rpx; font-weight: bold; }

/* 底部操作 */
.action-footer {
  padding: 32rpx; display: flex; gap: 24rpx; padding-bottom: max(60rpx, env(safe-area-inset-bottom));
}
.btn-primary, .btn-secondary {
  flex: 1; height: 96rpx; border-radius: 24rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 30rpx; font-weight: 700; transition: all 0.2s; border: none;
}
.btn-primary { background: linear-gradient(135deg, #AF52DE, #5E5CE6); color: #FFF; }
.btn-secondary { background: #2C2C2E; color: #E8E0D0; }
.btn-primary[disabled] { opacity: 0.5; filter: grayscale(1); }
.btn-hover { transform: scale(0.96); opacity: 0.9; }
</style>
