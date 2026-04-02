export const MOCK_JOBS = [
  {
    id: '1',
    title: '명품 브랜드 룩북 촬영 모델 모집',
    pay_info: '일급 50만원',
    working_hours: '10:00 ~ 18:00',
    address: '서울 강남구',
    created_at: new Date().toISOString(),
    last_jumped_at: new Date().toISOString(),
    employer: { business_name: '(주)엘프패션', nickname: '캐스팅매니저' },
    region: { name: '서울 강남' },
    category: { name: '패션/잡지' },
    images: [{ image_url: 'https://images.unsplash.com/photo-1539109132382-381bb3f0c2f3?q=80&w=500' }],
    status: 'ACTIVE'
  },
  {
    id: '2',
    title: '웹드라마 주조연 및 단역 배우 공고',
    pay_info: '회차당 30~100만원',
    working_hours: '스케줄 협의',
    address: '서울 마포구 상암동',
    created_at: new Date().toISOString(),
    last_jumped_at: new Date().toISOString(),
    employer: { business_name: '엘프엔터테인먼트', nickname: '감독님' },
    region: { name: '서울 마포' },
    category: { name: '드라마/영화' },
    images: [{ image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=500' }],
    status: 'ACTIVE'
  },
  {
    id: '3',
    title: '화장품 브랜드 SNS 광고 영상 촬영',
    pay_info: '4시간 40만원',
    working_hours: '오전 09:00 시작',
    address: '경기 성남시 판교',
    created_at: new Date().toISOString(),
    last_jumped_at: new Date().toISOString(),
    employer: { business_name: '뷰티엘프', nickname: '마케팅팀' },
    region: { name: '경기 성남' },
    category: { name: '광고/CF' },
    images: [{ image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500' }],
    status: 'ACTIVE'
  },
  {
    id: '4',
    title: '유튜브 채널 브이로그 패널 모집',
    pay_info: '일급 20만원',
    working_hours: '격주 촬영',
    address: '서울 영등포구',
    created_at: new Date().toISOString(),
    last_jumped_at: new Date().toISOString(),
    employer: { business_name: '엘프미디어', nickname: 'PD님' },
    region: { name: '서울 영등포' },
    category: { name: '유튜브/방송' },
    images: [{ image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500' }],
    status: 'ACTIVE'
  }
];

export const MOCK_NOTICES = [
  { id: '1', title: '엘프알바 그랜드 오픈 이벤트 안내', created_at: new Date().toISOString(), is_important: true },
  { id: '2', title: '허위 구인 공고 주의 안내', created_at: new Date().toISOString(), is_important: false },
  { id: '3', title: '모델/배우 프로필 등록 가이드', created_at: new Date().toISOString(), is_important: false }
];
