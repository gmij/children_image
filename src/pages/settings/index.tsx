import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Button } from '@tarojs/components'
import { getApiKey, setApiKey } from '../../services/api'
import './index.scss'

export default function Settings() {
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const savedKey = getApiKey()
    if (savedKey) {
      setApiKeyValue(savedKey)
    }
  }, [])

  const handleSave = () => {
    if (!apiKeyValue.trim()) {
      Taro.showToast({
        title: '请输入 API Key',
        icon: 'none'
      })
      return
    }

    setApiKey(apiKeyValue.trim())
    Taro.showToast({
      title: '保存成功！',
      icon: 'success'
    })

    // 延迟返回
    setTimeout(() => {
      Taro.navigateBack()
    }, 1500)
  }

  const handleClear = () => {
    Taro.showModal({
      title: '确认清除',
      content: '确定要清除 API Key 吗？',
      success: (res) => {
        if (res.confirm) {
          setApiKey('')
          setApiKeyValue('')
          Taro.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  }

  const toggleShowKey = () => {
    setShowKey(!showKey)
  }

  // 安全地遮罩 API Key，处理各种长度情况
  const getMaskedKey = (key: string): string => {
    if (!key) return ''
    const len = key.length
    if (len <= 4) {
      return '*'.repeat(len)
    } else if (len <= 8) {
      return key.slice(0, 2) + '*'.repeat(len - 2)
    } else if (len <= 12) {
      return key.slice(0, 4) + '*'.repeat(len - 4)
    } else {
      return key.slice(0, 8) + '*'.repeat(len - 12) + key.slice(-4)
    }
  }

  const maskedKey = getMaskedKey(apiKeyValue)

  return (
    <View className="settings-container">
      <View className="settings-header">
        <Text className="settings-title">🔐 API 配置</Text>
        <Text className="settings-desc">
          配置万界方舟 API Key 以使用 Gemini 3 Pro 图像生成服务
        </Text>
      </View>

      <View className="settings-section">
        <View className="section-header">
          <Text className="section-title">API Key</Text>
          <View className="toggle-visibility" onClick={toggleShowKey}>
            <Text>{showKey ? '🙈 隐藏' : '👁️ 显示'}</Text>
          </View>
        </View>

        <View className="input-wrapper">
          <Input
            className="api-input"
            type={showKey ? 'text' : 'safe-password'}
            placeholder="请输入您的 API Key"
            value={showKey ? apiKeyValue : maskedKey}
            onInput={(e) => setApiKeyValue(e.detail.value)}
            password={!showKey}
          />
        </View>

        <View className="button-group">
          <Button className="save-btn" onClick={handleSave}>
            💾 保存设置
          </Button>
          {apiKeyValue && (
            <Button className="clear-btn" onClick={handleClear}>
              🗑️ 清除
            </Button>
          )}
        </View>
      </View>

      <View className="help-section">
        <Text className="help-title">📖 如何获取 API Key？</Text>
        <View className="help-steps">
          <Text className="help-step">1. 访问 万界方舟 平台</Text>
          <Text className="help-step">2. 注册并登录账号</Text>
          <Text className="help-step">3. 进入「个人中心」</Text>
          <Text className="help-step">4. 复制您的 API Key</Text>
        </View>
        <View className="help-link">
          <Text className="link-text">🔗 https://fangzhou.wanjiedata.com/login?inviteCode=xO9h1BTA</Text>
        </View>
      </View>

      <View className="info-section">
        <Text className="info-title">ℹ️ 说明</Text>
        <Text className="info-text">
          • API Key 仅保存在您的设备本地{'\n'}
          • 请妥善保管，不要泄露给他人{'\n'}
          • 使用的模型：gemini-3-pro-image-preview
        </Text>
      </View>
    </View>
  )
}
