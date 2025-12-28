import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Textarea, Image, Button } from '@tarojs/components'
import { generateImage, hasApiKey } from '../../services/api'
import { useTranslation } from '../../utils/i18n'
import './index.scss'

export default function Index() {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [error, setError] = useState('')
  const [hasKey, setHasKey] = useState(false)

  // 示例提示词
  const EXAMPLE_PROMPTS = [
    t('exampleSpring'),
    t('exampleHome'),
    t('exampleAnimals'),
    t('exampleEarth'),
    t('exampleFestival'),
  ]

  // 检查 API Key 配置状态
  useEffect(() => {
    setHasKey(hasApiKey())
  }, [])

  // 页面显示时重新检查 API Key（处理从设置页返回或注册后返回的情况）
  useDidShow(() => {
    setHasKey(hasApiKey())
  })

  // 跳转到设置页面
  const goToSettings = () => {
    Taro.navigateTo({ url: '/pages/settings/index' })
  }

  // 生成图片
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Taro.showToast({
        title: t('pleaseInputPrompt'),
        icon: 'none'
      })
      return
    }

    if (!hasApiKey()) {
      Taro.showModal({
        title: t('tip'),
        content: t('pleaseConfigApiKey'),
        confirmText: t('goToConfig'),
        success: (res) => {
          if (res.confirm) {
            goToSettings()
          }
        }
      })
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedImage('')

    // 调用非流式 API（文生图不支持流式输出）
    try {
      await generateImage(prompt, {
        onStart: () => {
          console.log('开始生成...')
        },
        onComplete: (imageUrl) => {
          setGeneratedImage(imageUrl)
          setIsGenerating(false)
          Taro.showToast({
            title: t('generateSuccess'),
            icon: 'success'
          })
        },
        onError: (err) => {
          setError(err)
          setIsGenerating(false)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveFailed'))
      setIsGenerating(false)
    }
  }

  // 使用示例提示词
  const selectExample = (example: string) => {
    setPrompt(example)
  }

  // 保存图片
  const handleSave = () => {
    if (!generatedImage) return

    if (process.env.TARO_ENV === 'h5') {
      try {
        const link = document.createElement('a')
        link.href = generatedImage
        link.download = `handwritten_newspaper_${Date.now()}.png`
        link.click()
        Taro.showToast({
          title: t('saved'),
          icon: 'success'
        })
      } catch {
        Taro.showToast({
          title: t('saveFailed'),
          icon: 'none'
        })
      }
    } else {
      // 小程序环境
      Taro.saveImageToPhotosAlbum({
        filePath: generatedImage,
        success: () => {
          Taro.showToast({
            title: t('saved'),
            icon: 'success'
          })
        },
        fail: () => {
          Taro.showToast({
            title: t('saveFailed'),
            icon: 'none'
          })
        }
      })
    }
  }

  return (
    <View className='container'>
      {/* 头部标题 */}
      <View className='header'>
        <Text className='title'>✨ {t('appTitle')}</Text>
        <Text className='subtitle'>{t('appSubtitle')}</Text>
        <View className='settings-btn' onClick={goToSettings}>
          <Text className='settings-icon'>⚙️</Text>
        </View>
      </View>

      {/* API Key 提示 */}
      {!hasKey && (
        <View className='api-tip' onClick={goToSettings}>
          <Text className='tip-text'>⚠️ {t('apiKeyWarning')}</Text>
        </View>
      )}

      {/* 输入区域 */}
      <View className='input-section'>
        <Text className='section-title'>📝 {t('inputPromptTitle')}</Text>
        <Textarea
          className='prompt-input'
          placeholder={t('inputPromptPlaceholder')}
          value={prompt}
          onInput={(e) => setPrompt(e.detail.value)}
          maxlength={200}
          disabled={isGenerating}
        />
        <View className='char-count'>
          <Text>{prompt.length}/200</Text>
        </View>
      </View>

      {/* 示例提示词 */}
      <View className='examples-section'>
        <Text className='section-title'>💡 {t('examplesTitle')}</Text>
        <View className='examples'>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <View
              key={index}
              className='example-tag'
              onClick={() => selectExample(example)}
            >
              <Text>{example}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 生成按钮 */}
      <Button
        className={`generate-btn ${isGenerating ? 'loading' : ''}`}
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? `🎨 ${t('generating')}` : `🚀 ${t('generateButton')}`}
      </Button>

      {/* 加载状态 */}
      {isGenerating && (
        <View className='loading-section'>
          <View className='loading-spinner' />
          <Text className='loading-text'>{t('loadingText')}</Text>
        </View>
      )}

      {/* 错误提示 */}
      {error && (
        <View className='error-section'>
          <Text className='error-text'>{t('errorPrefix')}{error}</Text>
        </View>
      )}

      {/* 生成结果 */}
      {generatedImage && (
        <View className='result-section'>
          <Text className='section-title'>🎉 {t('resultTitle')}</Text>
          <View className='image-wrapper'>
            <Image
              className='generated-image'
              src={generatedImage}
              mode='widthFix'
              showMenuByLongpress
            />
          </View>
          <Button className='save-btn' onClick={handleSave}>
            💾 {t('saveButton')}
          </Button>
        </View>
      )}

      {/* 底部说明 */}
      <View className='footer'>
        <Text className='footer-text'>
          {t('footerText')}
        </Text>
      </View>
    </View>
  )
}
