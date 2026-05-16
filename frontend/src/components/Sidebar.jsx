import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Plus, TrendingUp, TrendingDown,
  BarChart3, Settings, Bell, Search, X, Activity, Layers
} from 'lucide-react'

function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <div className="relative flex-shrink-0 w-8 h-8">
        <div className="absolute inset-0 rounded-lg bg-accent/20 border border-accent/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity size={16} className="text-accent" />
        </div>
        <div className="absolute inset-0 rounded-lg animate-glow pointer-events-none" />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              FPT<span className="text-accent">Intel</span>
            </span>
            <span className="block text-[9px] text-slate-500 tracking-widest uppercase font-mono -mt-0.5">
              AI Trading
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WatchlistItem({ item, isActive, collapsed, onClick }) {
  const isPositive = item.change >= 0
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(item.symbol)}
      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-200 group relative ${
        isActive
          ? 'bg-accent/10 border border-accent/30 text-white'
          : 'hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent rounded-full" />
      )}

      <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold font-mono ${
        isActive ? 'bg-accent/20 text-accent' : 'bg-white/[0.05] text-slate-400 group-hover:text-slate-200'
      }`}>
        {item.symbol.substring(0, 3)}
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-w-0 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[12px] font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>
                {item.symbol}
              </span>
              <span className={`text-[11px] font-mono font-medium ${isPositive ? 'text-bull' : 'text-bear'}`}>
                {isPositive ? '+' : ''}{item.change.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <span className="text-[10px] text-slate-500 truncate">{item.name}</span>
              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                {item.price.toLocaleString('vi-VN')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!collapsed && (
        <div className={`flex-shrink-0 ${isPositive ? 'text-bull' : 'text-bear'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        </div>
      )}
    </motion.button>
  )
}

export default function Sidebar({ activeSymbol, watchlist, onSymbolSelect, onNewChat }) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = watchlist.filter(i =>
    i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-full flex flex-col glass border-r border-white/[0.06] z-20 flex-shrink-0"
      style={{ overflow: 'hidden' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-white/[0.04] flex-shrink-0">
        <Logo collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* New Analysis Button */}
      <div className="px-2.5 pt-3 pb-1 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/30 hover:bg-accent/15 hover:border-accent/50 transition-all group ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Plus size={15} className="text-accent flex-shrink-0 group-hover:rotate-90 transition-transform duration-200" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[13px] font-medium text-accent whitespace-nowrap overflow-hidden"
              >
                New Analysis
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-2.5 py-2 flex-shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm cổ phiếu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-accent/30 focus:bg-accent/[0.03] transition-all"
            />
          </div>
        </div>
      )}

      {/* Watchlist label */}
      {!collapsed && (
        <div className="px-3 py-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Layers size={10} className="text-slate-600" />
            <span className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
              Watchlist
            </span>
          </div>
        </div>
      )}

      {/* Watchlist */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.map(item => (
          <WatchlistItem
            key={item.symbol}
            item={item}
            isActive={item.symbol === activeSymbol}
            collapsed={collapsed}
            onClick={onSymbolSelect}
          />
        ))}
      </div>

      {/* Market Status */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-t border-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse-slow" />
            <span className="text-[11px] text-slate-500">HOSE <span className="text-bull">Open</span></span>
            <span className="text-[10px] text-slate-600 ml-auto font-mono">10:24:31</span>
          </div>
        </div>
      )}

      {/* Bottom Icons */}
      <div className={`border-t border-white/[0.04] px-2.5 py-2.5 flex items-center flex-shrink-0 ${
        collapsed ? 'flex-col gap-1' : 'gap-1'
      }`}>
        <button className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all">
          <Bell size={14} />
        </button>
        <button className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all">
          <BarChart3 size={14} />
        </button>
        {!collapsed && <div className="flex-1" />}
        <button className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all">
          <Settings size={14} />
        </button>
      </div>
    </motion.aside>
  )
}
