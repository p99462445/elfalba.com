'use client'
import React, { useState, useEffect, useRef, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MessageSquare, Send, User, Loader2, MoreVertical, Trash2, Headphones } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function MessagesPage({ params: paramsPromise }: { params?: Promise<{ id: string }> }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const params = paramsPromise ? use(paramsPromise) : null
    const targetUserId = searchParams.get('user')
    const initialRoomId = params?.id || searchParams.get('room')
    const [user, setUser] = useState<any>(null)
    const [rooms, setRooms] = useState<any[]>([])
    const [activeRoom, setActiveRoom] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchUser()
    }, [])

    const fetchUser = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }
        setUser(user)
        await fetchRooms(user.id)
    }

    const fetchRooms = async (myId: string) => {
        try {
            const res = await fetch('/api/chat/rooms')
            const result = await res.json()
            if (result.data) {
                setRooms(result.data)

                // If targetUserId is provided, try to initiate/get that room
                if (targetUserId) {
                    initiateChat(targetUserId)
                } else if (initialRoomId) {
                    const room = result.data.find((r: any) => r.id === initialRoomId)
                    if (room) selectRoom(room)
                }
            }
        } catch (error) {
            console.error('Fetch rooms error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const initiateChat = async (targetId: string) => {
        try {
            const res = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: targetId })
            })
            const result = await res.json()
            if (result.data) {
                // Refresh rooms and set active
                const updatedRes = await fetch('/api/chat/rooms')
                const updatedResult = await updatedRes.json()
                if (updatedResult.data) {
                    setRooms(updatedResult.data)
                    const room = updatedResult.data.find((r: any) => r.id === result.data.id)
                    if (room) selectRoom(room)
                }
            }
        } catch (error) {
            console.error('Initiate chat error:', error)
        }
    }

    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    const selectRoom = async (room: any) => {
        if (pollingRef.current) clearInterval(pollingRef.current)

        setActiveRoom(room)
        setMessages([])

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chat/rooms/${room.id}/messages`)
                const result = await res.json()
                if (result.data) {
                    setMessages(prev => {
                        // Only update if count changed
                        if (prev.length !== result.data.length) return result.data
                        return prev
                    })
                }
            } catch (error) {
                console.error('Fetch messages error:', error)
            }
        }

        await fetchMessages() // Initial fetch

        // Start polling every 3 seconds
        pollingRef.current = setInterval(fetchMessages, 3000)
    }

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [])

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newMessage.trim() || !activeRoom || isSending) return

        setIsSending(true)
        try {
            const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            })
            const result = await res.json()
            if (result.data) {
                setMessages([...messages, { ...result.data, sender: { id: user.id, nickname: '나' } }])
                setNewMessage('')
                // Refresh room list to update last message
                const updatedRes = await fetch('/api/chat/rooms')
                const updatedResult = await updatedRes.json()
                if (updatedResult.data) setRooms(updatedResult.data)
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg h-[calc(100dvh-64px)] md:h-auto overflow-hidden relative">
            {/* Header */}
            <header className="bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border h-16 flex items-center px-4 gap-4 flex-shrink-0 z-[60]">
                {activeRoom ? (
                    <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 -ml-2 text-gray-400 dark:text-gray-500">
                        <ArrowLeft size={24} />
                    </button>
                ) : (
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 dark:text-gray-500">
                        <ArrowLeft size={24} />
                    </button>
                )}
                <h1 className="font-black text-[18px] text-gray-800 dark:text-gray-100 tracking-tight">
                    {activeRoom ? (
                        activeRoom.user1_id === user?.id
                            ? (activeRoom.user2.role === 'EMPLOYER' && activeRoom.user2.employer ? activeRoom.user2.employer.business_name : activeRoom.user2.nickname) || '상대방'
                            : (activeRoom.user1.role === 'EMPLOYER' && activeRoom.user1.employer ? activeRoom.user1.employer.business_name : activeRoom.user1.nickname) || '상대방'
                    ) : '메시지함'}
                </h1>
                <div className="ml-auto">
                    {activeRoom && <button className="p-2 text-gray-300 dark:text-gray-700"><MoreVertical size={20} /></button>}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Chat List */}
                <div className={`${activeRoom ? 'hidden md:block' : 'block'} w-full md:w-[350px] border-r border-gray-100 dark:border-dark-border overflow-y-auto bg-gray-50/30 dark:bg-dark-bg/30`}>
                    <div className="p-6 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card">
                        <h2 className="text-[12px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">최근 대화</h2>
                    </div>
                    {rooms.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="mx-auto text-gray-100 dark:text-dark-card mb-4" size={48} />
                            <p className="text-gray-300 dark:text-gray-700 font-bold text-sm">대화 내역이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-dark-border bg-white dark:bg-dark-bg">
                            {rooms.map((room) => {
                                const otherUser = room.user1_id === user?.id ? room.user2 : room.user1
                                return (
                                    <div
                                        key={room.id}
                                        onClick={() => selectRoom(room)}
                                        className={`p-5 flex gap-4 cursor-pointer hover:bg-amber-50/10 dark:hover:bg-dark-card transition-all ${activeRoom?.id === room.id ? 'bg-amber-50/30 dark:bg-dark-card' : ''}`}
                                    >
                                        <div className="w-12 h-12 bg-gray-50 dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border flex items-center justify-center text-gray-200 dark:text-dark-border overflow-hidden">
                                            <User size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-black text-[14px] text-gray-800 dark:text-gray-200 truncate">
                                                    {(otherUser.role === 'EMPLOYER' && otherUser.employer ? `${otherUser.employer.business_name} (${otherUser.employer.owner_name || '관리자'})` : otherUser.nickname) || '익명'}
                                                </span>
                                                <span className="text-[10px] text-gray-300 dark:text-gray-600 font-bold">
                                                    {format(new Date(room.last_message_at), 'HH:mm', { locale: ko })}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-gray-400 dark:text-gray-500 truncate font-medium">
                                                {room.last_message || '대화를 시작해 보세요'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Chat Room Area */}
                <div className={`${activeRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-dark-bg relative`}>
                    {activeRoom ? (
                        <>
                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/30 dark:bg-dark-bg/30 relative">
                                {/* Pinned Admin Notice */}
                                {(() => {
                                    const otherUser = activeRoom.user1_id === user?.id ? activeRoom.user2 : activeRoom.user1;
                                    if (otherUser.role === 'ADMIN') {
                                        return (
                                            <div className="sticky top-0 z-50 -mx-4 -mt-4 mb-6 px-4 py-3 bg-amber-500/5 dark:bg-amber-500/10 backdrop-blur-md border-b border-amber-500/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                                                        <Headphones size={16} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[12px] font-black text-amber-600 dark:text-amber-400 mb-0.5">
                                                            엘프알바 고객센터 운영시간 11~20시 연중무휴
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                                            대표번호 010-9946-2445
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {messages.map((msg) => {
                                    const isMine = msg.sender_id === user?.id
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] ${isMine ? 'order-1' : 'order-2'}`}>
                                                {!isMine && (
                                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 mb-1.5 ml-1">
                                                        {(msg.sender.role === 'EMPLOYER' && msg.sender.employer ? msg.sender.employer.business_name : msg.sender.nickname) || '상대방'}
                                                    </p>
                                                )}
                                                <div className={`
                                                    p-4 py-3 rounded-2xl text-[14px] font-bold shadow-sm
                                                    ${isMine ? 'bg-amber-500 text-white rounded-tr-none' : 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-50 dark:border-dark-border'}
                                                `}>
                                                    {msg.content}
                                                </div>
                                                <p className={`text-[9px] text-gray-300 dark:text-gray-600 mt-1 opacity-70 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                                    {format(new Date(msg.created_at), 'a hh:mm', { locale: ko })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area - Stuck to bottom */}
                            <div className="p-4 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border flex-shrink-0 z-40" >
                                <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto items-center">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="메시지를 입력해 주세요..."
                                            className="w-full bg-gray-100 dark:bg-dark-bg border-none h-12 px-5 pr-14 rounded-2xl text-[14px] font-bold dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/40 placeholder:text-gray-300 dark:placeholder:text-gray-700 transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || isSending}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-500 disabled:text-gray-200 dark:disabled:text-gray-800 transition-colors"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </form>
                            </div >
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-dark-card rounded-[40px] flex items-center justify-center text-gray-200 dark:text-dark-border mb-8 border border-gray-100 dark:border-dark-border">
                                <MessageSquare size={40} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">메시지를 선택해 주세요</h3>
                            <p className="text-gray-400 dark:text-gray-600 font-bold text-sm max-w-[240px]">
                                대화방을 선택하여 상대방과 대화를 시작할 수 있습니다.
                            </p>
                        </div>
                    )}
                </div >
            </main >
        </div >
    )
}
