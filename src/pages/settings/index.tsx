import { useState, useEffect, useMemo, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Textarea, Button } from '@tarojs/components'
import { getApiKey, setApiKey } from '../../services/api'
import { useTranslation } from '../../utils/i18n'
import './index.scss'

export default function Settings() {
  const { t } = useTranslation()
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    const savedKey = getApiKey()
    if (savedKey) {
      setApiKeyValue(savedKey)
    }
  }, [])

  // 显示的值：显示模式下显示真实值，隐藏模式下显示 mask
  const displayValue = useMemo(() => {
    return showKey ? apiKeyValue : '•'.repeat(apiKeyValue?.length || 0)
  }, [showKey, apiKeyValue])

  const handleInput = useCallback((e) => {
    // 只有在显示模式下才允许编辑
    if (showKey) {
      setApiKeyValue(e.detail.value)
    }
  }, [showKey])

  const handleSave = () => {
    if (!apiKeyValue.trim()) {
      Taro.showToast({
        title: t('pleaseInputApiKey'),
        icon: 'none'
      })
      return
    }

    setApiKey(apiKeyValue.trim())
    Taro.showToast({
      title: t('generateSuccess'),
      icon: 'success'
    })

    // 延迟返回
    setTimeout(() => {
      Taro.navigateBack()
    }, 1500)
  }

  const handleClear = () => {
    Taro.showModal({
      title: t('confirmClear'),
      content: t('confirmClearContent'),
      success: (res) => {
        if (res.confirm) {
          setApiKey('')
          setApiKeyValue('')
          Taro.showToast({
            title: t('cleared'),
            icon: 'success'
          })
        }
      }
    })
  }

  const toggleShowKey = () => {
    setShowKey(!showKey)
  }

  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className='settings-container'>
      <View className='settings-header'>
        <Text className='settings-title'>🔐 {t('settingsTitle')}</Text>
        <Text className='settings-desc'>
          {t('settingsDesc')}
        </Text>
      </View>

      <View className='settings-section'>
        <View className='section-header'>
          <Text className='section-title'>{t('apiKeyLabel')}</Text>
          <View className='toggle-visibility' onClick={toggleShowKey}>
            <Text>{showKey ? `🙈 ${t('hideKey')}` : `👁️ ${t('showKey')}`}</Text>
          </View>
        </View>

        <View className='input-wrapper'>
          <Textarea
            className='api-input'
            placeholder={t('apiKeyPlaceholder')}
            value={displayValue}
            onInput={handleInput}
            maxlength={-1}
            disabled={!showKey && (apiKeyValue?.length || 0) > 0}
          />
        </View>

        <View className='button-group'>
          <Button className='save-btn' onClick={handleSave}>
            💾 {t('saveSettings')}
          </Button>
          {apiKeyValue && (
            <Button className='clear-btn' onClick={handleClear}>
              🗑️ {t('clearButton')}
            </Button>
          )}
        </View>
      </View>

      <View className='help-section'>
        <Text className='help-title'>📖 {t('helpTitle')}</Text>
        <View className='help-steps'>
          <Text className='help-step'>{t('helpStep1')}</Text>
          <Text className='help-step'>{t('helpStep2')}</Text>
          <Text className='help-step'>{t('helpStep3')}</Text>
          <Text className='help-step'>{t('helpStep4')}</Text>
        </View>
        <View className='help-link'>
          <Text className='link-text'>🔗 https://fangzhou.wanjiedata.com/login?inviteCode=xO9h1BTA</Text>
        </View>
        <Button className='register-link-btn' onClick={goToRegister}>
          🆕 {t('newUserQuickRegister')}
        </Button>
      </View>

      <View className='info-section'>
        <Text className='info-title'>ℹ️ {t('infoTitle')}</Text>
        <Text className='info-text'>
          {t('infoText1')}{'\n'}
          {t('infoText2')}{'\n'}
          {t('infoText3')}
        </Text>
      </View>
    </View>
  )
}
