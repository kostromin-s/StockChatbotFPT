import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, Menu, X, TrendingUp, ChevronRight } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import ChatArea from './components/ChatArea.jsx'
import StockChart from './components/StockChart.jsx'
import { useChatStore } from './hooks/useChatStore.js'
import { useResizable } from './hooks/useResizable.js'

// Mobile header
function MobileHeader({ symbol, onMenuOpen, onChartToggle, chartVisible }) {
  return (
    <div className="flex lg:hidden items-center justify-between px-4 h-14 glass border-b border-white/[0.06] flex-shrink-0 z-10">
      <button onClick={onMenuOpen} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all">
        <Menu size={18} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
        <span className="font-display text-[15px] font-bold text-white">
          FPT<span className="text-accent">Intel</span>
        </span>
      </div>
      <button
        onClick={onChartToggle}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
          chartVisible ? 'bg-accent/15 text-accent border border-accent/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
        }`}
      >
        <BarChart2 size={16} />
      </button>
    </div>
  )
}

// Draggable resizer between chat and chart
function Resizer({ onMouseDown, isDragging }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`resizer hidden lg:block ${isDragging ? 'active' : ''} relative`}
      title="Drag to resize"
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 flex items-center justify-center">
        <div className="w-0.5 h-8 rounded-full bg-white/10" />
      </div>
    </div>
  )
}

// Chart toggle button (when chart is hidden)
function ChartOpenButton({ onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      onClick={onClick}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 pl-3 pr-2 py-3 bg-surface-800 border border-white/[0.08] border-r-0 rounded-l-xl text-slate-400 hover:text-accent hover:border-accent/30 transition-all group shadow-xl"
      style={{ writingMode: 'vertical-lr' }}
      title="Open Chart"
    >
      <BarChart2 size={13} className="group-hover:text-accent transition-colors" style={{ writingMode: 'horizontal-tb' }} />
      <span className="text-[10px] font-medium tracking-wider">CHART</span>
      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" style={{ writingMode: 'horizontal-tb' }} />
    </motion.button>
  )
}

// Ambient grid background
function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />
      {/* Radial fade-outs */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 60%)'
      }} />
      <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{
        background: 'linear-gradient(to top, rgba(2,6,23,0.8), transparent)'
      }} />
    </div>
  )
}

export default function App() {
  const {
    messages, isLoading, watchlist, activeSymbol,
    setActiveSymbol, sendMessage, clearMessages
  } = useChatStore()

  const [chartVisible, setChartVisible] = useState(true)
  const [chartFullscreen, setChartFullscreen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileChartOpen, setMobileChartOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const { size: chartWidth, onMouseDown: onResizerDown } = useResizable({
    initial: 420, min: 280, max: 680
  })

  // Wrap resizer to track dragging state
  const handleResizerDown = useCallback((e) => {
    setIsDragging(true)
    onResizerDown(e)
  }, [onResizerDown])

  useEffect(() => {
    const onUp = () => setIsDragging(false)
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const handleSymbolSelect = (symbol) => {
    setActiveSymbol(symbol)
    setMobileSidebarOpen(false)
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-surface-950">
      <GridBackground />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full relative z-20">
        <Sidebar
          activeSymbol={activeSymbol}
          watchlist={watchlist}
          onSymbolSelect={handleSymbolSelect}
          onNewChat={clearMessages}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72"
            >
              <div className="h-full relative">
                <Sidebar
                  activeSymbol={activeSymbol}
                  watchlist={watchlist}
                  onSymbolSelect={handleSymbolSelect}
                  onNewChat={clearMessages}
                />
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all z-10"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">

        {/* Mobile Header */}
        <MobileHeader
          symbol={activeSymbol}
          onMenuOpen={() => setMobileSidebarOpen(true)}
          onChartToggle={() => setMobileChartOpen(!mobileChartOpen)}
          chartVisible={mobileChartOpen}
        />

        {/* Desktop layout: chat + resizer + chart */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* Chat Area — always visible */}
          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200 ${
            chartFullscreen ? 'hidden' : ''
          }`}>
            <ChatArea
              messages={messages}
              isLoading={isLoading}
              onSend={sendMessage}
              onClear={clearMessages}
            />
          </div>

          {/* Resizer (desktop only) */}
          {chartVisible && !chartFullscreen && (
            <Resizer onMouseDown={handleResizerDown} isDragging={isDragging} />
          )}

          {/* Stock Chart — desktop: beside chat */}
          <AnimatePresence mode="sync">
            {chartVisible && (
              <motion.div
                key="chart-desktop"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: chartFullscreen ? '100%' : chartWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="hidden lg:flex flex-col h-full overflow-hidden flex-shrink-0 relative"
                style={{ width: chartFullscreen ? '100%' : chartWidth }}
              >
                <StockChart
                  symbol={activeSymbol}
                  isCollapsed={false}
                  onToggleCollapse={() => setChartVisible(false)}
                  isFullscreen={chartFullscreen}
                  onToggleFullscreen={() => setChartFullscreen(!chartFullscreen)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chart open button when chart is hidden (desktop) */}
          <AnimatePresence>
            {!chartVisible && (
              <div className="hidden lg:block relative">
                <ChartOpenButton onClick={() => setChartVisible(true)} />
              </div>
            )}
          </AnimatePresence>

        </div>

        {/* Mobile Chart Sheet */}
        <AnimatePresence>
          {mobileChartOpen && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 right-0 bottom-0 z-30 rounded-t-2xl overflow-hidden"
              style={{ height: '60vh' }}
            >
              <div className="h-full bg-surface-900 border-t border-white/[0.08]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
                  <div className="w-8 h-1 rounded-full bg-white/20 mx-auto" />
                </div>
                <div className="h-[calc(100%-40px)]">
                  <StockChart
                    symbol={activeSymbol}
                    isCollapsed={false}
                    onToggleCollapse={() => setMobileChartOpen(false)}
                    isFullscreen={false}
                    onToggleFullscreen={() => {}}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
