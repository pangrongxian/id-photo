<template>
  <view class="page">
    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="tool-group">
        <view :class="['tool-btn', tool === 'eraser' ? 'active' : '']" @click="tool = 'eraser'">
          <text class="tool-icon">擦除</text>
        </view>
        <view :class="['tool-btn', tool === 'brush' ? 'active' : '']" @click="tool = 'brush'">
          <text class="tool-icon">恢复</text>
        </view>
      </view>
      <view class="tool-group">
        <text class="size-label">画笔大小</text>
        <slider class="brush-slider" min="5" max="50" :value="brushSize" @change="onSliderChange" show-value />
      </view>
    </view>

    <!-- Canvas 区域 -->
    <view class="canvas-container">
      <canvas
        type="2d"
        id="refineCanvas"
        class="refine-canvas"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        :style="canvasStyle"
      />
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="btn-ghost" @click="onCancel">取消</button>
      <button class="btn-main" @click="onConfirm">完成</button>
    </view>
  </view>
</template>

<script>
import { usePhotoStore } from '../../store/photo.js'
import { getCanvasNode } from '../../utils/canvas.js'

export default {
  name: 'RefinePage',
  data() {
    return {
      tool: 'eraser', // 'eraser' or 'brush'
      brushSize: 20,
      
      // Canvas 相关
      canvas: null,
      ctx: null,
      dpr: 1, // 设备像素比
      canvasWidth: 0,
      canvasHeight: 0,
      img: null, // 原图 Image 对象
      maskImg: null, // 蒙版 Image 对象
      
      // 触摸相关
      isDrawing: false,
      lastPos: { x: 0, y: 0 },
      
      // 缩放与平移
      isMultiTouching: false,
      lastDistance: 0,
      transform: {
        scale: 1,
        translateX: 0,
        translateY: 0,
      },
    }
  },
  computed: {
    canvasStyle() {
      const { scale, translateX, translateY } = this.transform
      return `transform: scale(${scale}) translate(${translateX}px, ${translateY}px);`
    }
  },
  onReady() {
    this.initCanvas()
  },
  methods: {
    async initCanvas() {
      const photoStore = usePhotoStore()
      if (!photoStore.filePath || !photoStore.fgBase64) {
        uni.showToast({ title: '缺少图片数据', icon: 'none' })
        uni.navigateBack()
        return
      }

      try {
        const canvas = await getCanvasNode('refineCanvas', this)
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio
        this.dpr = dpr
        this.canvas = canvas
        this.ctx = ctx

        const container = await this.getContainerSize()
        this.canvasWidth = container.width
        this.canvasHeight = container.height
        canvas.width = this.canvasWidth * dpr
        canvas.height = this.canvasHeight * dpr
        ctx.scale(dpr, dpr)

        // 加载原图和蒙版图
        this.img = await this.loadImage(photoStore.filePath)
        this.maskImg = await this.loadImage(photoStore.fgBase64)

        this.drawImage()
      } catch (e) {
        console.error('init canvas failed', e)
        uni.showToast({ title: '画布初始化失败', icon: 'none' })
      }
    },

    getContainerSize() {
      return new Promise(resolve => {
        uni.createSelectorQuery().in(this).select('.canvas-container').boundingClientRect(data => {
          resolve(data)
        }).exec()
      })
    },

    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = this.canvas.createImage()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    },

    drawImage() {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      // 绘制原图作为背景
      this.ctx.drawImage(this.img, 0, 0, this.canvasWidth, this.canvasHeight)

      // 绘制蒙版
      this.ctx.globalCompositeOperation = 'source-over' // 默认模式
      this.ctx.drawImage(this.maskImg, 0, 0, this.canvasWidth, this.canvasHeight)
    },

    onTouchStart(e) {
      if (!this.ctx) return
      const touches = e.touches
      if (touches.length === 1) {
        // 单指操作：绘画
        this.isDrawing = true
        const pos = this.getTouchPos(e)
        this.lastPos = pos
        this.drawOnMask(pos)
      } else if (touches.length >= 2) {
        // 多指操作：缩放
        this.isMultiTouching = true
        this.lastDistance = this.getMultiTouchDistance(touches)
      }
    },

    onTouchMove(e) {
      if (!this.ctx) return
      const touches = e.touches
      if (touches.length === 1 && this.isDrawing) {
        // 单指移动：绘画
        const pos = this.getTouchPos(e)
        this.drawLine(this.lastPos, pos)
        this.lastPos = pos
      } else if (touches.length >= 2 && this.isMultiTouching) {
        // 多指移动：缩放和拖动
        const newDistance = this.getMultiTouchDistance(touches)
        const scale = this.transform.scale * (newDistance / this.lastDistance)
        this.transform.scale = Math.max(1, Math.min(scale, 5)) // 限制缩放范围
        this.lastDistance = newDistance

        //  后续实现拖动逻辑
      }
    },

    onTouchEnd(e) {
      this.isDrawing = false
      this.isMultiTouching = false
    },

    getMultiTouchDistance(touches) {
      const t1 = touches[0]
      const t2 = touches[1]
      return Math.sqrt(Math.pow(t1.x - t2.x, 2) + Math.pow(t1.y - t2.y, 2))
    },

    getTouchPos(e) {
      const { x, y } = e.touches[0]
      return { x, y }
    },

    drawLine(start, end) {
      this.ctx.beginPath()
      this.ctx.moveTo(start.x, start.y)
      this.ctx.lineTo(end.x, end.y)
      this.ctx.lineWidth = this.brushSize
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      
      if (this.tool === 'eraser') {
        this.ctx.globalCompositeOperation = 'destination-out'
        this.ctx.strokeStyle = 'rgba(0,0,0,1)' // 纯色即可
      } else {
        this.ctx.globalCompositeOperation = 'source-over'
        // 在恢复时，我们需要在蒙版上绘制不透明区域，但这里有个技巧
        // 我们不能直接绘制原图，而是需要在一个离屏canvas上操作蒙版
        // 为了简化第一版，我们先实现擦除
        // 恢复的正确实现需要更复杂的图层操作
        // 此处暂时用绘制一个半透明颜色示意
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)' 
      }
      this.ctx.stroke()
    },

    drawOnMask(pos) {
      this.ctx.beginPath()
      this.ctx.arc(pos.x, pos.y, this.brushSize / 2, 0, 2 * Math.PI)
      if (this.tool === 'eraser') {
        this.ctx.globalCompositeOperation = 'destination-out'
        this.ctx.fillStyle = 'rgba(0,0,0,1)'
      } else {
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)' // 示意
      }
      this.ctx.fill()
    },
        onSliderChange(e) {
      this.brushSize = e.detail.value
    },

    onCancel() {
      uni.navigateBack()
    },
    onConfirm() {
      // 在这里处理完成逻辑
      console.log('Confirm refinement')
      uni.navigateBack()
    },
  },
}
</script>

<style scoped>
.page {
  background: #1a1a1a;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #2c2c2e;
  color: white;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.tool-btn {
  padding: 10rpx 20rpx;
  border: 1rpx solid #555;
  border-radius: 10rpx;
}

.tool-btn.active {
  background: #E6C875;
  color: #1a1400;
  border-color: #E6C875;
}

.size-label {
  font-size: 24rpx;
}

.brush-slider {
  width: 200rpx;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: linear-gradient(45deg, #333 25%, transparent 25%),
                    linear-gradient(-45deg, #333 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #333 75%),
                    linear-gradient(-45deg, transparent 75%, #333 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.refine-canvas {
  width: 100%;
  height: 100%;
}

.bottom-bar {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background: #2c2c2e;
}

.btn-ghost {
  background: transparent;
  color: #E6C875;
  border: 1rpx solid #E6C875;
}

.btn-main {
  background: #E6C875;
  color: #1a1400;
}
</style>
