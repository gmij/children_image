import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Textarea, Input, Button } from '@tarojs/components'
import { 
  getApiKey, setApiKey, 
  getPaperSizeIndex, setPaperSizeIndex, 
  getPaperOrientation, setPaperOrientation,
  getImageStyle, setImageStyle,
  getSignature, setSignature
} from '../../services/api'
import { useTranslation } from '../../utils/i18n'
import './index.scss'

// 纸张尺寸选项
const PAPER_SIZES = [
  { name: 'A4', portrait: '2:3', landscape: '3:2' },
  { name: 'A3', portrait: '2:3', landscape: '3:2' },
  { name: '1:1', portrait: '1:1', landscape: '1:1' },
  { name: '16:9', portrait: '9:16', landscape: '16:9' },
  { name: '4:3', portrait: '3:4', landscape: '4:3' },
]

// 风格选项
const STYLE_OPTIONS = [
  { id: 'handwritten', name: '手抄报', prompt: '手抄报风格，手绘感，彩色边框装饰' },
  { id: 'wireframe', name: '线框图', prompt: '线框图风格，简洁线条，黑白为主' },
  { id: 'blackboard', name: '黑板报', prompt: '黑板报风格，深色背景，粉笔画效果' },
  { id: 'anime', name: '动漫', prompt: '动漫风格，日系动画，可爱卡通人物' },
  { id: 'custom', name: '自定义', prompt: '' },
]

export default function Settings() {
  const { t } = useTranslation()
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0)
  const [isLandscape, setIsLandscape] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('handwritten')
  const [signatureValue, setSignatureValue] = useState('')

  useEffect(() => {
    const savedKey = getApiKey()
    if (savedKey) {
      setApiKeyValue(savedKey)
    }
    setSelectedPaperIndex(getPaperSizeIndex())
    setIsLandscape(getPaperOrientation())
    setSelectedStyle(getImageStyle())
    setSignatureValue(getSignature())
  }, [])

  const handleInput = useCallback((e) => {
    setApiKeyValue(e.detail.value)
  }, [])

  const handleSave = () => {
    if (!apiKeyValue.trim()) {
      Taro.showToast({ title: '请输入 API Key', icon: 'none' })
      return
    }
    setApiKey(apiKeyValue.trim())
    setIsEditing(false)
    Taro.showToast({ title: '已保存', icon: 'success' })
  }

  const handleClear = () => {
    Taro.showModal({
      title: '确认清除',
      content: '确定要清除 API Key 吗？',
      success: (res) => {
        if (res.confirm) {
          setApiKey('')
          setApiKeyValue('')
          setIsEditing(true)
          Taro.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          setApiKey('')
          setApiKeyValue('')
          Taro.showToast({ 
            title: '已退出', 
            icon: 'success',
            duration: 1500,
            success: () => {
              // 延迟跳转以显示提示
              setTimeout(() => {
                Taro.reLaunch({ url: '/pages/index/index' })
              }, 1500)
            }
          })
        }
      }
    })
  }

  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  const handlePaperSizeChange = (index: number) => {
    setSelectedPaperIndex(index)
    setPaperSizeIndex(index)
  }

  const handleOrientationChange = (landscape: boolean) => {
    setIsLandscape(landscape)
    setPaperOrientation(landscape)
  }

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId)
    setImageStyle(styleId)
  }

  const handleSignatureInput = useCallback((e) => {
    const value = e.detail.value
    setSignatureValue(value)
    setSignature(value)
  }, [])

  const getAspectRatio = (): string => {
    const paper = PAPER_SIZES[selectedPaperIndex]
    return isLandscape ? paper.landscape : paper.portrait
  }

  const hasKey = apiKeyValue && apiKeyValue.length > 0

  const openRegister = () => {
    const url = 'https://fangzhou.wanjiedata.com/login?inviteCode=xO9h1BTA'
    if (process.env.TARO_ENV === 'h5') {
      window.open(url, '_blank')
    } else {
      Taro.setClipboardData({
        data: url,
        success: () => {
          Taro.showToast({ title: '链接已复制', icon: 'none', duration: 2000 })
        }
      })
    }
  }

  return (
    <View className='settings-page'>
      {/* API Key 区域 */}
      <View className='card api-card'>
        <View className='card-header'>
          <Text className='card-title'>🔐 API Key</Text>
          {hasKey && !isEditing && (
            <Text className='status-tag success'>✓ 已配置</Text>
          )}
        </View>
        
        {hasKey && !isEditing ? (
          <View className='api-configured'>
            <View className='api-actions'>
              <View className='action-btn primary' onClick={() => setIsEditing(true)}>
                <Text>修改</Text>
              </View>
              <View className='action-btn danger' onClick={handleLogout}>
                <Text>退出登录</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className='api-input-area'>
            <Textarea
              className='api-input'
              placeholder={t('apiKeyPlaceholder')}
              value={apiKeyValue}
              onInput={handleInput}
              maxlength={-1}
              autoHeight
            />
            <View className='api-actions'>
              <Button className='save-btn' onClick={handleSave}>{t('saveSettings')}</Button>
              {isEditing && hasKey && (
                <>
                  <View className='action-btn danger' onClick={handleClear}>
                    <Text>清除</Text>
                  </View>
                  <View className='action-btn' onClick={() => setIsEditing(false)}>
                    <Text>取消</Text>
                  </View>
                </>
              )}
            </View>
            {/* 新用户注册提示 */}
            {!hasKey && (
              <View className='register-tip' onClick={goToRegister}>
                <Text className='tip-text'>🎁 {t('newUserRegister')}</Text>
                <Text className='tip-arrow'>→</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 图片设置 - 紧凑布局 */}
      <View className='card'>
        <Text className='card-title'>📐 图片设置</Text>
        
        {/* 风格选择 */}
        <View className='setting-row'>
          <Text className='row-label'>风格</Text>
          <View className='style-options'>
            {STYLE_OPTIONS.map((style) => (
              <View
                key={style.id}
                className={`style-chip ${selectedStyle === style.id ? 'active' : ''}`}
                onClick={() => handleStyleChange(style.id)}
              >
                <Text>{style.name}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* 尺寸选择 - 横向排列 */}
        <View className='setting-row'>
          <Text className='row-label'>尺寸</Text>
          <View className='size-options'>
            {PAPER_SIZES.map((size, index) => (
              <View
                key={index}
                className={`size-chip ${selectedPaperIndex === index ? 'active' : ''}`}
                onClick={() => handlePaperSizeChange(index)}
              >
                <Text>{size.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 方向选择 */}
        <View className='setting-row'>
          <Text className='row-label'>方向</Text>
          <View className='orientation-options'>
            <View
              className={`orient-chip ${!isLandscape ? 'active' : ''}`}
              onClick={() => handleOrientationChange(false)}
            >
              <Text>竖版</Text>
            </View>
            <View
              className={`orient-chip ${isLandscape ? 'active' : ''}`}
              onClick={() => handleOrientationChange(true)}
            >
              <Text>横版</Text>
            </View>
          </View>
          <Text className='ratio-text'>{getAspectRatio()}</Text>
        </View>

        {/* 个性签名 */}
        <View className='setting-row signature-row'>
          <Text className='row-label'>签名</Text>
          <Input
            className='signature-input'
            placeholder='输入昵称，将显示在图片右下角'
            value={signatureValue}
            onInput={handleSignatureInput}
            maxlength={20}
          />
        </View>
        {signatureValue && (
          <View className='signature-preview'>
            <Text className='preview-text'>签名预览: {signatureValue} @Gemini 3</Text>
          </View>
        )}
      </View>

      {/* 底部说明 - 简化 */}
      <View className='footer-info'>
        <Text className='footer-text'>API Key 仅保存在本地 · 模型: gemini-3-pro</Text>
      </View>
    </View>
  )
}
