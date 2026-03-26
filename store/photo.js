import { defineStore } from 'pinia'

export const usePhotoStore = defineStore('photo', {
  state: () => ({
    // 原始图片路径
    filePath: '',
    // 抠图后的前景 base64
    fgBase64: '',
    // 最终生成的图片路径
    outputPath: '',
    
    // 选择的规格
    selectedSize: null,
    // 选择的背景色
    selectedColor: null,
    // 美颜参数
    beauty: null,
  }),

  actions: {
    // 从 editor 页面跳转到 result 页面时，设置结果数据
    setResultData(data) {
      this.outputPath = data.outputPath
      this.selectedSize = data.selectedSize
      this.selectedColor = data.selectedColor
      this.beauty = data.beauty
    },

    // 重置所有状态，用于开始一次新的制作
    reset() {
      this.filePath = ''
      this.fgBase64 = ''
      this.outputPath = ''
      this.selectedSize = null
      this.selectedColor = null
      this.beauty = null
    },
  },
})
