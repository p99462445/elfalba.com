import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { businessNumber } = body

        if (!businessNumber || businessNumber.length !== 10) {
            return NextResponse.json({ isValid: false, message: '잘못된 사업자 번호입니다.' }, { status: 400 })
        }

        const DECODED_API_KEY = "2210f40a65673070990f3a41c077917220c1b04bafbbccde95c6d9c131ced79e"

        // 공공데이터포털 URL (상태조회)
        const URL = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${DECODED_API_KEY}`

        const requestBody = {
            b_no: [businessNumber]
        }

        const externalRes = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })

        if (!externalRes.ok) {
            const errText = await externalRes.text()
            console.error("NTS API Error:", externalRes.status, errText)
            return NextResponse.json({ isValid: false, message: '국세청 서버 통신 오류' }, { status: 500 })
        }

        const data = await externalRes.json()
        console.log("NTS API Response:", JSON.stringify(data)); // for debugging

        // 응답 데이터 구조 확인 (가이드 기준: data.data[0].b_stt_cd 가 상태코드)
        if (data && data.data && data.data.length > 0) {
            const sttCd = data.data[0].b_stt_cd || ""; // "01": 계속사업자, "02": 휴업자, "03": 폐업자
            const taxType = data.data[0].tax_type || ""; // 조회가 안 되는 경우 등에 대한 정보 

            if (sttCd === "01") {
                return NextResponse.json({ isValid: true, message: '정상 사업자입니다.' })
            } else if (sttCd === "02") {
                return NextResponse.json({ isValid: false, message: '휴업 상태인 사업자입니다.' })
            } else if (sttCd === "03") {
                return NextResponse.json({ isValid: false, message: '폐업 상태인 사업자입니다.' })
            } else if (taxType && taxType.includes("국세청에 등록되지 않은")) {
                return NextResponse.json({ isValid: false, message: '국세청에 등록되지 않은 사업자등록번호입니다.' })
            } else {
                return NextResponse.json({ isValid: false, message: '상태를 확인할 수 없는 사업자입니다.' })
            }
        } else if (data && data.status_code === "OK") {
            return NextResponse.json({ isValid: false, message: '조회 결과가 없습니다.' })
        }

        return NextResponse.json({ isValid: false, message: data.message || '조회 중 오류 발생' })

    } catch (error: any) {
        console.error('Verify Business Error:', error)
        return NextResponse.json({ isValid: false, message: '서버 내부 오류: ' + (error.message || 'unknown error') }, { status: 500 })
    }
}
