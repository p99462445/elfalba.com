export const REGION_SLUG_TO_SEO: Record<string, string> = {
  seoul: "서울",
  "incheon-gyeonggi": "인천경기",
  "daejeon-sejong-chungcheong": "충청대전세종",
  "daegu-gyeongbuk": "대구경북",
  "busan-ulsan-gyeongnam": "부산울산경남",
  "gwangju-jeolla": "광주전라",
  "jeju-gangwon": "강원제주",
  all: "전국",
};

export const SEO_TO_REGION_SLUG: Record<string, string> = Object.entries(REGION_SLUG_TO_SEO).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

export const CATEGORY_SLUG_TO_SEO: Record<string, string> = {
  room: "배우구인",
  karaoke: "노래방알바",
  tenpro: "텐프로알바",
  bar: "바알바",
  aroma: "마사지알바",
  etc: "기타알바",
  all: "방송모델",
};

export const SEO_CATEGORY_TO_SLUG: Record<string, string> = Object.entries(CATEGORY_SLUG_TO_SEO).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

export const CATEGORY_SLUG_TO_UI: Record<string, string> = {
  room: "룸",
  karaoke: "노래",
  tenpro: "텐쩜오",
  bar: "바",
  massage: "아로마",
  etc: "기타",
  all: "전체",
};

/**
 * buildSeoUrl(parent, sub, category)
 * Strategy:
 * 1. Default: /방송모델 (No filters)
 * 2. Parent only: /[Parent]-방송모델 (e.g., /서울-방송모델)
 * 3. Parent + Category: /[Parent]-[Category] (e.g., /서울-배우구인)
 * 4. Seoul + Sub + Category: /서울-[Sub]-[Category] (ONLY for Seoul)
 * 5. Category only: /[Category] (e.g., /배우구인)
 */
export function buildSeoUrl(
  parentSlug?: string | null,
  subSlug?: string | null, // multiple slugs possible if coming from filter UI, but we use only first
  categorySlug?: string | null
): string {
  const parts: string[] = [];

  const parentName = parentSlug ? REGION_SLUG_TO_SEO[parentSlug as keyof typeof REGION_SLUG_TO_SEO] : null;
  const categoryName = categorySlug ? CATEGORY_SLUG_TO_SEO[categorySlug as keyof typeof CATEGORY_SLUG_TO_SEO] : null;

  // 1. Handle Regions
  if (parentSlug !== 'all') {
    // Seoul is special: always include "서울"
    if (parentSlug === 'seoul') {
      parts.push("서울");
      if (subSlug) {
        const subName = subSlug.split('/')[0].trim().replace(/구$/, "").replace(/[^가-힣a-zA-Z0-9]/g, "");
        if (subName) parts.push(subName);
      }
    } else {
      // Non-seoul regions: if sub-region exists, use ONLY sub-region name. Otherwise use parent name.
      if (subSlug) {
        const subName = subSlug.split('/')[0].trim().replace(/[^가-힣a-zA-Z0-9]/g, "");
        if (subName) parts.push(subName);
      } else if (parentName) {
        parts.push(parentName);
      }
    }
  }

  // 2. Handle Category
  const finalCategory = categoryName || "방송모델";

  // Logic: /서울-강남-배우구인, /서울-방송모델, /인천-배우구인, /인천경기-방송모델, /배우구인
  if (finalCategory !== "방송모델") {
    parts.push(finalCategory);
  } else if (parts.length === 0) {
    parts.push("방송모델");
  } else if (!parts.includes("방송모델")) {
    // If no category selected, we want it to end with "방송모델" 
    // BUT only if it's the 2nd part for non-seoul or 3rd part for seoul
    parts.push("방송모델");
  }

  // Unique and Clean
  const uniqueParts = Array.from(new Set(parts));
  return `/${uniqueParts.join("-")}`;
}

/**
 * parseSeoUrl(slug)
 * Decodes SEO URL back to slugs for DB query.
 */
export function parseSeoUrl(path: string): { parent: string | null; sub: string | null; category: string | null } {
  const decoded = decodeURIComponent(path).normalize('NFC').replace(/^\//, "");
  if (decoded === '방송모델' || decoded === '') return { parent: null, sub: null, category: null };

  const parts = decoded.split("-").map(p => p.trim());

  let parent: string | null = null;
  let sub: string | null = null;
  let category: string | null = null;

  // 1. Identify Category (Usually last part if it contains '알바')
  const lastPart = parts[parts.length - 1];
  if (SEO_CATEGORY_TO_SLUG[lastPart]) {
    category = SEO_CATEGORY_TO_SLUG[lastPart];
  }

  // 2. Identify Regions
  if (parts[0] === '서울') {
    parent = 'seoul';
    if (parts.length === 3) {
      sub = parts[1]; // 서울-[강남]-배우구인
    } else if (parts.length === 2 && !category) {
      sub = parts[1]; // 서울-[강남] (No Category case)
    }
  } else if (SEO_TO_REGION_SLUG[parts[0]]) {
    // Exact Major Region match (e.g. 인천경기-방송모델)
    parent = SEO_TO_REGION_SLUG[parts[0]];
  } else if (parts.length >= 1 && !category) {
    // Likely a sub-region without category (e.g. 인천)
    sub = parts[0];
  } else if (parts.length >= 2 && category) {
    // Likely a sub-region with category (e.g. 인천-배우구인)
    sub = parts[0];
  }

  // Special case: Single category /[Category] (e.g., /배우구인)
  if (!parent && !sub && parts.length === 1) {
    if (SEO_CATEGORY_TO_SLUG[parts[0]]) {
      category = SEO_CATEGORY_TO_SLUG[parts[0]];
    }
  }

  return { parent, sub, category };
}

export function buildJobSeoUrl(job: any) {
  if (!job) return '/구인';
  
  // Clean title for URL slug
  const rawTitle = (job.title || "채용공고").replace(/<[^>]*>?/gm, ''); // Remove HTML
  const cleanTitle = rawTitle
    .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ') // Remove non-alphanumeric except spaces
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 30); // Max length for slug
    
  return `/구인/${encodeURIComponent(cleanTitle || "공고")}-${job.id}`;
}
