import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import Message from './Message.jsx'
import ChatInput from './ChatInput.jsx'

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex-1 flex flex-col items-center justify-center px-8 gap-6"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Activity size={28} className="text-accent" />
        </div>
        <div className="absolute inset-0 rounded-2xl animate-glow pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-bull border-2 border-surface-950 animate-pulse-slow" />
      </div>

      <div className="text-center max-w-xs">
        <h2 className="font-display text-[22px] font-bold text-white mb-2">
          FPT Intelligence
        </h2>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Trợ lý phân tích tài chính AI. Đặt câu hỏi về cổ phiếu, xu hướng thị trường, hoặc yêu cầu phân tích kỹ thuật chuyên sâu.
        </p>
      </div>
    </motion.div>
  )
}

export default function ChatArea({ messages, isLoading, onSend, onClear }) {
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isLoading])

  const isEmpty = messages.length === 0

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.04] flex-shrink-0 glass">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
          <span className="text-[13px] text-slate-400">AI Analysis Session</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bull/[0.08] border border-bull/20">
            <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
            <span className="text-[11px] text-bull font-medium">AI</span>
          </div>
          {messages.length > 1 && (
            <button
              onClick={onClear}
              className="ml-2 text-[11px] text-slate-600 hover:text-slate-400 transition-colors px-2 py-1 rounded-md hover:bg-white/[0.03]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        style={{ scrollbarGutter: 'stable' }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map(msg => (
            <Message key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Typing indicator when loading but no empty message yet */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <Activity size={12} className="text-accent" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-surface-800/80 border border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  )
}
