import CryptoJS from 'crypto-js'

/**
 * 获取 Volcengine API Headers (V4签名)
 * @param {string} method - 'GET' | 'POST' etc
 * @param {string} url - 完整请求URL
 * @param {object} headers - 自定义请求头（如 Content-Type）
 * @param {string} body - 序列化后的请求内容（需要字符串）
 * @param {string} ak - AccessKey
 * @param {string} sk - SecretKey
 * @param {string} region - 如 cn-north-1
 * @param {string} service - 如 cv
 */
export function getVolcengineHeaders(method, url, headers, body, ak, sk, region = 'cn-north-1', service = 'cv') {
  const t = new Date()
  const amzDate = t.toISOString().replace(/[:-]|\.\d{3}/g, '') // YYYYMMDDThhmmssZ
  const dateStamp = amzDate.substring(0, 8)

  const urlObj = buildUrlObject(url)
  const canonicalUri = urlObj.pathname || '/'
  
  // 查询参数排序
  const queryKeys = Object.keys(urlObj.query).sort()
  const canonicalQueryString = queryKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(urlObj.query[k])}`).join('&')

  // 整理 Headers (必须包含 host 和 x-date)
  const signedHeadersMap = { ...headers, host: urlObj.host, 'X-Date': amzDate }
  const signedHeadersList = Object.keys(signedHeadersMap).map(k => k.toLowerCase()).sort()
  const canonicalHeaders = signedHeadersList.map(k => {
    // 根据规范寻找原key对应的value
    const originalKey = Object.keys(signedHeadersMap).find(ok => ok.toLowerCase() === k)
    return `${k}:${String(signedHeadersMap[originalKey]).trim()}\n`
  }).join('')
  
  const signedHeaders = signedHeadersList.join(';')

  // Hash Payload
  const payloadHash = CryptoJS.SHA256(body).toString(CryptoJS.enc.Hex)

  // Canonical Request
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  // String to sign
  const algorithm = 'HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/request`
  const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex)
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${hashedCanonicalRequest}`

  // Calculate signature
  const kDate = CryptoJS.HmacSHA256(dateStamp, sk)
  const kRegion = CryptoJS.HmacSHA256(region, kDate)
  const kService = CryptoJS.HmacSHA256(service, kRegion)
  const kSigning = CryptoJS.HmacSHA256("request", kService)
  
  const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex)

  // Authorization Header
  const authorization = `${algorithm} Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    ...signedHeadersMap,
    'Authorization': authorization
  }
}

// 简易 URL 解析器 (因为 uniapp 没提供 new URL)
function buildUrlObject(fullUrl) {
  const parts = fullUrl.split('?')
  const baseUrl = parts[0]
  const queryStr = parts[1] || ''
  
  const protocolIdx = baseUrl.indexOf('://')
  const protocol = protocolIdx !== -1 ? baseUrl.slice(0, protocolIdx) : 'https'
  
  const urlWithoutProtocol = protocolIdx !== -1 ? baseUrl.slice(protocolIdx + 3) : baseUrl
  const pathIdx = urlWithoutProtocol.indexOf('/')
  
  const host = pathIdx !== -1 ? urlWithoutProtocol.slice(0, pathIdx) : urlWithoutProtocol
  const pathname = pathIdx !== -1 ? urlWithoutProtocol.slice(pathIdx) : '/'
  
  const query = {}
  if (queryStr) {
    queryStr.split('&').forEach(pair => {
      const kv = pair.split('=')
      query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '')
    })
  }

  return { protocol, host, pathname, query }
}
