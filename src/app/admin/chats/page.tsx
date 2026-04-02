import React from 'react'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MessageSquare, User, Clock, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminChatListPage() {
    const rooms = await prisma.chatRoom.findMany({
        orderBy: { updated_at: 'desc' },
        include: {
            user1: { select: { nickname: true, email: true, role: true } },
            user2: { select: { nickname: true, email: true, role: true } },
            _count: { select: { messages: true } }
        }
    })

    return (
        <div className="space-y-6">
            <header className="bg-white dark:bg-dark-card shadow dark:shadow-none rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">실시간 채팅 관리</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">사이트 내 모든 1:1 채팅 내역을 모니터링합니다. (관리자 전용)</p>
            </header>

            <div className="bg-white dark:bg-dark-card shadow dark:shadow-none rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center">
                    <h2 className="font-bold text-gray-700 dark:text-gray-300">전체 대화방 ({rooms.length})</h2>
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full uppercase tracking-tighter">Live Monitoring</span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-dark-border">
                    {rooms.length === 0 ? (
                        <div className="p-12 text-center text-gray-300 dark:text-gray-700">
                            <MessageSquare className="mx-auto mb-4 opacity-20" size={48} />
                            <p>생성된 대화방이 없습니다.</p>
                        </div>
                    ) : (
                        rooms.map((room) => (
                            <Link
                                href={`/admin/chats/${room.id}`}
                                key={room.id}
                                className="block p-6 hover:bg-gray-50 dark:hover:bg-dark-bg transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="flex -space-x-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-white dark:border-dark-border flex items-center justify-center text-blue-500 dark:text-blue-400">
                                            <User size={20} />
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-pink-900/30 border-2 border-white dark:border-dark-border flex items-center justify-center text-amber-500 dark:text-amber-400">
                                            <User size={20} />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{room.user1.nickname || '익명'}</span>
                                            <span className="text-gray-300 dark:text-gray-700">↔</span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{room.user2.nickname || '익명'}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                                            {room.last_message || '메시지 없음'}
                                        </p>
                                    </div>

                                    <div className="text-right flex items-center gap-4">
                                        <div className="hidden md:block">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-1">
                                                <MessageSquare size={14} />
                                                <span>{room._count.messages}개 메시지</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                                                <Clock size={12} />
                                                <span>{format(new Date(room.updated_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-300 dark:text-gray-700 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
