export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(req: Request) {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ isLegacy: false }, { status: 400 });
        }

        await client.connect();

        // Check legacy table - Always allow for legacy members regardless of is_migrated status
        const query = 'SELECT username, name, birthdate, phone FROM "public"."LegacyMember" WHERE username = $1 AND is_migrated = false LIMIT 1';
        const res = await client.query(query, [id]);

        if (res.rows.length > 0) {
            const legacyUser = res.rows[0];
            const hasInfo = legacyUser.birthdate || legacyUser.phone;

            return NextResponse.json({
                isLegacy: true,
                username: legacyUser.username,
                name: legacyUser.name,
                requiresManualAdmin: !hasInfo
            });
        }

        return NextResponse.json({ isLegacy: false });

    } catch (error) {
        console.error('Legacy check error:', error);
        return NextResponse.json({ isLegacy: false }, { status: 500 });
    } finally {
        await client.end();
    }
}
