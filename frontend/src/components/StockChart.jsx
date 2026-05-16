import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

import {
  generateCandlestickData,
  generateVolumeData,
} from '../utils/chartData.js'

const TIMEFRAMES = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
]

function StatBadge({ label, value, color }) {
  return (
    <div className="flex flex-col items-end min-w-0">
      <span className="text-[clamp(8px,0.75vh,10px)] text-slate-600 uppercase tracking-wide truncate">
        {label}
      </span>

      <span
        className={`text-[clamp(10px,1vh,13px)] font-mono font-semibold truncate ${color}`}
      >
        {value}
      </span>
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="flex-1 flex flex-col gap-[1vh] p-[1.2vh]">
      <div className="skeleton h-[1.2vh] w-32" />
      <div className="skeleton h-[3vh] w-48" />
      <div className="flex-1 skeleton rounded-lg" />
    </div>
  )
}

export default function StockChart({
  symbol,
  isCollapsed,
  onToggleCollapse,
  isFullscreen,
  onToggleFullscreen,
}) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const resizeObserverRef = useRef(null)

  const [dayViews, setDayViews] = useState(90)
  const [timeframe, setTimeframe] = useState('3M')
  const [isLoading, setIsLoading] = useState(true)
  const [priceData, setPriceData] = useState(null)
  const [hoveredCandle, setHoveredCandle] = useState(null)
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false)

  const loadChart = useCallback(async () => {
    if (!chartContainerRef.current || isCollapsed) return

    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 300))

    const tf =
      TIMEFRAMES.find((t) => t.label === timeframe) || TIMEFRAMES[3]

    const candles = await generateCandlestickData(symbol, dayViews)

    const volumes = generateVolumeData(candles)

    const lastCandle = candles[candles.length - 1]
    const prevCandle = candles[candles.length - 2]

    const changeAmt = lastCandle.close - prevCandle.close
    const changePct = (changeAmt / prevCandle.close) * 100

    const totalVol = candles.reduce((sum, c) => sum + c.volume, 0)

    setPriceData({
      current: lastCandle.close,
      change: changeAmt,
      changePct,
      volume: totalVol / candles.length,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      open: candles[0].open,
    })

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    try {
      const { createChart } = await import('lightweight-charts')

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,

        layout: {
          background: {
            type: 'solid',
            color: 'transparent',
          },

          textColor: '#475569',

          fontFamily: '"IBM Plex Mono", monospace',

          fontSize: Math.max(
            10,
            chartContainerRef.current.clientHeight * 0.015
          ),
        },

        grid: {
          vertLines: {
            color: 'rgba(255,255,255,0.03)',
            style: 1,
          },

          horzLines: {
            color: 'rgba(255,255,255,0.03)',
            style: 1,
          },
        },

        crosshair: {
          mode: 1,

          vertLine: {
            color: 'rgba(0, 212, 255, 0.4)',
            width: 1,
            labelBackgroundColor: '#0a1628',
          },

          horzLine: {
            color: 'rgba(0, 212, 255, 0.4)',
            width: 1,
            labelBackgroundColor: '#0a1628',
          },
        },

        rightPriceScale: {
          borderColor: 'rgba(255,255,255,0.06)',

          scaleMargins: {
            top: 0.1,
            bottom: 0.25,
          },
        },

        timeScale: {
          borderColor: 'rgba(255,255,255,0.06)',
          timeVisible: true,
          secondsVisible: false,
        },

        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },

        handleScale: {
          mouseWheel: true,
          pinch: true,
        },
      })

      chartRef.current = chart

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#00e676',
        downColor: '#ff3d57',

        borderUpColor: '#00e676',
        borderDownColor: '#ff3d57',

        wickUpColor: 'rgba(0, 230, 118, 0.6)',
        wickDownColor: 'rgba(255, 61, 87, 0.6)',
      })

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: {
          type: 'volume',
        },

        priceScaleId: 'volume',
      })

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      })

      candleSeries.setData(candles)
      volumeSeries.setData(volumes)

      candleSeriesRef.current = candleSeries
      volumeSeriesRef.current = volumeSeries

      chart.subscribeCrosshairMove((param) => {
        if (!param.time) {
          setHoveredCandle(null)
          return
        }

        const c = param.seriesData.get(candleSeries)

        if (c) setHoveredCandle(c)
      })

      chart.timeScale().fitContent()

      resizeObserverRef.current = new ResizeObserver(() => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          })
        }
      })

      resizeObserverRef.current.observe(chartContainerRef.current)
    } catch (err) {
      console.error('Chart init error:', err)
    }

    setIsLoading(false)
  }, [timeframe, isCollapsed, symbol])

  useEffect(() => {
    loadChart()

    return () => {
      resizeObserverRef.current?.disconnect()

      chartRef.current?.remove()

      chartRef.current = null
    }
  }, [loadChart, symbol])

  const isPositive = priceData
    ? priceData.changePct >= 0
    : true

  return (
    <div
      className="
        flex flex-col
        glass
        border-l border-white/[0.06]
        relative
        overflow-hidden

        h-[75vh]
        min-h-[500px]
        max-h-[75vh]
      "
    >
      {/* HEADER */}

      <div
        className="
          flex items-center justify-between
          px-[1vw]
          basis-[10%]
          min-h-[54px]
          border-b border-white/[0.04]
          shrink-0
        "
      >
        <div className="flex items-center gap-[1vw] min-w-0">
          <div className="flex items-center gap-[0.6vw] min-w-0">
            <div className="w-[0.7vh] h-[0.7vh] rounded-full bg-bull animate-pulse-slow" />

            <span className="font-display text-[clamp(12px,1.1vh,15px)] font-bold text-white truncate">
              {symbol.toUpperCase()}
            </span>

            <span className="text-[clamp(9px,0.8vh,11px)] text-slate-500 font-mono">
              HOSE
            </span>
          </div>

          {priceData && !isLoading && (
            <div className="flex items-center gap-[0.6vw] min-w-0">
              <span className="text-[clamp(14px,1.5vh,20px)] font-mono font-semibold text-white truncate">
                {priceData.current.toLocaleString('vi-VN')}
              </span>

              <div
                className={`
                  flex items-center gap-1
                  px-[0.5vw] py-[0.2vh]
                  rounded
                  text-[clamp(9px,0.8vh,11px)]
                  font-mono font-semibold

                  ${
                    isPositive
                      ? 'bg-bull/10 text-bull'
                      : 'bg-bear/10 text-bear'
                  }
                `}
              >
                {isPositive ? (
                  <TrendingUp className="w-[1.2vh] h-[1.2vh]" />
                ) : (
                  <TrendingDown className="w-[1.2vh] h-[1.2vh]" />
                )}

                {isPositive ? '+' : ''}
                {priceData.changePct.toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-[0.3vw]">
          {/* TIMEFRAME */}

          <div className="relative">
            <button
              onClick={() =>
                setShowTimeframeMenu(!showTimeframeMenu)
              }
              className="
                flex items-center gap-1
                px-[0.7vw] py-[0.5vh]
                rounded-md
                text-[clamp(9px,0.8vh,11px)]
                text-slate-400
                hover:text-slate-200
                hover:bg-white/[0.05]
                border border-transparent
                hover:border-white/[0.06]
                transition-all
                font-mono
              "
            >
              {timeframe}

              <ChevronDown className="w-[1.1vh] h-[1.1vh]" />
            </button>

            <AnimatePresence>
              {showTimeframeMenu && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -4,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                    scale: 0.96,
                  }}
                  transition={{ duration: 0.1 }}
                  className="
                    absolute
                    right-0 top-full
                    mt-1
                    glass
                    rounded-lg
                    border border-white/[0.08]
                    overflow-hidden
                    z-50
                    min-w-[80px]
                  "
                >
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.label}
                      onClick={() => {
                        setTimeframe(tf.label)
                        setShowTimeframeMenu(false)
                        setDayViews(tf.days)
                      }}
                      className={`
                        w-full
                        px-[0.8vw]
                        py-[0.8vh]
                        text-[clamp(9px,0.8vh,12px)]
                        font-mono
                        text-left
                        transition-all

                        ${
                          timeframe === tf.label
                            ? 'bg-accent/15 text-accent'
                            : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                        }
                      `}
                    >
                      {tf.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BUTTONS */}

          <button
            onClick={loadChart}
            className="
              w-[3vh]
              h-[3vh]
              rounded-md
              flex items-center justify-center
              text-slate-500
              hover:text-slate-300
              hover:bg-white/[0.05]
              transition-all
            "
          >
            <RefreshCw
              className={`w-[1.2vh] h-[1.2vh] ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
          </button>

          <button
            onClick={onToggleFullscreen}
            className="
              w-[3vh]
              h-[3vh]
              rounded-md
              flex items-center justify-center
              text-slate-500
              hover:text-slate-300
              hover:bg-white/[0.05]
              transition-all
            "
          >
            {isFullscreen ? (
              <Minimize2 className="w-[1.2vh] h-[1.2vh]" />
            ) : (
              <Maximize2 className="w-[1.2vh] h-[1.2vh]" />
            )}
          </button>

          <button
            onClick={onToggleCollapse}
            className="
              w-[3vh]
              h-[3vh]
              rounded-md
              flex items-center justify-center
              text-slate-500
              hover:text-bear
              hover:bg-bear/10
              transition-all
            "
          >
            <X className="w-[1.2vh] h-[1.2vh]" />
          </button>
        </div>
      </div>

      {/* STATS */}

      {priceData && !isLoading && (
        <div
          className="
            flex items-center
            gap-[1vw]
            px-[1vw]
            basis-[9%]
            min-h-[48px]
            border-b border-white/[0.04]
            shrink-0
            overflow-hidden
          "
        >
          <StatBadge
            label="Open"
            value={priceData.open.toLocaleString('vi-VN')}
            color="text-slate-300"
          />

          <StatBadge
            label="High"
            value={priceData.high.toLocaleString('vi-VN')}
            color="text-bull"
          />

          <StatBadge
            label="Low"
            value={priceData.low.toLocaleString('vi-VN')}
            color="text-bear"
          />

          <StatBadge
            label="Avg Vol"
            value={`${(
              priceData.volume / 1_000_000
            ).toFixed(1)}M`}
            color="text-slate-300"
          />

          {hoveredCandle && (
            <div
              className="
                ml-auto
                flex flex-wrap items-center
                gap-[0.6vw]
                text-[clamp(9px,0.8vh,11px)]
                font-mono
                bg-white/[0.04]
                rounded-md
                px-[0.8vw]
                py-[0.5vh]
                border border-white/[0.06]
                overflow-hidden
              "
            >
              <span className="text-slate-500">O</span>

              <span className="text-white">
                {hoveredCandle.open?.toLocaleString('vi-VN')}
              </span>

              <span className="text-slate-500">H</span>

              <span className="text-bull">
                {hoveredCandle.high?.toLocaleString('vi-VN')}
              </span>

              <span className="text-slate-500">L</span>

              <span className="text-bear">
                {hoveredCandle.low?.toLocaleString('vi-VN')}
              </span>

              <span className="text-slate-500">C</span>

              <span className="text-white">
                {hoveredCandle.close?.toLocaleString('vi-VN')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* CHART */}

      <div className="flex-1 relative overflow-hidden min-h-0">
        {isLoading && <SkeletonChart />}

        <div
          ref={chartContainerRef}
          className={`
            w-full h-full
            transition-opacity duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
        />
      </div>

      {/* GRADIENT */}

      <div
        className="
          absolute
          bottom-0 left-0 right-0
          h-[4vh]
          pointer-events-none
        "
        style={{
          background:
            'linear-gradient(to top, rgba(2,6,23,0.6), transparent)',
        }}
      />
    </div>
  )
}