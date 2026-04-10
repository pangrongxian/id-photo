import { BAIDU_CONFIG } from './config.js'
import { getVolcengineHeaders } from './volcAuth.js'

/**
 * 图像涂抹消除 (Inpainting)
 * @param {string} base64 - 原图base64（不含 data:... 前缀）
 * @param {string} maskBase64 - 遮罩图base64（带涂抹区域为白色，其余黑色，不含数据前缀）
 * @returns {Promise<string>} - 修复后的 base64
 */
export async function inpaintImageVolc(base64, maskBase64) {
  if (!BAIDU_CONFIG.VOLC_AK || !BAIDU_CONFIG.VOLC_SK) {
    return Promise.reject(new Error('未配置火山引擎 API 密钥 (VOLC_AK / VOLC_SK)'))
  }

  const url = `https://${BAIDU_CONFIG.VOLC_HOST}/?Action=CVProcess&Version=2022-08-31`
  
  const requestBody = JSON.stringify({
    "req_key": "high_aes_smart_inpainting",
    "binary_data_base64": [
      base64,
      maskBase64
    ]
  })

  // 取得 V4 签名 Headers
  const headers = getVolcengineHeaders(
    'POST',
    url,
    { 'Content-Type': 'application/json' },
    requestBody,
    BAIDU_CONFIG.VOLC_AK,
    BAIDU_CONFIG.VOLC_SK,
    'cn-north-1',
    'cv'
  )

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'POST',
      data: requestBody,
      header: headers,
      timeout: 60000,
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.code === 10000) {
          // code 10000 表示成功，返回结果通常在 data.data.binary_data_base64 [0] 中
          const resultData = res.data.data
          if (resultData && resultData.binary_data_base64 && resultData.binary_data_base64.length > 0) {
            resolve(resultData.binary_data_base64[0])
          } else {
            reject(new Error('处理成功但未返回图像数据'))
          }
        } else {
          console.error('[Volcengine Info]', res.data)
          let errMsg = '处理失败'
          if (res.data && res.data.message) {
            errMsg += `: ${res.data.message}`
          } else if (res.data && res.data.ResponseMetadata && res.data.ResponseMetadata.Error) {
            errMsg += `: ${res.data.ResponseMetadata.Error.Message}`
          }
          reject(new Error(errMsg))
        }
      },
      fail(err) {
        reject(new Error(`网络请求失败：${err.errMsg || '请检查网络或代理'}`))
      }
    })
  })
}
