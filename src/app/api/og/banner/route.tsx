import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge';

// Pre-defined High-End Backgrounds to ensure Satori compatibility (JPG format forced)
const BG_PRESETS: Record<string, string> = {
    'B1': 'https://images.unsplash.com/photo-1596767746419-f027fc6b16e1?w=600&q=80&fm=jpg', // Dark Vintage Rock
    'B2': 'https://images.unsplash.com/photo-1581412039281-64506cbe6a89?w=600&q=80&fm=jpg', // Black Silk
    'B3': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80&fm=jpg', // Stage Spotlight
    'B4': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80&fm=jpg', // Pink Blue Retro Grid
    'B5': 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80&fm=jpg', // Vaporwave Neon
    'B6': 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80&fm=jpg', // Synthwave Magenta
    'B7': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80&fm=jpg', // Abstract Orange/Gold Laser
    'B8': 'https://images.unsplash.com/photo-1605235455938-1a5270c5e1a1?w=600&q=80&fm=jpg', // Cyberpunk Blue/Pink City
}

const FONT_MAP: Record<string, { name: string, file: string }> = {
    'SANS': { name: 'Black Han Sans', file: 'BlackHanSans-Regular.ttf' },
    'SERIF': { name: 'Nanum Myeongjo', file: 'NanumMyeongjo-ExtraBold.ttf' },
    'JUA': { name: 'Jua', file: 'Jua-Regular.ttf' },
    'DOHYEON': { name: 'Do Hyeon', file: 'DoHyeon-Regular.ttf' }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)

        // Text & Size
        const t1Param = searchParams.get('t1')
        const t1 = t1Param !== null ? t1Param : '텍스트 1'
        const t2Param = searchParams.get('t2')
        const t2 = t2Param !== null ? t2Param : ''
        const s1 = parseInt(searchParams.get('s1') || '100')
        const s2 = parseInt(searchParams.get('s2') || '80')

        // Styling Config
        const bgType = searchParams.get('bgtype') || 'IMAGE' // 'IMAGE' or 'SOLID'
        const bgVal = searchParams.get('bgval') || 'B1' // bg id or hex code
        const fontKey = searchParams.get('font') || 'SANS' // 'SANS' or 'SERIF' or 'JUA' or 'DOHYEON'
        const effect = searchParams.get('effect') || 'SHADOW'
        const txtColor = searchParams.get('color') || '#ffffff'

        // Load the single requested font
        const fontConfig = FONT_MAP[fontKey] || FONT_MAP['SANS']
        const fontUrl = new URL(`/fonts/${fontConfig.file}`, req.url)

        let fontData: ArrayBuffer;
        try {
            const fontRes = await fetch(fontUrl)
            if (!fontRes.ok) {
                // Fallback to BlackHanSans if the requested font fails
                const fallbackUrl = new URL('/fonts/BlackHanSans-Regular.ttf', req.url)
                const fallbackRes = await fetch(fallbackUrl)
                fontData = await fallbackRes.arrayBuffer()
            } else {
                fontData = await fontRes.arrayBuffer()
            }
        } catch (fontError) {
            console.error('Font load error:', fontError)
            // Minimum fallback to ensure it doesn't crash
            return new Response('Font load error', { status: 500 })
        }

        // Effect Mapping
        const getEffectStyle = (eff: string, isSubtext: boolean) => {
            if (eff === 'NEON_PINK') {
                return { color: txtColor, textShadow: `0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff, 2px 2px 0 #cc00cc` }
            }
            if (eff === 'NEON_BLUE') {
                return { color: txtColor, textShadow: `0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 40px #00f0ff, 0 0 60px #00f0ff, 2px 2px 0 #0099cc` }
            }
            if (eff === 'NEON_GOLD') {
                return { color: txtColor, textShadow: `0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 40px #ffd700, 0 0 60px #ffd700, 2px 2px 0 #b8860b` }
            }
            if (eff === 'SHADOW') {
                return { color: txtColor, textShadow: '4px 4px 10px rgba(0,0,0,0.9), 1px 1px 3px rgba(0,0,0,1)' }
            }
            return { color: txtColor, textShadow: 'none' }
        }

        const e1 = getEffectStyle(effect, false)
        const e2 = getEffectStyle(effect, true)

        const content = (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: bgType === 'SOLID' ? bgVal : bgType === 'CUSTOM' ? 'transparent' : '#000000',
                overflow: 'hidden'
            }}>

                {/* Background Image Layer */}
                {bgType === 'IMAGE' && BG_PRESETS[bgVal] && (
                    <img src={BG_PRESETS[bgVal]} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {bgType === 'CUSTOM' && bgVal && bgVal.startsWith('http') && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' }}>
                        <img src={bgVal} style={{ zIndex: 1, width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                )}
                {bgType === 'IMAGE' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex' }} />
                )}

                {/* Typography Layer */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    fontFamily: fontConfig.name,
                    zIndex: 10,
                    letterSpacing: fontKey === 'SERIF' ? '4px' : '2px',
                    lineHeight: 1.15,
                    padding: '0 40px'
                }}>
                    <div style={{ fontSize: `${s1}px`, marginBottom: t2 ? '10px' : '0', ...e1 }}>{t1}</div>
                    {t2 && <div style={{ fontSize: `${s2}px`, ...e2 }}>{t2}</div>}
                </div>
            </div>
        )

        return new ImageResponse(
            content,
            {
                width: 600,
                height: 600,
                fonts: [
                    { name: fontConfig.name, data: fontData, style: 'normal' }
                ],
                headers: {
                    'Cache-Control': 'public, s-maxage=31536000, max-age=31536000, immutable',
                },
            }
        )
    } catch (e: any) {
        console.error('OG Generation Error:', e.message)
        return new Response(`Failed to generate image: ${e.message}`, { status: 500 })
    }
}

