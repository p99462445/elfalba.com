/**
 * Supabase Transform API를 이용한 이미지 최적화 유틸리티
 * Vercel 이미지 최적화 과금 없이 WebP 변환 + 리사이징 처리
 */

type ImageSize = 'thumbnail' | 'banner' | 'full'

const SIZE_MAP: Record<ImageSize, { width: number; quality: number }> = {
    thumbnail: { width: 200, quality: 80 },  // 공고 썸네일 (64px 표시되지만 2x 대응)
    banner: { width: 600, quality: 80 },     // 메인 배너
    full: { width: 1200, quality: 85 },      // 상세 페이지 이미지
}

/**
 * Supabase Storage URL을 Transform URL로 변환
 * - 원본: .../storage/v1/object/public/...
 * - 변환: .../storage/v1/render/image/public/...?width=200&quality=80&format=webp
 *
 * Supabase Storage URL이 아닌 경우 (Unsplash 등 외부 URL)는 원본 반환
 */
export function getOptimizedImageUrl(
    url: string | null | undefined,
    size: ImageSize = 'thumbnail'
): string {
    if (!url) return ''

    // Supabase Free 플랜은 서버 변환을 지원하지 않으므로, 
    // 여기서는 원본 URL을 반환하고 Vercel (Next.js Image) 최적화를 사용합니다.
    return url
}
