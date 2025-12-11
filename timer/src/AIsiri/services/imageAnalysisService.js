/**
 * 图片分析服务
 * 集成阿里云通义千问VL模型进行图片理解
 */

import { log } from '../utils/logger.js'

// 获取token
function getToken() {
  return localStorage.getItem('token') || ''
}

// 日志输出函数
function logAPI(operation, data) {
  const timestamp = new Date().toISOString()
  console.log(`\n🖼️ === 图片分析 ${operation} API调用 ===`)
  console.log(`⏰ 时间: ${timestamp}`)
  console.log(`📤 数据:`, data)
}

function logResponse(operation, response) {
  console.log(`📥 响应:`, response)
  console.log(`🖼️ === 图片分析 ${operation} API完成 ===\n`)
}

// 通用API请求函数
async function makeAPIRequest(endpoint, data = null, method = 'GET') {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  try {
    logAPI(endpoint, data)
    
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json'
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    const options = {
      method,
      headers
    }
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(url, options)
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('🔒 未认证或token失效')
        throw new Error('未认证，请重新登录')
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    logResponse(endpoint, result)
    
    return result
  } catch (error) {
    console.error(`❌ 图片分析API调用失败 ${endpoint}:`, error.message)
    throw error
  }
}

/**
 * 图片分析服务类
 */
class ImageAnalysisService {
  constructor() {
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    this.maxFileSize = 50 * 1024 * 1024 // 50MB
  }

  /**
   * 验证图片文件
   */
  validateImageFile(file) {
    const errors = []
    
    if (!file) {
      errors.push('请选择图片文件')
      return { isValid: false, errors }
    }
    
    if (!this.supportedFormats.includes(file.type)) {
      errors.push(`不支持的图片格式: ${file.type}，支持格式: ${this.supportedFormats.join(', ')}`)
    }
    
    if (file.size > this.maxFileSize) {
      errors.push(`文件大小超过限制: ${(file.size / 1024 / 1024).toFixed(2)}MB，最大支持: ${this.maxFileSize / 1024 / 1024}MB`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 上传并分析图片
   */
  async uploadAndAnalyze(file, customPrompt = '') {
    try {
      // 验证文件
      const validation = this.validateImageFile(file)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      log.info('开始上传并分析图片', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        customPrompt 
      })

      // 创建FormData
      const formData = new FormData()
      formData.append('image', file)
      if (customPrompt) {
        formData.append('custom_prompt', customPrompt)
      }

      // 调用上传分析API
      const response = await fetch('/api/image-analysis/upload-analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        log.success('图片分析成功', { 
          imageUrl: result.imageUrl,
          analysis: result.analysis 
        })
        return result
      } else {
        throw new Error(result.error || '图片分析失败')
      }
    } catch (error) {
      log.error('图片分析失败', error)
      throw error
    }
  }

  /**
   * 分析网络图片URL
   */
  async analyzeImageUrl(imageUrl, customPrompt = '') {
    try {
      if (!imageUrl || !imageUrl.trim()) {
        throw new Error('请提供有效的图片URL')
      }

      log.info('开始分析网络图片', { imageUrl, customPrompt })

      const payload = {
        image_url: imageUrl.trim()
      }
      
      if (customPrompt) {
        payload.custom_prompt = customPrompt
      }

      const result = await makeAPIRequest('/api/image-analysis/analyze-url', payload, 'POST')
      
      if (result.success) {
        log.success('网络图片分析成功', { 
          imageUrl: result.imageUrl,
          analysis: result.analysis 
        })
        return result
      } else {
        throw new Error(result.error || '图片分析失败')
      }
    } catch (error) {
      log.error('网络图片分析失败', error)
      throw error
    }
  }

  /**
   * 获取支持的图片格式
   */
  getSupportedFormats() {
    return this.supportedFormats
  }

  /**
   * 获取文件大小限制
   */
  getMaxFileSize() {
    return this.maxFileSize
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// 创建单例实例
const imageAnalysisService = new ImageAnalysisService()

export default imageAnalysisService



