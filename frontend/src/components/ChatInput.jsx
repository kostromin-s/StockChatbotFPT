import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, Paperclip, Zap, TrendingUp, BarChart2, FileText } from 'lucide-react'

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Phân tích kỹ thuật', text: 'Phân tích kỹ thuật cổ phiếu FPT hiện tại, bao gồm các chỉ báo RSI, MACD và xu hướng giá.' },
  { icon: BarChart2, label: 'Dự đoán giá cổ phiếu', text: 'Dự đoán giá cổ phiếu FPT cho 5 ngày tới.' },
  { icon: FileText, label: 'Tóm tắt tin tức', text: 'Tóm tắt các tin tức quan trọng ảnh hưởng đến FPT trong tuần này và tác động dự kiến.' },
  { icon: Zap, label: 'Tín hiệu giao dịch', text: 'Dựa trên phân tích hiện tại, đưa ra tín hiệu mua/bán/giữ cho FPT với stop loss và target giá.' },
]

export default function ChatInput({ onSend, isLoading, disabled }) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef(null)

  const handleSubmit = useCallback(() => {
    const text = value.trim()
    if (!text || isLoading) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isLoading, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e) => {
    setValue(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }

  const quickPrompt = (text) => {
    setValue(text)
    textareaRef.current?.focus()
  }

  const canSend = value.trim().length > 0 && !isLoading

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-2">
      {/* Quick prompts */}
      {value === '' && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-1.5 mb-3"
        >
          {QUICK_PROMPTS.map(({ icon: Icon, label, text }) => (
            <button
              key={label}
              onClick={() => quickPrompt(text)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:text-accent hover:bg-accent/[0.04] transition-all font-medium"
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input box */}
      <div className={`relative rounded-xl border transition-all duration-200 ${
        isFocused
          ? 'border-accent/40 bg-surface-800/90 shadow-[0_0_20px_rgba(0,212,255,0.08)]'
          : 'border-white/[0.08] bg-surface-800/60'
      }`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
          placeholder="Hỏi về cổ phiếu FPT, xu hướng thị trường, phân tích kỹ thuật..."
          rows={1}
          className="w-full resize-none bg-transparent px-4 py-3.5 pr-24 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none leading-relaxed disabled:opacity-50"
          style={{ maxHeight: '140px' }}
        />

        {/* Actions */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] transition-all">
            <Paperclip size={13} />
          </button>
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] transition-all">
            <Mic size={13} />
          </button>

          <motion.button
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
            onClick={handleSubmit}
            disabled={!canSend}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
              canSend
                ? 'bg-accent hover:bg-accent/90 text-surface-950 shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                : 'bg-white/[0.05] text-slate-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-surface-950 animate-spin" />
            ) : (
              <Send size={13} className={canSend ? '' : 'opacity-50'} />
            )}
          </motion.button>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="text-[10px] text-slate-700">
          FPT Intelligence · Powered by Ollama · Dữ liệu mang tính tham khảo
        </span>
      </div>
    </div>
  )
}
