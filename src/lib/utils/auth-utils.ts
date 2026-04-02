/**
 * 본인인증 및 나이 계산 관련 유틸리티
 */

/**
 * 만 나이 계산 함수 (생일 기준)
 * @param birthDate 'YYYY-MM-DD' 또는 Date 객체
 * @returns 만 나이 (숫자)
 */
export function calculateManAge(birthDate: string | Date): number {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // 생일이 아직 안 지났으면 1살 차감
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * 성인 여부 확인 (만 19세 기준)
 * @param birthDate 'YYYY-MM-DD'
 * @returns 성인 여부
 */
export function isAdult(birthDate: string): boolean {
    const age = calculateManAge(birthDate);
    return age >= 19;
}

/**
 * 본인인증 데이터 검증 및 에러 체크
 * @param data 인증기관(포트원/KCP)에서 받은 원본 데이터
 * @returns { success: boolean, error?: string }
 */
export function validateVerificationData(data: {
    birthDate: string;
    ci: string;
    name: string;
}) {
    if (!data.ci) return { success: false, error: '식별키(CI)가 누락되었습니다.' };
    if (!isAdult(data.birthDate)) return { success: false, error: '만 19세 미만 미성년자는 가입할 수 없습니다.' };

    return { success: true };
}
