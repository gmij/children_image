import { useState, useEffect, useMemo, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Textarea, Button, Input } from '@tarojs/components'
import { getApiKey, setApiKey, registerUser, getUserKey } from '../../services/api'
import { useTranslation } from '../../utils/i18n'
import './index.scss'

export default function Settings() {
  const { t } = useTranslation()
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [phone, setPhone] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false) // Track if we should show manual API key entry

  useEffect(() => {
    const savedKey = getApiKey()
    if (savedKey) {
      setApiKeyValue(savedKey)
      // If user already has an API key, show manual entry section
      setShowManualEntry(true)
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

  // 处理手机号注册/登录
  const handlePhoneRegister = async () => {
    if (!phone.trim()) {
      Taro.showToast({
        title: t('pleaseInputPhone'),
        icon: 'none'
      })
      return
    }

    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone.trim())) {
      Taro.showToast({
        title: t('pleaseInputValidPhone'),
        icon: 'none'
      })
      return
    }

    setIsRegistering(true)
    setErrorMessage('')

    try {
      // 先尝试注册
      const registerResponse = await registerUser(phone.trim())
      
      if (registerResponse.success && registerResponse.result?.apiKey) {
        // 注册成功，保存 API Key
        setApiKey(registerResponse.result.apiKey)
        setApiKeyValue(registerResponse.result.apiKey)
        Taro.showToast({
          title: t('registerSuccess'),
          icon: 'success',
          duration: 2000
        })
        
        // 延迟返回
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
        return
      }

      // 如果注册失败，检查错误信息
      if (!registerResponse.success) {
        // 检查是否是"用户在其他渠道已存在"的错误
        if (registerResponse.message && (registerResponse.message.includes('其他渠道') || registerResponse.message.includes('其它渠道') || registerResponse.message.includes('别的渠道') || registerResponse.message.includes('已经存在'))) {
          setErrorMessage(registerResponse.message)
          setShowManualEntry(true) // Show manual API key entry section
          Taro.showModal({
            title: t('tip'),
            content: t('otherChannelWarning'),
            showCancel: false
          })
          return
        }
        
        // 其他错误，尝试用 getUserKey 查询（可能是已注册用户）
        try {
          const getUserResponse = await getUserKey(phone.trim())
          
          if (getUserResponse.success && getUserResponse.result?.apiKey) {
            // 查询成功，保存 API Key
            setApiKey(getUserResponse.result.apiKey)
            setApiKeyValue(getUserResponse.result.apiKey)
            Taro.showToast({
              title: t('loginSuccess'),
              icon: 'success',
              duration: 2000
            })
            
            setTimeout(() => {
              Taro.navigateBack()
            }, 2000)
            return
          } else {
            // getUserKey 也失败，显示错误信息
            setErrorMessage(getUserResponse.message || registerResponse.message || t('saveFailed'))
          }
        } catch (getUserError) {
          // getUserKey 请求失败，显示原始注册错误
          setErrorMessage(registerResponse.message || (getUserError instanceof Error ? getUserError.message : t('saveFailed')))
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('saveFailed'))
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <View className='settings-container'>
      <View className='settings-header'>
        <Text className='settings-title'>🔐 {t('settingsTitle')}</Text>
        <Text className='settings-desc'>
          {t('settingsDesc')}
        </Text>
      </View>

      {/* Phone Registration Section - Always show if no manual entry needed */}
      {!showManualEntry && (
        <View className='settings-section'>
          <Text className='section-title'>📱 {t('phoneLabel')}</Text>
          <Text className='section-desc'>{t('registerHelp1')}</Text>
          
          <View className='input-wrapper'>
            <Input
              className='phone-input'
              type='number'
              maxlength={11}
              placeholder={t('phonePlaceholder')}
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
              disabled={isRegistering}
            />
          </View>

          <Button 
            className={`register-btn ${isRegistering ? 'loading' : ''}`}
            onClick={handlePhoneRegister}
            disabled={isRegistering}
          >
            {isRegistering ? `⏳ ${t('processing')}` : `✨ ${t('registerButton')}`}
          </Button>

          {errorMessage && (
            <View className='error-message'>
              <Text className='error-text'>⚠️ {errorMessage}</Text>
            </View>
          )}
        </View>
      )}

      {/* Manual API Key Section - Only show after "other channel" error or if user already has a key */}
      {showManualEntry && (
        <View className='settings-section'>
          <View className='section-header'>
            <Text className='section-title'>{t('apiKeyLabel')}</Text>
            <View className='toggle-visibility' onClick={toggleShowKey}>
              <Text>{showKey ? `🙈 ${t('hideKey')}` : `👁️ ${t('showKey')}`}</Text>
            </View>
          </View>
          <Text className='section-desc'>{t('manualEntryDesc')}</Text>

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
              <Button className='logout-btn' onClick={handleClear}>
                🚪 {t('logoutButton')}
              </Button>
            )}
          </View>
        </View>
      )}

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
