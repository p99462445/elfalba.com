import crypto from 'crypto';

/**
 * KG 이니시스 연동 유틸리티
 */

const NEXT_PUBLIC_INICIS_MID = process.env.NEXT_PUBLIC_INICIS_MID || 'INIpayTest';
const INICIS_SIGNKEY = process.env.INICIS_SIGNKEY || 'SU5JTElURV9UUklQTEVERVNfS0VZU1RS';

/**
 * 결제 요청용 Signature 생성 (Step 1)
 * 대상: oid, price, timestamp
 */
export function generateSignature(oid: string, price: string, timestamp: string) {
    const data = `oid=${oid}&price=${price}&timestamp=${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 결제 검증용 Verification 생성 (Step 1)
 * 대상: oid, price, signKey, timestamp
 */
export function generateVerification(oid: string, price: string, timestamp: string) {
    const data = `oid=${oid}&price=${price}&signKey=${INICIS_SIGNKEY}&timestamp=${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * mKey 생성 (대상: mid와 매칭되는 signkey)
 */
export function generateMKey() {
    return crypto.createHash('sha256').update(INICIS_SIGNKEY).digest('hex');
}

/**
 * 승인 요청용 Signature 생성 (Step 3)
 * 대상: authToken, timestamp
 */
export function generateAuthSignature(authToken: string, timestamp: string) {
    const data = `authToken=${authToken}&timestamp=${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 승인 요청용 Verification 생성 (Step 3)
 * 대상: authToken, signKey, timestamp
 */
export function generateAuthVerification(authToken: string, timestamp: string) {
    const data = `authToken=${authToken}&signKey=${INICIS_SIGNKEY}&timestamp=${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * IDC 이름에 따른 승인 URL 반환
 */
export function getAuthUrl(idc_name: string) {
    const baseUrl = "stdpay.inicis.com/api/payAuth";
    switch (idc_name) {
        case 'fc': return `https://fc${baseUrl}`;
        case 'ks': return `https://ks${baseUrl}`;
        case 'stg': return `https://stg${baseUrl}`;
        default: return `https://stg${baseUrl}`; // 기본은 스테이징
    }
}
