import { useState, useCallback } from 'react'
import { generateCandlestickData, generateVolumeData } from '../utils/chartData'

const INITIAL_MESSAGES = [
  {
    id: '1',
    role: 'assistant',
    content: `**Xin chào! Tôi là FPT Intelligence** — trợ lý phân tích tài chính AI.\n\nTôi có thể giúp bạn:\n- 📊 **Phân tích kỹ thuật** cổ phiếu FPT theo thời gian thực\n- 📈 **Dự báo xu hướng** dựa trên mô hình ML\n- 💡 **Khuyến nghị đầu tư** với luận điểm rõ ràng\n- 🔍 **So sánh peer** và định giá tương đối\n\nHãy đặt câu hỏi hoặc chọn một chủ đề phân tích để bắt đầu.`,
    timestamp: new Date(Date.now() - 60000),
  }
]

const WATCHLIST = [
  { symbol: 'FPT', name: 'FPT Corporation', price: 124500, change: 2.34, active: true },
  { symbol: 'VNM', name: 'Vinamilk', price: 78300, change: -0.87, active: false },
  { symbol: 'VIC', name: 'Vingroup', price: 43200, change: 1.12, active: false },
  { symbol: 'HPG', name: 'Hòa Phát Group', price: 28700, change: -1.45, active: false },
  { symbol: 'MWG', name: 'Mobile World', price: 56800, change: 0.63, active: false },
  { symbol: 'TCB', name: 'Techcombank', price: 34100, change: 3.21, active: false },
  { symbol: 'VHM', name: 'Vinhomes', price: 38900, change: -0.34, active: false },
  { symbol: 'GAS', name: 'PV Gas', price: 92600, change: 0.18, active: false },
]

export function useChatStore() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)
  const [watchlist] = useState(WATCHLIST)
  const [activeSymbol, setActiveSymbol] = useState('FPT')

  const sendMessage = useCallback(async (content) => {
  const userMsg = {
    id: Date.now().toString(),
    role: 'user',
    content,
    timestamp: new Date(),
  }

  setMessages(prev => [...prev, userMsg])
  setIsLoading(true)

  try {
    // Chỉ gửi history trước đó + message mới
    const chatMessages = [
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user',
        content,
      },
    ]

    // Gọi backend FastAPI
    const response = await fetch(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Hoặc model bạn muốn dùng
        messages: chatMessages,
      }),
    })

    if (!response.ok) {
      throw new Error('Backend API error')
    }

    const data = await response.json()

    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.reply,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, assistantMsg])

  } catch (err) {
    console.error(err)

    const errorMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `
## ❌ Lỗi kết nối backend
Không thể kết nối tới FastAPI server.
      `,
      timestamp: new Date(),
      isError: true,
    }

    setMessages(prev => [...prev, errorMsg])
  } finally {
    setIsLoading(false)
  }
}, [messages])

  const clearMessages = useCallback(() => {
    setMessages(INITIAL_MESSAGES)
  }, [])

  return {
    messages,
    isLoading,
    watchlist,
    activeSymbol,
    setActiveSymbol,
    sendMessage,
    clearMessages,
  }
}
