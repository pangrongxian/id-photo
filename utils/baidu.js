// ============================================================
// 百度AI人像分割 API 封装 v2.0
// ============================================================
import { BAIDU_CONFIG } from './config.js'

let _token = ''
let _tokenExpire = 0

/**
 * 获取 Access Token（带本地缓存，30天有效）
 */
export async function getBaiduToken() {
  const now = Date.now()
  if (_token && now < _tokenExpire) return _token

  try {
    const cached = uni.getStorageSync('bd_tk')
    if (cached && cached.e > now) {
      _token = cached.t
      _tokenExpire = cached.e
      return _token
    }
  } catch (e) {}

  return new Promise((resolve, reject) => {
    uni.request({
      url: BAIDU_CONFIG.TOKEN_URL,
      method: 'POST',
      data: `grant_type=client_credentials&client_id=${BAIDU_CONFIG.API_KEY}&client_secret=${BAIDU_CONFIG.SECRET_KEY}`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      success(res) {
        if (res.data && res.data.access_token) {
          _token = res.data.access_token
          _tokenExpire = now + (res.data.expires_in - 86400) * 1000
          try { uni.setStorageSync('bd_tk', { t: _token, e: _tokenExpire }) } catch (e) {}
          resolve(_token)
        } else {
          reject(new Error('Token获取失败，请检查API Key配置'))
        }
      },
      fail() { reject(new Error('网络连接失败，请检查网络后重试')) },
    })
  })
}

let _effToken = ''
let _effTokenExpire = 0
export async function getEffectsToken() {
  if (!BAIDU_CONFIG.EFFECTS_API_KEY) {
    return Promise.reject(new Error('未配置图像特效 API_KEY。请在 config.js 中填入 EFFECTS_API_KEY'))
  }
  const now = Date.now()
  if (_effToken && now < _effTokenExpire) return _effToken

  try {
    const cached = uni.getStorageSync('bd_eff_tk')
    if (cached && cached.e > now) {
      _effToken = cached.t
      _effTokenExpire = cached.e
      return _effToken
    }
  } catch (e) {}

  return new Promise((resolve, reject) => {
    uni.request({
      url: BAIDU_CONFIG.TOKEN_URL,
      method: 'POST',
      data: `grant_type=client_credentials&client_id=${BAIDU_CONFIG.EFFECTS_API_KEY}&client_secret=${BAIDU_CONFIG.EFFECTS_SECRET_KEY}`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      success(res) {
        if (res.data && res.data.access_token) {
          _effToken = res.data.access_token
          _effTokenExpire = now + (res.data.expires_in - 86400) * 1000
          try { uni.setStorageSync('bd_eff_tk', { t: _effToken, e: _effTokenExpire }) } catch (e) {}
          resolve(_effToken)
        } else {
          reject(new Error('特效 Token 获取失败，请检查 Effects API Key 配置'))
        }
      },
      fail() { reject(new Error('网络连接失败，请重试')) },
    })
  })
}

/**
 * 人像分割（抠图）
 * @param {string} base64 - 图片base64（不含前缀data:...）
 * @returns {Promise<string>} - 前景图base64（带透明通道PNG）
 */
export async function segmentHuman(base64) {
  const token = await getBaiduToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BAIDU_CONFIG.SEGMENT_URL}?access_token=${token}`,
      method: 'POST',
      data: `image=${encodeURIComponent(base64)}&type=foreground&refine=true`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
      success(res) {
        if (res.data && res.data.foreground) {
          resolve(res.data.foreground)
        } else {
          // 百度常见错误码处理
          const code = res.data?.error_code
          const msg  = res.data?.error_msg || '抠图失败'
          if (code === 110 || code === 111) {
            _token = ''; _tokenExpire = 0  // token过期，清除缓存
            reject(new Error('认证过期，请重试'))
          } else if (code === 18) {
            reject(new Error('每日免费额度已用完，请明天再试'))
          } else {
            reject(new Error(msg))
          }
        }
      },
      fail() { reject(new Error('网络请求失败，请检查网络后重试')) },
    })
  })
}

/**
 * 人脸检测
 * @param {string} base64 - 图片base64
 * @returns {Promise<object>} - 人脸信息
 */
export async function detectFace(base64) {
  const token = await getBaiduToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BAIDU_CONFIG.DETECT_URL}?access_token=${token}`,
      method: 'POST',
      data: {
        image: base64,
        image_type: 'BASE64',
        face_field: 'face_shape,landmark',
      },
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.data && res.data.result && res.data.result.face_list.length > 0) {
          resolve(res.data.result.face_list[0])
        } else {
          reject(new Error('未检测到人脸'))
        }
      },
      fail() { reject(new Error('网络请求失败')) },
    })
  })
}

/**
 * 图像增强（画质修复）
 * @param {string} base64 - 图片base64（不含前缀data:...）
 * @returns {Promise<string>} - 增强后图片的base64
 */
export async function enhanceImage(base64) {
  const token = await getEffectsToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BAIDU_CONFIG.ENHANCE_URL}?access_token=${token}`,
      method: 'POST',
      data: `image=${encodeURIComponent(base64)}`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
      success(res) {
        if (res.data && res.data.image) {
          resolve(res.data.image)
        } else {
          const code = res.data?.error_code
          const msg  = res.data?.error_msg || '画质增强失败'
          if (code === 18) {
            reject(new Error('每日免费额度已用完，请明天再试'))
          } else {
            reject(new Error(msg))
          }
        }
      },
      fail() { reject(new Error('网络请求失败，请检查网络后重试')) },
    })
  })
}

/**
 * 本地图片路径 → base64（同时返回宽高）
 */
export function fileToBase64(filePath) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success(imgInfo) {
        // 利用小程序原生能力压缩图片（大幅减小 10M+ 的原图体积，提升长传速度与稳定性）
        uni.compressImage({
          src: filePath,
          quality: 80, // 80% 质量，既能保证高清效果，又能极大压缩体积
          success: (res) => {
            const finalPath = res.tempFilePath || filePath
            const fs = uni.getFileSystemManager()
            fs.readFile({
              filePath: finalPath,
              encoding: 'base64',
              success(readRes) { resolve({ base64: readRes.data, width: imgInfo.width, height: imgInfo.height }) },
              fail() { reject(new Error('读取压缩图片失败')) },
            })
          },
          fail: () => {
            // 如果压缩失败（通常是某些冷门格式），直接兜底读取原图
            const fs = uni.getFileSystemManager()
            fs.readFile({
              filePath,
              encoding: 'base64',
              success(readRes) { resolve({ base64: readRes.data, width: imgInfo.width, height: imgInfo.height }) },
              fail() { reject(new Error('读取原始图片失败')) },
            })
          }
        })
      },
      fail() { reject(new Error('获取图片信息失败')) },
    })
  })
}

/**
 * 魔法老照片 - 黑白上色
 * @param {string} base64 - 图片base64
 * @returns {Promise<string>} - 修复后的base64
 */
export async function colorizeImage(base64) {
  const token = await getEffectsToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BAIDU_CONFIG.COLORIZE_URL}?access_token=${token}`,
      method: 'POST',
      data: `image=${encodeURIComponent(base64)}`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
      success(res) {
        if (res.data && res.data.image) resolve(res.data.image)
        else reject(new Error(res.data?.error_msg || '照片上色失败'))
      },
      fail() { reject(new Error('网络请求失败，请检查网络后重试')) },
    })
  })
}

/**
 * 二次元化身 - 动漫风格转换
 * @param {string} base64 - 图片base64
 * @returns {Promise<string>} - 动漫化base64
 */
export async function animeFace(base64) {
  const token = await getEffectsToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BAIDU_CONFIG.ANIME_URL}?access_token=${token}`,
      method: 'POST',
      // type: anime 或者 mask(戴口罩) 默认就是anime
      data: `image=${encodeURIComponent(base64)}&type=anime`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
      success(res) {
        if (res.data && res.data.image) resolve(res.data.image)
        else reject(new Error(res.data?.error_msg || '动漫化失败，请确保图片含有人形且脸部清晰'))
      },
      fail() { reject(new Error('网络请求失败，请检查网络后重试')) },
    })
  })
}

/**
 * 图像修补（去水印/去杂物）
 * 参考文档：https://cloud.baidu.com/doc/IMAGEPROCESS/s/ok3bclome
 *
 * 注意：此接口必须使用 Content-Type: application/json，
 *       rectangle 字段直接传数组对象，不能 JSON.stringify 成字符串。
 *
 * @param {string} base64 - 原图base64（不含 data:... 前缀）
 * @param {Array<{width:number, height:number, top:number, left:number}>} rectangles - 消除区域坐标
 * @returns {Promise<string>} - 修复后的 base64
 */
export async function inpaintImage(base64, rectangles) {
  const token = await getEffectsToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BAIDU_CONFIG.INPAINT_URL}?access_token=${token}`,
      method: 'POST',
      // ⚠️ 官方文档明确要求：Content-Type 为 application/json，
      //    请求体为 JSON 格式，rectangle 直接是数组，不可stringify
      data: {
        image: base64,
        rectangle: rectangles
      },
      header: { 'Content-Type': 'application/json; charset=UTF-8' },
      timeout: 30000,
      success(res) {
        if (res.data && res.data.image) {
          resolve(res.data.image)
        } else {
          const code = res.data?.error_code
          const msg  = res.data?.error_msg || '处理失败'
          if (code === 110 || code === 111) {
            // token 过期，清除缓存下次重新获取
            _effToken = ''; _effTokenExpire = 0
            reject(new Error('认证过期，请重试'))
          } else if (code === 18) {
            reject(new Error('每日免费额度已用完，请明天再试'))
          } else if (code === 282004) {
            reject(new Error('选框越界：请确保框选区域在图片内部'))
          } else {
            reject(new Error(`去水印失败（${code || ''}）：${msg}`))
          }
        }
      },
      fail(err) { reject(new Error(`网络请求失败：${err?.errMsg || '请检查网络'}`)) },
    })
  })
}
