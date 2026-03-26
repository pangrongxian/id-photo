// ============================================================
// Canvas 图像处理工具 v2.0
// 包含：背景合成、美颜（亮度/对比度/磨皮/锐化）、打印排版、保存
// ============================================================
import { PRINT_PAPER } from './config.js'

// ─────────────────────────────────────────────
// 辅助：获取 canvas 节点（Promise封装）
// ─────────────────────────────────────────────
export function getCanvasNode(canvasId, component) {
  return new Promise((resolve, reject) => {
    const query = component
      ? uni.createSelectorQuery().in(component)
      : uni.createSelectorQuery()
    query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((res) => {
      if (res && res[0] && res[0].node) {
        resolve(res[0].node)
      } else {
        reject(new Error(`Canvas节点 #${canvasId} 未找到`))
      }
    })
  })
}

// ─────────────────────────────────────────────
// 辅助：canvas导出为临时文件
// ─────────────────────────────────────────────
function canvasToFile(canvas, quality = 0.95) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      fileType: 'jpg',
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail:    ()    => reject(new Error('导出图片失败')),
    })
  })
}

// ─────────────────────────────────────────────
// 辅助：base64字符串 → canvas Image对象
// ─────────────────────────────────────────────
function loadBase64Image(canvas, base64, mimeType = 'image/png') {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = `data:${mimeType};base64,${base64}`
  })
}

// ─────────────────────────────────────────────
// 辅助：本地路径 → canvas Image对象
// ─────────────────────────────────────────────
function loadPathImage(canvas, path) {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败：' + path))
    img.src = path
  })
}

// ─────────────────────────────────────────────
// 核心1：合成证件照（背景色 + 前景人像）
// ─────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string}   opts.fgBase64   - 抠图后前景base64（带透明通道PNG）
 * @param {number[]} opts.bgRgb      - 背景色 [r, g, b]
 * @param {number}   opts.targetW    - 输出宽度px
 * @param {number}   opts.targetH    - 输出高度px
 * @param {object}   opts.canvas     - canvas节点
 * @param {object}   opts.beauty     - 美颜参数（可选）
 * @param {object}   opts.faceInfo   - 人脸检测信息（可选）
 * @returns {Promise<string>} 输出图片的临时路径
 */
export async function compositePhoto({ fgBase64, bgRgb, targetW, targetH, canvas, beauty = null, faceInfo = null }) {
  const ctx = canvas.getContext('2d')
  canvas.width  = targetW
  canvas.height = targetH

  // 1. 填充背景色
  ctx.fillStyle = `rgb(${bgRgb[0]},${bgRgb[1]},${bgRgb[2]})`
  ctx.fillRect(0, 0, targetW, targetH)

  // 2. 绘制前景（抠图结果，带透明通道）
  const fgImg = await loadBase64Image(canvas, fgBase64, 'image/png')

  // 智能构图
  let drawX, drawY, drawW, drawH
  // 优先使用人脸识别信息进行智能构图
  if (faceInfo && faceInfo.face_shape && faceInfo.face_shape.landmark) {
    const { location, face_shape } = faceInfo
    const imgW = fgImg.width
    const imgH = fgImg.height

    // 证件照头部占画面高度的比例（可调整）
    const headHeightRatio = 0.5

    // a. 计算人脸在原图中的实际高度（从下巴到头顶）
    const chinY = face_shape.landmark[6].y
    const topY = face_shape.landmark[73].y
    const faceHeightPx = Math.abs(chinY - topY)

    // b. 计算缩放比例，使人脸高度符合目标比例
    const targetFaceHeight = targetH * headHeightRatio
    const scale = targetFaceHeight / faceHeightPx

    // c. 计算缩放后的尺寸和位置
    drawW = imgW * scale
    drawH = imgH * scale
    // 将人脸中心对准画布的视觉中心（垂直方向偏上）
    const faceCenterX = location.left + location.width / 2
    const faceCenterY = topY + faceHeightPx / 2
    drawX = (targetW / 2) - faceCenterX * scale
    drawY = (targetH * 0.4) - faceCenterY * scale // 目标视觉中心在40%高度位置

  } else {
    // 降级处理：若无人脸信息，则使用常规居中方式
    // 等比缩放，垂直居中偏上（证件照人脸位置惯例）
    const scale  = Math.min(targetW / fgImg.width, targetH / fgImg.height)
    drawW  = fgImg.width  * scale
    drawH  = fgImg.height * scale
    drawX  = (targetW - drawW) / 2
    // 人脸偏上：垂直偏移 -5%
    drawY  = Math.max(0, (targetH - drawH) / 2 - targetH * 0.05)
  }

  ctx.drawImage(fgImg, drawX, drawY, drawW, drawH)

  // 3. 美颜处理（像素级操作）
  if (beauty && hasBeauty(beauty)) {
    await applyBeautyFilter(ctx, targetW, targetH, beauty, canvas)
  }

  return canvasToFile(canvas)
}

// 判断是否有美颜参数
function hasBeauty(b) {
  return b.brightness !== 0 || b.contrast !== 0 || b.smooth !== 0 || b.sharpen !== 0
}

// ─────────────────────────────────────────────
// 核心2：美颜滤镜（像素级处理）
// 亮度、对比度：CSS filter原生支持
// 磨皮、锐化：基于 ImageData 像素操作（简化版，适配小程序）
// ─────────────────────────────────────────────
async function applyBeautyFilter(ctx, w, h, beauty, canvas) {
  const { brightness, contrast, smooth, sharpen } = beauty

  // 1. 应用CSS Filter（亮度/对比度）
  let filterStr = ''
  if (brightness !== 0) filterStr += `brightness(${1 + brightness / 200}) `
  if (contrast !== 0)   filterStr += `contrast(${1 + contrast / 100}) `

  if (filterStr) {
    try {
      // 将当前画布内容（已有人像）作为图片源
      const tempImg = canvas.createImage()
      tempImg.src = canvas.toDataURL()
      await new Promise(r => tempImg.onload = r)

      // 清空画布，应用filter，然后将图片画回去
      ctx.clearRect(0, 0, w, h)
      ctx.filter = filterStr.trim()
      ctx.drawImage(tempImg, 0, 0, w, h)
      ctx.filter = 'none' // 立即清除filter，避免影响后续操作
    } catch (e) {
      // 低版本兼容
    }
  }

  // 2. 获取处理后（或原始）的像素数据
  const imageData = ctx.getImageData(0, 0, w, h)

  // 3. 应用磨皮（双边滤波）
  if (smooth > 0) {
    applyBilateralFilter(imageData, smooth)
  }

  // 4. 应用锐化
  if (sharpen > 0) {
    applySharpness(imageData, sharpen / 100)
  }

  // 5. 将最终处理完的像素数据写回画布
  ctx.putImageData(imageData, 0, 0)
}

/**
 * 高性能双边滤波（磨皮）
 * @param {ImageData} imageData - 像素数据
 * @param {number} strength - 磨皮强度 (0-100)
 */
function applyBilateralFilter(imageData, strength) {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  // 根据强度调整参数
  const sigmaColor = 0.1 + (strength / 100) * 0.4 // 色彩域sigma
  const sigmaSpace = 1 + (strength / 100) * 4     // 空间域sigma
  const radius = Math.ceil(sigmaSpace * 2)

  const temp = new Uint8ClampedArray(data.length)
  temp.set(data)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      let rSum = 0, gSum = 0, bSum = 0
      let wSum = 0

      for (let j = -radius; j <= radius; j++) {
        for (let k = -radius; k <= radius; k++) {
          const nY = y + j
          const nX = x + k

          if (nY >= 0 && nY < height && nX >= 0 && nX < width) {
            const nI = (nY * width + nX) * 4
            
            const dr = temp[i] - temp[nI]
            const dg = temp[i+1] - temp[nI+1]
            const db = temp[i+2] - temp[nI+2]
            const colorDist = Math.sqrt(dr*dr + dg*dg + db*db) / 255
            const spaceDist = Math.sqrt(j*j + k*k)

            const wColor = Math.exp(- (colorDist * colorDist) / (2 * sigmaColor * sigmaColor))
            const wSpace = Math.exp(- (spaceDist * spaceDist) / (2 * sigmaSpace * sigmaSpace))
            const weight = wColor * wSpace

            rSum += temp[nI] * weight
            gSum += temp[nI+1] * weight
            bSum += temp[nI+2] * weight
            wSum += weight
          }
        }
      }
      data[i]   = rSum / wSum
      data[i+1] = gSum / wSum
      data[i+2] = bSum / wSum
    }
  }
}

/**
 * 简化版锐化（基于差值叠加）
 * 适合小程序环境，避免复杂卷积运算
 */
function applySharpness(imageData, strength) {
  const data   = imageData.data
  const width  = imageData.width
  const height = imageData.height
  const factor = strength * 0.8  // 控制强度上限

  // 遍历每个像素（跳过边缘1px）
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4

      for (let c = 0; c < 3; c++) {  // R G B
        const center = data[i + c]
        // 上下左右4邻域平均
        const avg = (
          data[((y - 1) * width + x) * 4 + c] +
          data[((y + 1) * width + x) * 4 + c] +
          data[(y * width + x - 1) * 4 + c] +
          data[(y * width + x + 1) * 4 + c]
        ) / 4
        // 叠加差值
        data[i + c] = clamp(center + (center - avg) * factor)
      }
    }
  }
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))) }

// ─────────────────────────────────────────────
// 核心3：生成打印排版图
// 将单张证件照自动排列在6×4寸相纸上
// ─────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string}  opts.photoPath  - 单张证件照本地路径
 * @param {number}  opts.photoW     - 单张宽度px
 * @param {number}  opts.photoH     - 单张高度px
 * @param {object}  opts.canvas     - canvas节点
 * @returns {Promise<{path: string, cols: number, rows: number, total: number}>}
 */
export async function generatePrintLayout({ photoPath, photoW, photoH, canvas }) {
  const ctx     = canvas.getContext('2d')
  const { w: paperW, h: paperH, gap } = PRINT_PAPER

  canvas.width  = paperW
  canvas.height = paperH

  // 白底（打印用）
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, paperW, paperH)

  // 计算横向和纵向可以放几张（保留4mm边距 ≈ 47px）
  const margin = 47
  const usableW = paperW - margin * 2
  const usableH = paperH - margin * 2
  const cols    = Math.floor((usableW + gap) / (photoW + gap))
  const rows    = Math.floor((usableH + gap) / (photoH + gap))
  const total   = cols * rows

  if (total === 0) throw new Error('照片尺寸过大，无法排版')

  // 居中计算起始偏移
  const startX = margin + (usableW - cols * photoW - (cols - 1) * gap) / 2
  const startY = margin + (usableH - rows * photoH - (rows - 1) * gap) / 2

  const img = await loadPathImage(canvas, photoPath)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (photoW + gap)
      const y = startY + r * (photoH + gap)
      ctx.drawImage(img, x, y, photoW, photoH)
    }
  }

  // 画裁剪参考线（浅灰色虚线）
  ctx.strokeStyle = '#CCCCCC'
  ctx.lineWidth   = 1
  ctx.setLineDash([4, 4])

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (photoW + gap)
      const y = startY + r * (photoH + gap)
      ctx.strokeRect(x - 1, y - 1, photoW + 2, photoH + 2)
    }
  }

  const path = await canvasToFile(canvas, 0.98)
  return { path, cols, rows, total }
}

// ─────────────────────────────────────────────
// 核心4：保存图片到相册（带权限引导）
// ─────────────────────────────────────────────
export function saveToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(),
      fail: (err) => {
        const isDenied = err.errMsg && (
          err.errMsg.includes('auth deny') ||
          err.errMsg.includes('authorize') ||
          err.errMsg.includes('permission')
        )
        if (isDenied) {
          uni.showModal({
            title: '需要相册权限',
            content: '保存证件照需要访问相册权限，请在设置中开启',
            confirmText: '去设置',
            cancelText: '取消',
            success(modal) {
              if (modal.confirm) {
                uni.openSetting({
                  success(setting) {
                    if (setting.authSetting['scope.writePhotosAlbum']) {
                      uni.saveImageToPhotosAlbum({
                        filePath,
                        success: () => resolve(),
                        fail:    () => reject(new Error('保存失败，请重试')),
                      })
                    } else {
                      reject(new Error('未授权相册权限'))
                    }
                  },
                })
              } else {
                reject(new Error('已取消'))
              }
            },
          })
        } else {
          reject(new Error('保存失败：' + (err.errMsg || '未知错误')))
        }
      },
    })
  })
}

// ─────────────────────────────────────────────
// 核心5：美颜预览（仅用于实时预览，低分辨率快速渲染）
// ─────────────────────────────────────────────
/**
 * 快速渲染预览（缩小尺寸，提升响应速度）
 */
export async function renderPreview({ fgBase64, bgRgb, displayW, displayH, canvas, beauty }) {
  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  const ctx  = canvas.getContext('2d')

  canvas.width  = displayW * dpr
  canvas.height = displayH * dpr
  ctx.scale(dpr, dpr)

  // 背景
  ctx.fillStyle = `rgb(${bgRgb[0]},${bgRgb[1]},${bgRgb[2]})`
  ctx.fillRect(0, 0, displayW, displayH)

  // 前景
  const fgImg = await loadBase64Image(canvas, fgBase64, 'image/png')
  const scale  = Math.min(displayW / fgImg.width, displayH / fgImg.height)
  const drawW  = fgImg.width  * scale
  const drawH  = fgImg.height * scale
  const drawX  = (displayW - drawW) / 2
  const drawY  = Math.max(0, (displayH - drawH) / 2 - displayH * 0.05)
  ctx.drawImage(fgImg, drawX, drawY, drawW, drawH)

  // 简化美颜预览（只应用亮度对比度，磨皮锐化在预览时跳过以提速）
  if (beauty && (beauty.brightness !== 0 || beauty.contrast !== 0)) {
    let f = ''
    if (beauty.brightness !== 0) f += `brightness(${1 + beauty.brightness / 200}) `
    if (beauty.contrast   !== 0) f += `contrast(${1 + beauty.contrast / 100}) `
    try { ctx.filter = f.trim() } catch (e) {}
  }
}
