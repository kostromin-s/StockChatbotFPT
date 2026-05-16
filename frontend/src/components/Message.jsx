import { memo } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Activity, User, AlertCircle } from 'lucide-react'
import { useState, forwardRef } from 'react'

const CodeBlock = memo(({ language, value }) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-white/[0.08]">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-900 border-b border-white/[0.06]">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{language || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          {copied ? <Check size={11} className="text-bull" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          background: 'rgba(6, 13, 31, 0.8)',
          padding: '12px 16px',
          fontSize: '12px',
          lineHeight: '1.6',
          fontFamily: '"IBM Plex Mono", monospace',
        }}
        wrapLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})

const markdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
    ) : (
      <code className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>
        {children}
      </code>
    )
  },
  h1: ({ children }) => <h1 className="text-[16px] font-semibold text-white mt-4 mb-2 pb-1 border-b border-white/[0.08]">{children}</h1>,
  h2: ({ children }) => <h2 className="text-[14px] font-semibold text-white mt-3 mb-1.5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[13px] font-medium text-slate-200 mt-2 mb-1">{children}</h3>,
  p: ({ children }) => <p className="text-[13px] leading-relaxed text-slate-300 mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 space-y-1 pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal">{children}</ol>,
  li: ({ children }) => (
    <li className="text-[13px] text-slate-300 leading-relaxed flex gap-2">
      <span className="text-accent/60 mt-1 flex-shrink-0">▸</span>
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-accent/40 pl-3 my-2 bg-accent/[0.04] rounded-r-md py-1.5">
      <div className="text-slate-400 italic text-[13px]">{children}</div>
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="text-slate-300 italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors">
      {children}
    </a>
  ),
  hr: () => <hr className="border-white/[0.08] my-3" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.08]">
      <table className="w-full text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-accent/[0.08]">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-medium text-accent text-[11px] uppercase tracking-wide border-b border-white/[0.08]">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-slate-300 border-b border-white/[0.04] last:border-0">{children}</td>,
  tr: ({ children }) => <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>,
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  )
}

const Message = memo(forwardRef(({ message }, ref) => {
  const isUser = message.role === 'user'
  const isStreaming = !isUser && message.content === ''

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
        isUser
          ? 'bg-white/[0.08] border border-white/[0.1]'
          : message.isError
          ? 'bg-bear/20 border border-bear/30'
          : 'bg-accent/15 border border-accent/30 shadow-[0_0_10px_rgba(0,212,255,0.15)]'
      }`}>
        {isUser
          ? <User size={12} className="text-slate-400" />
          : message.isError
          ? <AlertCircle size={12} className="text-bear" />
          : <Activity size={12} className="text-accent" />
        }
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {isUser ? (
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-white/[0.07] border border-white/[0.08] text-[13px] text-slate-200 leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className={`px-4 py-3 rounded-2xl rounded-tl-md text-[13px] leading-relaxed ${
            message.isError
              ? 'bg-bear/[0.06] border border-bear/20'
              : 'bg-surface-800/80 border border-white/[0.06]'
          }`}>
            {isStreaming ? (
              <TypingIndicator />
            ) : (
              <div className="prose-dark">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-[10px] text-slate-600 font-mono ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {message.timestamp?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}))

Message.displayName = 'Message'
export default Message
