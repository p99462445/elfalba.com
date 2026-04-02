'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Send, User, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface FloatingJobChatProps {
    employerUserId: string
    employerBusinessName: string
    currentUserId: string
    onClose: () => void
}

export default function FloatingJobChat({ employerUserId, employerBusinessName, currentUserId, onClose }: FloatingJobChatProps) {
    const [roomId, setRoomId] = useState<string | null>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        initiateChat()
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [employerUserId])

    const initiateChat = async () => {
        try {
            // Initiate or get the room
            const res = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: employerUserId })
            })
            const result = await res.json()
            if (result.data) {
                setRoomId(result.data.id)
                await fetchMessages(result.data.id)

                // Start polling every 3 seconds
                pollingRef.current = setInterval(() => fetchMessages(result.data.id), 3000)
            }
        } catch (error) {
            console.error('Initiate chat error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMessages = async (id: string = roomId!) => {
        if (!id) return
        try {
            const res = await fetch(`/api/chat/rooms/${id}/messages`)
            const result = await res.json()
            if (result.data) {
                setMessages(prev => {
                    // Only update if count or IDs change
                    if (prev.length !== result.data.length) return result.data
                    return prev
                })
            }
        } catch (error) {
            console.error('Fetch messages error:', error)
        }
    }

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newMessage.trim() || !roomId || isSending) return

        setIsSending(true)
        try {
            const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            })
            const result = await res.json()
            if (result.data) {
                setMessages([...messages, { ...result.data, sender: { id: currentUserId, nickname: '나' } }])
                setNewMessage('')
            }
        } catch (error) {
            console.error('Send error:', error)
        } finally {
            setIsSending(false)
        }
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end pointer-events-none md:justify-center md:items-center">
            {/* Backdrop for mobile */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto md:hidden" onClick={onClose} />

            <div className="bg-white dark:bg-dark-card w-full h-[85vh] md:w-[400px] md:h-[600px] flex flex-col rounded-t-[32px] md:rounded-3xl shadow-2xl relative pointer-events-auto overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-dark-border flex-shrink-0 bg-white dark:bg-dark-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center text-amber-500">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="font-black text-[15px] truncate max-w-[200px] text-gray-900 dark:text-gray-100">{employerBusinessName}</p>
                            <p className="text-[11px] font-bold text-gray-400">1:1 채팅 문의</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-dark-bg p-5 space-y-4">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="animate-spin text-amber-400" size={24} />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <User className="mb-4 text-gray-300" size={40} />
                            <p className="text-[13px] font-black text-gray-600 mb-1">{employerBusinessName}에 문의해 보세요!</p>
                            <p className="text-[11px] text-gray-400">내 연락처는 노출되지 않습니다.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMine = msg.sender_id === currentUserId
                            return (
                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-2'}`}>
                                        <div className={`
                                             ${isMine ? 'bg-amber-500 text-white rounded-tr-none shadow-lg shadow-amber-100 dark:shadow-none' : 'bg-white dark:bg-dark-bg text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100/50 dark:border-dark-border'}
                                         `}>
                                            {msg.content}
                                        </div>
                                        <p className={`text-[9px] text-gray-300 mt-1 opacity-70 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                            {format(new Date(msg.created_at), 'a hh:mm', { locale: ko })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border flex-shrink-0">
                    <form onSubmit={sendMessage} className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="메시지 입력..."
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border h-11 px-4 pr-12 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-gray-900 dark:text-gray-100"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-amber-500 disabled:text-gray-300 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
