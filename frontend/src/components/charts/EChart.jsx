import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

export default function EChart({ option, style, className, loading = false }) {
  const chartRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表实例
    const chart = echarts.init(chartRef.current, null, {
      renderer: 'canvas'
    })
    instanceRef.current = chart

    if (option) {
      chart.setOption(option, true)
    }

    // 容器缩放自适应监听
    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })
    resizeObserver.observe(chartRef.current)

    const handleWindowResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
      resizeObserver.disconnect()
      chart.dispose()
      instanceRef.current = null
    }
  }, [])

  // 响应 option 变化
  useEffect(() => {
    if (instanceRef.current && option) {
      instanceRef.current.setOption(option, true)
    }
  }, [option])

  // 响应 loading 状态
  useEffect(() => {
    if (!instanceRef.current) return
    if (loading) {
      instanceRef.current.showLoading({
        text: '数据分析中...',
        color: '#38bdf8',
        textColor: '#94a3b8',
        maskColor: 'rgba(10, 15, 30, 0.6)'
      })
    } else {
      instanceRef.current.hideLoading()
    }
  }, [loading])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: '180px', ...style }}
    />
  )
}
