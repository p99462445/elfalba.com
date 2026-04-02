import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse IP and User Agent
        let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown'
        // If multiple IPs are forwarded, take the first one
        if (ip.includes(',')) ip = ip.split(',')[0].trim()

        const userAgent = req.headers.get('user-agent') || 'Unknown'

        // Check if there's already a log for this IP within the last 5 minutes to prevent spam
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

        const recentLog = await prisma.loginLog.findFirst({
            where: {
                user_id: user.id,
                ip: ip,
                created_at: {
                    gte: fiveMinutesAgo
                }
            }
        })

        if (!recentLog) {
            await prisma.loginLog.create({
                data: {
                    user_id: user.id,
                    ip,
                    user_agent: userAgent,
                }
            })

            // Optionally update user's last_login time
            await prisma.user.update({
                where: { id: user.id },
                data: { last_login: new Date() }
            })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Login log error', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
