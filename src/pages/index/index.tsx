import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Textarea, Image, Button, Input } from '@tarojs/components'
import { 
  generateImage, hasApiKey, GenerateOptions, 
  getPaperSizeIndex, getPaperOrientation, 
  getImageStyle, STYLE_NAMES,
  getImageHistory, addImageToHistory, deleteImageFromHistory, HistoryImage,
  registerUser, getUserKey, setApiKey, parseDataUrl, getMimeTypeFromPath
} from '../../services/api'
import { useTranslation } from '../../utils/i18n'
import './index.scss'

// 历史图片最大数量
const MAX_HISTORY_IMAGES = 3

// 示例提示词
const EXAMPLE_PROMPTS = [
  '春天来了，花儿开放',
  '我爱我的家',
  '小动物们的快乐一天',
  '保护地球，爱护环境',
  '中秋节快乐',
]

// 纸张尺寸选项 (宽:高)
const PAPER_SIZES = [
  { name: 'A4 纸', ratio: '210:297', portrait: '2:3', landscape: '3:2' },
  { name: 'A3 纸', ratio: '297:420', portrait: '2:3', landscape: '3:2' },
  { name: '正方形', ratio: '1:1', portrait: '1:1', landscape: '1:1' },
  { name: '16:9 屏幕', ratio: '16:9', portrait: '9:16', landscape: '16:9' },
  { name: '4:3 屏幕', ratio: '4:3', portrait: '3:4', landscape: '4:3' },
]

export default function Index() {
  const { t } = useTranslation()
  
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [error, setError] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false) // 全屏预览
  const [currentStyle, setCurrentStyle] = useState('handwritten') // 当前风格
  const [historyImages, setHistoryImages] = useState<HistoryImage[]>([]) // 历史图片
  const [previewHistoryImage, setPreviewHistoryImage] = useState<string | null>(null) // 预览历史图片
  
  // 基础图片（用于图生图）
  const [baseImage, setBaseImage] = useState<string>('')
  const [baseImageMimeType, setBaseImageMimeType] = useState<string>('')
  
  // 上传图片相关状态
  const [uploadedImages, setUploadedImages] = useState<HistoryImage[]>([]) // 上传的图片列表
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null) // 选中的图片ID
  const [isUploading, setIsUploading] = useState(false) // 上传中状态
  
  // 登录弹窗状态
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // 检查 API Key 配置状态 - 页面首次加载时
  useEffect(() => {
    const keyExists = hasApiKey()
    setHasKey(keyExists)
    // 如果没有 API Key，显示登录弹窗
    if (!keyExists) {
      setShowLoginModal(true)
    }
    setCurrentStyle(getImageStyle())
    setHistoryImages(getImageHistory())
  }, [])

  // 页面显示时重新检查 API Key 状态和风格（从设置页返回时触发）
  useDidShow(() => {
    const keyExists = hasApiKey()
    setHasKey(keyExists)
    // 如果没有 API Key，显示登录弹窗
    if (!keyExists) {
      setShowLoginModal(true)
    }
    setCurrentStyle(getImageStyle())
    setHistoryImages(getImageHistory())
  })

  // 跳转到设置页面
  const goToSettings = () => {
    Taro.navigateTo({ url: '/pages/settings/index' })
  }

  // 获取当前选择的纵横比（从存储读取）
  const getAspectRatio = (): string => {
    const paperIndex = getPaperSizeIndex()
    const isLandscape = getPaperOrientation()
    const paper = PAPER_SIZES[paperIndex]
    return isLandscape ? paper.landscape : paper.portrait
  }

  // 获取风格名称
  const getStyleName = (): string => {
    return STYLE_NAMES[currentStyle] || '手抄报'
  }

  // 关闭全屏预览
  const closeFullscreen = () => {
    setShowFullscreen(false)
    setGeneratedImage('')
  }

  // 删除历史图片
  const handleDeleteHistory = (e: any, imageId: string) => {
    e.stopPropagation()
    Taro.showModal({
      title: t('confirmDelete'),
      content: t('confirmDeleteMessage'),
      success: (res) => {
        if (res.confirm) {
          deleteImageFromHistory(imageId)
          setHistoryImages(prev => prev.filter(img => img.id !== imageId))
          Taro.showToast({ title: t('deleted'), icon: 'success' })
        }
      }
    })
  }

  // 处理手机号登录/注册
  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phoneNumber.trim())) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }

    setIsRegistering(true)

    try {
      // 先尝试获取已有用户的 API Key
      const getUserResult = await getUserKey(phoneNumber.trim())
      
      if (getUserResult.success && getUserResult.result?.apiKey) {
        // 用户已存在，直接使用返回的 API Key
        setApiKey(getUserResult.result.apiKey)
        setHasKey(true)
        setShowLoginModal(false)
        Taro.showToast({ title: '登录成功', icon: 'success' })
        return
      }

      // 用户不存在，进行注册
      const registerResult = await registerUser(phoneNumber.trim())
      
      if (registerResult.success && registerResult.result?.apiKey) {
        setApiKey(registerResult.result.apiKey)
        setHasKey(true)
        setShowLoginModal(false)
        Taro.showToast({ title: '注册成功', icon: 'success' })
      } else {
        Taro.showToast({ 
          title: registerResult.message || '注册失败，请重试', 
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      Taro.showToast({ 
        title: '登录失败，请重试', 
        icon: 'none' 
      })
    } finally {
      setIsRegistering(false)
    }
  }

  // 获取微信手机号（微信小程序专用）
  const handleGetWeChatPhone = (e: any) => {
    console.log('微信手机号授权:', e)
    // 这里需要后端支持微信手机号解密
    // 暂时提示用户手动输入
    Taro.showToast({ 
      title: '请手动输入手机号', 
      icon: 'none' 
    })
  }

  // 生成唯一的上传图片 ID
  const generateUploadId = () => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 处理图片上传成功
  const handleImageUploadSuccess = (imageUrl: string) => {
    const newImage: HistoryImage = {
      id: generateUploadId(),
      url: imageUrl,
      createdAt: Date.now()
    }
    setUploadedImages(prev => [newImage, ...prev])
    setSelectedImageId(newImage.id)
    
    setIsUploading(false)
    Taro.hideLoading()
    Taro.showToast({ title: t('imageUploadSuccess'), icon: 'success', duration: 1500 })
  }

  // 处理图片上传失败
  const handleImageUploadError = () => {
    setIsUploading(false)
    Taro.hideLoading()
    Taro.showToast({ title: t('imageReadFailed'), icon: 'none' })
  }

  // 上传本地图片
  const handleUploadImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const file = res.tempFiles?.[0]
        
        // 显示加载提示
        setIsUploading(true)
        Taro.showLoading({ title: t('readingImage'), mask: true })
        
        // H5 environment handling
        if (process.env.TARO_ENV === 'h5') {
          // In H5, we need to convert blob to base64 using FileReader
          const reader = new FileReader()
          
          // For H5, we can get the file from tempFiles
          if (file && file.path) {
            fetch(file.path)
              .then(response => response.blob())
              .then(blob => {
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                  const base64data = reader.result as string
                  handleImageUploadSuccess(base64data)
                }
                reader.onerror = () => {
                  handleImageUploadError()
                }
              })
              .catch(() => {
                handleImageUploadError()
              })
          } else {
            handleImageUploadError()
          }
        } else {
          // WeChat Mini Program environment
          Taro.getFileSystemManager().readFile({
            filePath: tempFilePath,
            encoding: 'base64',
            success: (fileRes: any) => {
              const mimeType = getMimeTypeFromPath(tempFilePath, file?.type)
              const imageData = fileRes.data as string
              const imageUrl = `data:${mimeType};base64,${imageData}`
              
              handleImageUploadSuccess(imageUrl)
            },
            fail: () => {
              handleImageUploadError()
            }
          })
        }
      },
      fail: () => {
        Taro.showToast({ title: t('imageSelectFailed'), icon: 'none' })
      }
    })
  }

  // 选择/取消选择图片
  const handleToggleImageSelection = (imageId: string) => {
    setSelectedImageId(prev => prev === imageId ? null : imageId)
  }

  // 删除上传的图片
  const handleDeleteUploadedImage = (e: any, imageId: string) => {
    e.stopPropagation()
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
    if (selectedImageId === imageId) {
      setSelectedImageId(null)
    }
  }

  // 生成图片
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Taro.showToast({
        title: '请输入提示词',
        icon: 'none'
      })
      return
    }

    if (!hasApiKey()) {
      Taro.showModal({
        title: '提示',
        content: '请先配置 API Key',
        confirmText: '去配置',
        success: (res) => {
          if (res.confirm) {
            goToSettings()
          }
        }
      })
      return
    }

    // 检查历史图片数量是否已满
    if (historyImages.length >= MAX_HISTORY_IMAGES) {
      Taro.showModal({
        title: t('historyFull'),
        content: t('historyFullMessage'),
        showCancel: false,
        confirmText: t('confirm')
      })
      return
    }

    setIsGenerating(true)
    setShowFullscreen(true) // 生成时就显示全屏遮罩
    setError('')
    setGeneratedImage('')

    const options: GenerateOptions = {
      aspectRatio: getAspectRatio()
    }

    // 获取选中的图片
    let selectedImage: HistoryImage | undefined
    if (selectedImageId) {
      // 先从上传的图片中查找
      selectedImage = uploadedImages.find(img => img.id === selectedImageId)
      // 如果没找到，从历史图片中查找
      if (!selectedImage) {
        selectedImage = historyImages.find(img => img.id === selectedImageId)
      }
    }

    // 如果有选中的图片，提取base64和MIME类型
    if (selectedImage) {
      const parsed = parseDataUrl(selectedImage.url)
      if (parsed) {
        options.baseImage = parsed.data
        options.baseImageMimeType = parsed.mimeType
      }
    }
    // 向后兼容：如果有旧的基础图片状态，也使用
    else if (baseImage && baseImageMimeType) {
      options.baseImage = baseImage
      options.baseImageMimeType = baseImageMimeType
    }

    // 调用非流式 API（文生图不支持流式输出）
    try {
      await generateImage(prompt, {
        onStart: () => {
          console.log('开始生成...')
        },
        onComplete: (imageUrl) => {
          setGeneratedImage(imageUrl)
          setIsGenerating(false)
          // 生成完成后自动添加到历史
          const newImage = addImageToHistory(imageUrl)
          setHistoryImages(prev => [newImage, ...prev].slice(0, MAX_HISTORY_IMAGES))
          // 清除选择状态和基础图片
          setSelectedImageId(null)
          setBaseImage('')
          setBaseImageMimeType('')
        },
        onError: (err) => {
          setError(err)
          setIsGenerating(false)
          setShowFullscreen(false) // 错误时关闭遮罩
        }
      }, options)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setIsGenerating(false)
    }
  }

  // 使用示例提示词
  const handleUseExample = (example: string) => {
    setPrompt(example)
  }

  // 保存图片
  const handleSave = (imageUrl: string) => {
    if (!imageUrl) return

    if (process.env.TARO_ENV === 'h5') {
      try {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `${getStyleName()}_${Date.now()}.png`
        link.click()
        Taro.showToast({
          title: '已下载！',
          icon: 'success'
        })
      } catch {
        Taro.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    } else {
      // 小程序环境
      // 检查是否是 base64 data URL
      const parsed = parseDataUrl(imageUrl)
      if (parsed) {
        // 是 base64 数据，需要先写入临时文件
        const fs = Taro.getFileSystemManager()
        const filePath = `${Taro.env.USER_DATA_PATH}/temp_${Date.now()}.png`
        
        try {
          // 写入临时文件
          fs.writeFileSync(filePath, parsed.data, 'base64')
          
          // 保存到相册
          Taro.saveImageToPhotosAlbum({
            filePath: filePath,
            success: () => {
              // 保存成功后删除临时文件
              try {
                fs.unlinkSync(filePath)
              } catch (e) {
                console.warn('Failed to delete temp file:', e)
              }
              Taro.showToast({
                title: '保存成功！',
                icon: 'success'
              })
            },
            fail: (err) => {
              // 保存失败也删除临时文件
              try {
                fs.unlinkSync(filePath)
              } catch (e) {
                console.warn('Failed to delete temp file:', e)
              }
              console.error('Save to album failed:', err)
              Taro.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        } catch (e) {
          console.error('Write temp file failed:', e)
          Taro.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      } else {
        // 不是 base64，直接保存
        Taro.saveImageToPhotosAlbum({
          filePath: imageUrl,
          success: () => {
            Taro.showToast({
              title: '保存成功！',
              icon: 'success'
            })
          },
          fail: () => {
            Taro.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      }
    }
  }

  return (
    <View className='container'>
      {/* 头部标题 */}
      <View className='header'>
        <Text className='title'>✨ AI {getStyleName()}生成器</Text>
        <Text className='subtitle'>为宝贝生成精美的{getStyleName()}</Text>
        <View className='settings-btn' onClick={goToSettings}>
          <Text className='settings-icon'>⚙️</Text>
        </View>
      </View>

      {/* API Key 提示 */}
      {!hasKey && (
        <View className='api-tip' onClick={goToSettings}>
          <Text className='tip-text'>⚠️ 请先配置 API Key 才能使用</Text>
        </View>
      )}

      {/* 输入区域 */}
      <View className='input-section'>
        <Text className='section-title'>📝 {t('inputPromptTitle')}</Text>
        <View className='input-wrapper'>
          <Textarea
            className='prompt-input-with-upload'
            placeholder={selectedImageId ? t('modifyPromptPlaceholder') : t('inputPromptPlaceholder')}
            value={prompt}
            onInput={(e) => setPrompt(e.detail.value)}
            maxlength={200}
            disabled={isGenerating}
          />
          <View 
            className={`upload-icon-btn ${selectedImageId ? 'highlighted' : ''}`}
            onClick={handleUploadImage}
          >
            {isUploading ? (
              <Text className='upload-icon'>⏳</Text>
            ) : (
              <Text className='upload-icon'>📎</Text>
            )}
          </View>
        </View>
        <View className='char-count'>
          <Text>{prompt.length}/200</Text>
        </View>
      </View>

      {/* 示例提示词 */}
      <View className='examples-section'>
        <Text className='section-title'>💡 试试这些主题</Text>
        <View className='examples'>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <View
              key={index}
              className='example-tag'
              onClick={() => handleUseExample(example)}
            >
              <Text>{example}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 生成按钮 */}
      <Button
        className={`generate-btn ${isGenerating ? 'loading' : ''} ${historyImages.length >= MAX_HISTORY_IMAGES ? 'disabled' : ''}`}
        onClick={handleGenerate}
        disabled={isGenerating || historyImages.length >= MAX_HISTORY_IMAGES}
      >
        {historyImages.length >= MAX_HISTORY_IMAGES 
          ? '📸 历史已满，请先删除' 
          : (isGenerating ? '🎨 正在生成中...' : `🚀 生成${getStyleName()}`)}
      </Button>

      {/* 错误提示 */}
      {error && (
        <View className='error-section'>
          <Text className='error-text'>❌ {error}</Text>
        </View>
      )}

      {/* 历史图片区域 - 合并上传和历史 */}
      {(historyImages.length > 0 || uploadedImages.length > 0) && (
        <View className='history-section'>
          <Text className='section-title'>📸 {t('historyImagesTitle')}</Text>
          <View className='history-list'>
            {/* 显示上传的图片 */}
            {uploadedImages.map((img) => (
              <View 
                key={img.id} 
                className={`history-item ${selectedImageId === img.id ? 'selected' : ''}`}
                onClick={() => handleToggleImageSelection(img.id)}
              >
                <Image
                  className='history-thumbnail'
                  src={img.url}
                  mode='aspectFill'
                  onClick={(e) => { e.stopPropagation(); setPreviewHistoryImage(img.url); }}
                />
                {/* Left selection indicator */}
                <View 
                  className='history-select-left'
                  onClick={(e) => { e.stopPropagation(); handleToggleImageSelection(img.id); }}
                >
                  <Text>{selectedImageId === img.id ? '✓' : '○'}</Text>
                </View>
                {/* Right delete button */}
                <View className='history-actions'>
                  <View 
                    className='history-delete'
                    onClick={(e) => handleDeleteUploadedImage(e, img.id)}
                  >
                    <Text>×</Text>
                  </View>
                </View>
              </View>
            ))}
            {/* 显示历史图片 */}
            {historyImages.map((img) => (
              <View 
                key={img.id} 
                className={`history-item ${selectedImageId === img.id ? 'selected' : ''}`}
                onClick={() => handleToggleImageSelection(img.id)}
              >
                <Image
                  className='history-thumbnail'
                  src={img.url}
                  mode='aspectFill'
                  onClick={(e) => { e.stopPropagation(); setPreviewHistoryImage(img.url); }}
                />
                {/* Left selection indicator */}
                <View 
                  className='history-select-left'
                  onClick={(e) => { e.stopPropagation(); handleToggleImageSelection(img.id); }}
                >
                  <Text>{selectedImageId === img.id ? '✓' : '○'}</Text>
                </View>
                {/* Right delete button */}
                <View className='history-actions'>
                  <View 
                    className='history-delete'
                    onClick={(e) => handleDeleteHistory(e, img.id)}
                  >
                    <Text>×</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 全屏预览/生成中遮罩 */}
      {showFullscreen && (
        <View className='fullscreen-overlay' onClick={generatedImage ? closeFullscreen : undefined}>
          {/* 关闭按钮 - 只在生成完成后显示 */}
          {generatedImage && (
            <View 
              className='fullscreen-close' 
              onClick={(e) => { e.stopPropagation(); closeFullscreen(); }}
            >
              <Text>×</Text>
            </View>
          )}
          
          {/* 生成中的加载状态 */}
          {isGenerating && !generatedImage && (
            <View className='fullscreen-loading' onClick={(e) => e.stopPropagation()}>
              <View className='loading-spinner-large' />
              <Text className='loading-text-large'>🎨 AI 正在为宝贝创作{getStyleName()}...</Text>
              <Text className='loading-hint'>请稍候，生成完成后将自动显示</Text>
            </View>
          )}
          
          {/* 生成完成后显示图片 */}
          {generatedImage && (
            <>
              <View className='fullscreen-content' onClick={(e) => e.stopPropagation()}>
                <Image
                  className='fullscreen-image'
                  src={generatedImage}
                  mode='aspectFit'
                  showMenuByLongpress
                />
              </View>
              <View className='fullscreen-actions' onClick={(e) => e.stopPropagation()}>
                <Button className='save-btn-fullscreen' onClick={() => handleSave(generatedImage)}>
                  💾 保存图片
                </Button>
              </View>
            </>
          )}
        </View>
      )}

      {/* 历史图片预览 */}
      {previewHistoryImage && (
        <View className='fullscreen-overlay' onClick={() => setPreviewHistoryImage(null)}>
          <View 
            className='fullscreen-close' 
            onClick={(e) => { e.stopPropagation(); setPreviewHistoryImage(null); }}
          >
            <Text>×</Text>
          </View>
          <View className='fullscreen-content' onClick={(e) => e.stopPropagation()}>
            <Image
              className='fullscreen-image'
              src={previewHistoryImage}
              mode='aspectFit'
              showMenuByLongpress
            />
          </View>
          <View className='fullscreen-actions' onClick={(e) => e.stopPropagation()}>
            <Button className='save-btn-fullscreen' onClick={() => handleSave(previewHistoryImage)}>
              💾 保存图片
            </Button>
          </View>
        </View>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <View className='login-modal-overlay' onClick={() => {/* 防止点击背景关闭 */}}>
          <View className='login-modal' onClick={(e) => e.stopPropagation()}>
            <View className='login-header'>
              <Text className='login-title'>📱 欢迎使用</Text>
              <Text className='login-subtitle'>请输入手机号登录/注册</Text>
            </View>
            
            <View className='login-body'>
              <View className='login-input-group'>
                <Text className='login-label'>手机号</Text>
                <Input
                  className='login-input'
                  type='number'
                  placeholder='请输入手机号'
                  maxlength={11}
                  value={phoneNumber}
                  onInput={(e) => setPhoneNumber(e.detail.value)}
                  disabled={isRegistering}
                />
              </View>

              {/* 微信小程序快捷登录按钮 */}
              {process.env.TARO_ENV === 'weapp' && (
                <Button 
                  className='wechat-phone-btn'
                  openType='getPhoneNumber'
                  onGetPhoneNumber={handleGetWeChatPhone}
                  disabled={isRegistering}
                >
                  📱 微信快捷登录
                </Button>
              )}

              <Button 
                className='login-submit-btn'
                onClick={handlePhoneLogin}
                disabled={isRegistering || !phoneNumber.trim()}
                loading={isRegistering}
              >
                {isRegistering ? '登录中...' : '登录/注册'}
              </Button>

              <View className='login-tip'>
                <Text className='tip-text'>首次登录将自动注册账号</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 底部说明 */}
      <View className='footer'>
        <Text className='footer-text'>
          Powered by Gemini 3 Pro | 专为幼儿园妈妈设计 ❤️
        </Text>
      </View>
    </View>
  )
}
