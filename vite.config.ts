// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import multer from 'multer'
import dotenv from 'dotenv'
dotenv.config()

// 检测结果缓存
const detectionCache = new Map()
const CACHE_DURATION = 5000 // 5秒缓存

// 手势映射配置
const GESTURE_MAPPING = {
  'One': '数字1',
  'Five': '数字5',
  'Fist': '拳头',
  'OK': 'OK手势',
  'Prayer': '祈祷',
  'Congratulation': '作揖',
  'Honour': '作别',
  'Heart_single': '单手比心',
  'Thumb_up': '点赞',
  'Thumb_down': 'Diss',
  'ILY': '我爱你',
  'Palm_up': '掌心向上',
  'Heart_1': '双手比心1',
  'Heart_2': '双手比心2',
  'Heart_3': '双手比心3',
  'Two': '数字2',
  'Three': '数字3',
  'Four': '数字4',
  'Six': '数字6',
  'Seven': '数字7',
  'Eight': '数字8',
  'Nine': '数字9',
  'Rock': 'Rock',
  'Insult': '竖中指'
} as const

const EMOTION_MAPPING = {
  'angry': '愤怒',
  'disgust': '厌恶',
  'fear': '恐惧',
  'happy': '高兴',
  'sad': '伤心',
  'surprise': '惊讶',
  'neutral': '无表情',
  'pouty': '撅嘴',
  'grimace': '鬼脸'
} as const

const EXPRESSION_MAPPING = {
  'none': '不笑',
  'smile': '微笑',
  'laugh': '大笑'
} as const


function extractFaceDetectionFields(response: any) {
  if (response.error_code !== 0 || !response.result.face_list) {
    return {
      face_num: 0,
      faces: []
    };
  }

  const faces = response.result.face_list.map((face: any) => ({
    age: face.age,
    gender: face.gender,
    expression: face.expression,
    emotion: face.emotion,
    glasses: face.glasses
  }));

  return {
    face_num: response.result.face_num,
    faces
  };
}

function extractGestureDetectionFields(response: any) {
  const gestures = [];
  for (const result of response.result || []) {
    if (result.classname === 'Face') {continue;}
    const chineseName = GESTURE_MAPPING[result.classname as keyof typeof GESTURE_MAPPING] || result.classname;
    gestures.push(chineseName);
  }
  return {
    gestures
  };
}


// 人脸检测逻辑中间件
function createDetectionMiddleware(): Plugin {
  return {
    name: 'baidu-ai-detection',
    configureServer(server) {
      // 人脸检测处理中间件
      server.middlewares.use('/api/detect/face', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next()
        }

        try {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })

          req.on('end', async () => {
            const { image, access_token, face_field = 'age,gender,expression,emotion,glasses' } = JSON.parse(body)

            if (!image || !access_token) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '缺少image或access_token参数' }))
              return
            }

            // 检查缓存
            const cacheKey = `face_${image.substring(0, 50)}`
            const cached = detectionCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
              console.log('返回缓存的人脸检测结果')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(cached.data))
              return
            }

            try {
              // 直接调用百度API（服务器端）
              const baiduUrl = `https://aip.baidubce.com/rest/2.0/face/v3/detect?access_token=${access_token}`
              const formData = new URLSearchParams()
              formData.append('image', image)
              formData.append('image_type', 'BASE64')
              formData.append('face_field', face_field)

              const response = await fetch(baiduUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
              })

              const result: any = await response.json()

              // console.log('Baidu face detection response:', JSON.stringify(result, null, 2))
              // console.log('Baidu face detection response:', result)

              // 提取关键字段
              const extractedFaceData = extractFaceDetectionFields(result)
              // 对提取的人脸数据进行中文映射
              extractedFaceData.faces.forEach((face: any) => {
                if (face.emotion && face.emotion.type) {
                  face.emotion.type = EMOTION_MAPPING[face.emotion.type as keyof typeof EMOTION_MAPPING] || face.emotion.type
                }
                if (face.expression && face.expression.type) {
                  face.expression.type = EXPRESSION_MAPPING[face.expression.type as keyof typeof EXPRESSION_MAPPING] || face.expression.type
                }
              })

              // 处理检测结果，包含提取的数据
              const processedResult = {
                extracted_fields: extractedFaceData,
                processed_at: new Date().toISOString(),
                detection_type: 'face',
                cache_hit: false
              }

              // 缓存结果
              detectionCache.set(cacheKey, {
                data: processedResult,
                timestamp: Date.now()
              })

              // 清理过期缓存
              for (const [key, value] of detectionCache.entries()) {
                if (Date.now() - value.timestamp > CACHE_DURATION * 2) {
                  detectionCache.delete(key)
                }
              }


              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(processedResult))

            } catch (error: any) {
              console.error('百度人脸API调用失败:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ 
                error: '人脸检测失败', 
                details: error?.message || 'Unknown error'
              }))
            }
          })

        } catch (error) {
          console.error('人脸检测中间件错误:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: '服务器内部错误' }))
        }
      })

      // 手势检测处理中间件
      server.middlewares.use('/api/detect/gesture', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next()
        }

        try {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })

          req.on('end', async () => {
            const { image, access_token } = JSON.parse(body)
            
            if (!image || !access_token) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '缺少image或access_token参数' }))
              return
            }

            // 检查缓存
            const cacheKey = `gesture_${image.substring(0, 50)}`
            const cached = detectionCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
              console.log('返回缓存的手势检测结果')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(cached.data))
              return
            }

            try {
              // 调用百度API
              const baiduUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v1/gesture?access_token=${access_token}`
              const formData = new URLSearchParams()
              formData.append('image', image)

              const response = await fetch(baiduUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
              })

              const result: any = await response.json()
              // console.log('Baidu gesture detection response:', result)

              const extractedGestureData = extractGestureDetectionFields(result)

              // console.log('提取的手势数据:', extractedGestureData)
              
              // 处理手势识别结果，添加本地映射
              const processedResult = {
                extracted_fields: extractedGestureData,
                processed_at: new Date().toISOString(),
                detection_type: 'gesture',
                cache_hit: false,
              }

              // 缓存结果
              detectionCache.set(cacheKey, {
                data: processedResult,
                timestamp: Date.now()
              })

              // 清理过期缓存
              for (const [key, value] of detectionCache.entries()) {
                if (Date.now() - value.timestamp > CACHE_DURATION * 2) {
                  detectionCache.delete(key)
                }
              }
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(processedResult))

            } catch (error: any) {
              console.error('百度手势API调用失败:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ 
                error: '手势检测失败', 
                details: error?.message || 'Unknown error'
              }))
            }
          })

        } catch (error) {
          console.error('手势检测中间件错误:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: '服务器内部错误' }))
        }
      })

      // 批量检测中间件
      server.middlewares.use('/api/detect/batch', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next()
        }

        try {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })

          req.on('end', async () => {
            const { images, access_token, detection_type = 'both' } = JSON.parse(body)
            
            if (!images || !Array.isArray(images) || !access_token) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '缺少images数组或access_token参数' }))
              return
            }

            try {
              const results = []
              
              for (let i = 0; i < images.length; i++) {
                const image = images[i]
                const batchResult: any = { index: i, image_id: image.id || i }

                if (detection_type === 'face' || detection_type === 'both') {
                  // 人脸检测
                  try {
                    const faceUrl = `https://aip.baidubce.com/rest/2.0/face/v3/detect?access_token=${access_token}`
                    const faceFormData = new URLSearchParams()
                    faceFormData.append('image', image.data)
                    faceFormData.append('image_type', 'BASE64')
                    faceFormData.append('face_field', 'age,gender,expression')

                    const faceResponse = await fetch(faceUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                      body: faceFormData
                    })

                    batchResult.face_result = await faceResponse.json()
                  } catch (error: any) {
                    batchResult.face_error = error?.message || 'Face detection error'
                  }
                }

                if (detection_type === 'gesture' || detection_type === 'both') {
                  // 手势检测  
                  try {
                    const gestureUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v1/gesture?access_token=${access_token}`
                    const gestureFormData = new URLSearchParams()
                    gestureFormData.append('image', image.data)

                    const gestureResponse = await fetch(gestureUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                      body: gestureFormData
                    })

                    batchResult.gesture_result = await gestureResponse.json()
                  } catch (error: any) {
                    batchResult.gesture_error = error?.message || 'Gesture detection error'
                  }
                }

                results.push(batchResult)
              }

              const finalResult = {
                processed_at: new Date().toISOString(),
                total_images: images.length,
                detection_type,
                results
              }

              console.log(`批量检测完成: 处理了${images.length}张图片`)
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(finalResult))

            } catch (error: any) {
              console.error('批量检测失败:', error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ 
                error: '批量检测失败', 
                details: error?.message || 'Unknown batch error'
              }))
            }
          })

        } catch (error) {
          console.error('批量检测中间件错误:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: '服务器内部错误' }))
        }
      })

      // 缓存状态查询中间件
      server.middlewares.use('/api/cache/status', (_req, res) => {
        const cacheStats = {
          total_entries: detectionCache.size,
          cache_duration_ms: CACHE_DURATION,
          entries: Array.from(detectionCache.entries()).map(([key, value]) => ({
            key: key.substring(0, 20) + '...',
            age_ms: Date.now() - value.timestamp,
            type: key.startsWith('face_') ? 'face' : 'gesture'
          }))
        }
        
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(cacheStats))
      })

      // 清除缓存中间件
      server.middlewares.use('/api/cache/clear', (_req, res) => {
        const previousSize = detectionCache.size
        detectionCache.clear()
        
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ 
          message: '缓存已清除', 
          cleared_entries: previousSize 
        }))
      })

      // XfVoice配置获取中间件
      server.middlewares.use('/api/xfvoice/config', (_req, res) => {
        const xfVoiceConfig = {
          APPID: process.env.XF_APP_APPID,
          APIKey: process.env.XF_APP_APIKEY,
          APISecret: process.env.XF_APP_APISECRET,
          url: 'wss://iat-api.xfyun.cn/v2/iat'
        }

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(xfVoiceConfig))
      })

      const upload = multer({ storage: multer.memoryStorage() })
      server.middlewares.use('/api/whisper', (req, res, next) => {
        if (req.method !== 'POST') {
          return next()
        }

        // 使用multer处理文件上传
        upload.single('audio')(req as any, res as any, async (err: any) => {
          if (err) {
            console.error('Multer错误:', err)
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '文件上传失败' }))
            return
          }

          const file = (req as any).file as Express.Multer.File
          if (!file) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: '未找到音频文件' }))
            return
          }

          try {
            // 获取Cloudflare API配置
            const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
            const apiToken = process.env.CLOUDFLARE_API_TOKEN
            
            if (!accountId || !apiToken) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '未配置Cloudflare API凭证' }))
              return
            }

            // 调用Cloudflare Workers AI Whisper API
            const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/openai/whisper`
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/octet-stream'
              },
              body: file.buffer
            })

            if (!response.ok) {
              const errorText = await response.text()
              console.error('Cloudflare Workers AI错误:', response.status, errorText)
              res.statusCode = response.status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ 
                error: '语音识别失败',
                details: errorText
              }))
              return
            }

            const result = await response.json() as { result: { text: string } }
            const transcriptText = result.result?.text || ''
            console.log('Cloudflare Whisper识别结果:', transcriptText)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              text: transcriptText,
              processed_at: new Date().toISOString()
            }))

          } catch (error: any) {
            console.error('Cloudflare Workers AI调用失败:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              error: '语音识别服务器错误', 
              details: error?.message || 'Unknown error'
            }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    createDetectionMiddleware()
  ],
  server: {
    host: true,
    proxy: {
      '/offer': {
        target: 'http://192.168.43.127:8020',
        changeOrigin: true,
      },
      '/human': {
        target: 'http://192.168.43.127:8020',
        changeOrigin: true,
      },
      '/record': {
        target: 'http://192.168.43.127:8020',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@mediapipe/hands'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
    sourcemap: true,
  },
  define: {
    __BAIDU_API_BASE_URL__: JSON.stringify('https://aip.baidubce.com/rest/2.0'),
    __DETECTION_ENDPOINTS__: JSON.stringify({
      face: '/api/detect/face',
      gesture: '/api/detect/gesture',
      batch: '/api/detect/batch',
      cache_status: '/api/cache/status',
      cache_clear: '/api/cache/clear',
      baidu_token: '/api/baidu/token',
      xfvoice_config: '/api/xfvoice/config',
      whisper: '/api/whisper'
    }),
    __GESTURE_MAPPING__: JSON.stringify(GESTURE_MAPPING),
    __XFVOICE_CONFIG__: JSON.stringify({
      url: 'wss://iat-api.xfyun.cn/v2/iat',
      config_endpoint: '/api/xfvoice/config'
    }),
  },
})