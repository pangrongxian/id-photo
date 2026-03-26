<template>
  <view class="panel">
    <view class="panel-header">
      <text class="panel-title">美化调整</text>
      <button class="btn-reset" @click="onReset">
        <text class="icon">↺</text> 重置
      </button>
    </view>
    <view class="adjust-item" v-for="item in adjustItems" :key="item.key">
      <view class="adjust-header">
        <text class="adjust-icon">{{ item.icon }}</text>
        <text class="adjust-label">{{ item.label }}</text>
        <text :class="['adjust-val', modelValue[item.key] !== 0 ? 'active' : '']">
          {{ modelValue[item.key] > 0 ? '+' : '' }}{{ modelValue[item.key] }}
        </text>
      </view>
      <view class="slider-wrap">
        <text class="slider-edge">{{ item.min }}</text>
        <slider
          class="adjust-slider"
          :value="modelValue[item.key]"
          :min="item.min" :max="item.max" :step="item.step"
          activeColor="#c9a84c" backgroundColor="#2e2b24" block-color="#e8c96a"
          @change="(e) => onSliderChange(item.key, e)"
          @changing="(e) => onSliderChanging(item.key, e)"
        />
        <text class="slider-edge">{{ item.max }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BeautyPanel',
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:modelValue', 'reset'],
  data() {
    return {
      adjustItems: [
        {
          key: 'brightness', icon: '☀️', label: '亮度',
          min: -80, max: 80, step: 5,
        },
        {
          key: 'contrast', icon: '◑', label: '对比度',
          min: -50, max: 80, step: 5,
        },
        {
          key: 'smooth', icon: '✨', label: '磨皮',
          min: 0, max: 60, step: 5,
        },
        {
          key: 'sharpen', icon: '🔍', label: '锐化',
          min: 0, max: 80, step: 5,
        },
      ],
    }
  },
  methods: {
    updateValue(key, value) {
      const newValue = { ...this.modelValue, [key]: value }
      this.$emit('update:modelValue', newValue)
    },
    onSliderChange(key, e) {
      this.updateValue(key, e.detail.value)
    },
    onSliderChanging(key, e) {
      this.updateValue(key, e.detail.value)
    },
    onReset() {
      this.$emit('reset')
    },
  },
}
</script>

<style lang="scss" scoped>
.panel {
  background: #1C1C1E;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 32rpx;
  padding: 32rpx 28rpx;
  margin-top: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.panel-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #E6C875;
  letter-spacing: 2rpx;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.05);
  color: #8E8E93;
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  line-height: 1.2;
  .icon {
    font-size: 28rpx;
  }
}

.adjust-item {
  padding: 20rpx 0;
}

.adjust-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.adjust-icon { font-size: 32rpx; margin-right: 12rpx; }
.adjust-label { font-size: 26rpx; color: #E8E0D0; flex: 1; }
.adjust-val {
  font-size: 24rpx;
  color: #8E8E93;
  font-family: monospace;
  &.active {
    color: #E6C875;
    font-weight: 600;
  }
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.slider-edge {
  font-size: 22rpx;
  color: #8E8E93;
  font-family: monospace;
}

.adjust-slider {
  flex: 1;
  margin: 0;
}
</style>
