<template>
  <view class="page">
    <view v-for="group in groupedSizes" :key="group.category" class="size-group">
      <text class="category-title">{{ group.category }}</text>
      <view class="size-grid">
        <view
          class="size-item"
          v-for="item in group.sizes"
          :key="item.id"
          hover-class="item-hover"
          @click="selectSize(item)"
        >
          <text class="size-label">{{ item.label }}</text>
          <text class="size-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { PHOTO_SIZES } from '../../utils/config.js'

export default {
  data() {
    return {
      groupedSizes: [],
    }
  },
  onLoad() {
    this.groupSizes()
  },
  methods: {
    groupSizes() {
      const groups = {}
      PHOTO_SIZES.forEach(size => {
        if (!groups[size.category]) {
          groups[size.category] = {
            category: size.category,
            sizes: [],
          }
        }
        groups[size.category].sizes.push(size)
      })
      this.groupedSizes = Object.values(groups)
    },
    selectSize(size) {
      // 选择了尺寸后，返回上一页并传递数据
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2] // 获取上一页实例
      if (prevPage && prevPage.route === 'pages/id-photo/index') {
        prevPage.$vm.choosePhotoForSize(size) // 调用上一页的方法
      }
      uni.navigateBack()
    },
  },
}
</script>

<style lang="scss" scoped>
.page {
  padding: 24rpx 32rpx;
}

.size-group {
  margin-bottom: 48rpx;
}

.category-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
  border-left: 6rpx solid $uni-color-primary;
  line-height: 1.2;
}

.size-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20rpx;
}

.size-item {
  background: $uni-bg-color-secondary;
  padding: 24rpx;
  border-radius: 16rpx;
  text-align: center;
  @include press-effect;

  .size-label {
    font-size: 28rpx;
    font-weight: 600;
    color: #fff;
    display: block;
  }

  .size-desc {
    font-size: 22rpx;
    color: $uni-text-color-grey;
    margin-top: 4rpx;
  }
}

.item-hover {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>
