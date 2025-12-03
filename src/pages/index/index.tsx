import { useState, useRef, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { View, Canvas, Text } from '@tarojs/components'
import type { ITouchEvent } from '@tarojs/components'
import './index.scss'

// 预设颜色列表
const COLORS = [
  '#000000', // 黑色
  '#FF0000', // 红色
  '#FF9800', // 橙色
  '#FFEB3B', // 黄色
  '#4CAF50', // 绿色
  '#2196F3', // 蓝色
  '#9C27B0', // 紫色
  '#795548', // 棕色
  '#FFFFFF', // 白色（橡皮擦效果）
]

// 画笔大小选项
const BRUSH_SIZES = [4, 8, 12, 20, 30]

// 画布最大尺寸（用于初始化填充背景）
const MAX_CANVAS_SIZE = 10000

interface Point {
  x: number
  y: number
}

export default function Index() {
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(8)
  const [isEraser, setIsEraser] = useState(false)
  const [showSizePanel, setShowSizePanel] = useState(false)
  
  const canvasContext = useRef<Taro.CanvasContext | null>(null)
  const lastPoint = useRef<Point | null>(null)
  const isDrawing = useRef(false)

  // 初始化画布
  const initCanvas = useCallback(() => {
    const ctx = Taro.createCanvasContext('drawCanvas')
    canvasContext.current = ctx
    
    // 设置白色背景（使用足够大的尺寸覆盖整个画布）
    ctx.setFillStyle('#FFFFFF')
    ctx.fillRect(0, 0, MAX_CANVAS_SIZE, MAX_CANVAS_SIZE)
    ctx.draw()
  }, [])

  // 页面加载时初始化画布
  Taro.useReady(() => {
    initCanvas()
  })

  // 获取触摸点坐标
  const getTouchPoint = (e: ITouchEvent): Point => {
    const touch = e.touches[0] || e.changedTouches[0]
    return {
      x: touch.x,
      y: touch.y
    }
  }

  // 开始绘制
  const handleTouchStart = (e: ITouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const point = getTouchPoint(e)
    lastPoint.current = point
    isDrawing.current = true

    const ctx = canvasContext.current
    if (!ctx) return

    ctx.beginPath()
    ctx.setStrokeStyle(isEraser ? '#FFFFFF' : currentColor)
    ctx.setLineWidth(brushSize)
    ctx.setLineCap('round')
    ctx.setLineJoin('round')
    ctx.moveTo(point.x, point.y)
    
    // 绘制一个点
    ctx.lineTo(point.x + 0.1, point.y + 0.1)
    ctx.stroke()
    ctx.draw(true)
  }

  // 绘制中
  const handleTouchMove = (e: ITouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isDrawing.current || !lastPoint.current) return

    const point = getTouchPoint(e)
    const ctx = canvasContext.current
    if (!ctx) return

    ctx.beginPath()
    ctx.setStrokeStyle(isEraser ? '#FFFFFF' : currentColor)
    ctx.setLineWidth(brushSize)
    ctx.setLineCap('round')
    ctx.setLineJoin('round')
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    ctx.draw(true)

    lastPoint.current = point
  }

  // 结束绘制
  const handleTouchEnd = () => {
    isDrawing.current = false
    lastPoint.current = null
  }

  // 清空画布
  const handleClear = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要清空画布吗？',
      success: (res) => {
        if (res.confirm) {
          initCanvas()
        }
      }
    })
  }

  // 保存图片
  const handleSave = () => {
    Taro.canvasToTempFilePath({
      canvasId: 'drawCanvas',
      success: (res) => {
        Taro.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            Taro.showToast({
              title: '保存成功！',
              icon: 'success'
            })
          },
          fail: (err) => {
            // H5 环境下无法直接保存到相册，提供下载
            if (process.env.TARO_ENV === 'h5') {
              try {
                // 在 H5 中创建下载链接
                const link = document.createElement('a')
                link.href = res.tempFilePath
                link.download = `drawing_${Date.now()}.png`
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
              Taro.showToast({
                title: '保存失败',
                icon: 'none'
              })
              console.error('Save failed:', err)
            }
          }
        })
      },
      fail: (err) => {
        Taro.showToast({
          title: '生成图片失败',
          icon: 'none'
        })
        console.error('Canvas to temp file failed:', err)
      }
    })
  }

  // 选择颜色
  const handleColorSelect = (color: string) => {
    setCurrentColor(color)
    setIsEraser(false)
  }

  // 切换橡皮擦
  const toggleEraser = () => {
    setIsEraser(!isEraser)
  }

  // 选择画笔大小
  const handleSizeSelect = (size: number) => {
    setBrushSize(size)
    setShowSizePanel(false)
  }

  return (
    <View className="container">
      {/* 画布区域 */}
      <View className="canvas-wrapper">
        <Canvas
          canvasId="drawCanvas"
          className="draw-canvas"
          disableScroll
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />
      </View>

      {/* 工具栏 */}
      <View className="toolbar">
        {/* 颜色选择器 */}
        <View className="color-picker">
          {COLORS.map((color) => (
            <View
              key={color}
              className={`color-item ${currentColor === color && !isEraser ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </View>

        {/* 工具按钮 */}
        <View className="tool-buttons">
          {/* 画笔大小 */}
          <View className="tool-group">
            <View 
              className="tool-btn size-btn"
              onClick={() => setShowSizePanel(!showSizePanel)}
            >
              <View 
                className="size-preview"
                style={{ 
                  width: `${Math.min(brushSize, 24)}px`, 
                  height: `${Math.min(brushSize, 24)}px`,
                  backgroundColor: isEraser ? '#999' : currentColor
                }}
              />
            </View>
            
            {/* 大小选择面板 */}
            {showSizePanel && (
              <View className="size-panel">
                {BRUSH_SIZES.map((size) => (
                  <View
                    key={size}
                    className={`size-option ${brushSize === size ? 'active' : ''}`}
                    onClick={() => handleSizeSelect(size)}
                  >
                    <View 
                      className="size-dot"
                      style={{ 
                        width: `${Math.min(size, 24)}px`, 
                        height: `${Math.min(size, 24)}px` 
                      }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 橡皮擦 */}
          <View 
            className={`tool-btn ${isEraser ? 'active' : ''}`}
            onClick={toggleEraser}
          >
            <Text className="btn-text">橡皮</Text>
          </View>

          {/* 清空 */}
          <View className="tool-btn danger" onClick={handleClear}>
            <Text className="btn-text">清空</Text>
          </View>

          {/* 保存 */}
          <View className="tool-btn primary" onClick={handleSave}>
            <Text className="btn-text">保存</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
