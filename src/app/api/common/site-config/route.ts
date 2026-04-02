import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        let config = await prisma.siteConfig.findUnique({
            where: { id: 'default' }
        })

        if (!config) {
            // Initialize with defaults if not exists
            config = await prisma.siteConfig.create({
                data: { id: 'default' }
            })
        }

        return NextResponse.json(config)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        // TODO: Add Admin check here if needed, but usually admin APIs are separate.
        // For simplicity, we'll implement the admin update logic here or in a dedicated admin API.
        const body = await request.json()

        const config = await prisma.siteConfig.upsert({
            where: { id: 'default' },
            update: body,
            create: { id: 'default', ...body }
        })

        return NextResponse.json(config)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
