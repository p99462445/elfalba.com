import * as XLSX from 'xlsx';

function checkOverlaps() {
    const pPath = 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx';
    const pBook = XLSX.readFile(pPath);
    const pData: any[][] = XLSX.utils.sheet_to_json(pBook.Sheets['job_output_data_20260323'], { header: 1 });

    const generalNames = ["라인", "강남1등악녀알바", "CF", "의정부부킹노래방", "필", "유실장", "사랑실장", "100분20", "화이트", "어우동", "엔젤", "연예인", "하늘", "마동석", "홈X노래홀", "안산1등"];
    const pNames = pData.slice(1).map(row => row[2]); // Column C is biz_name

    const overlap = generalNames.filter(n => pNames.includes(n));
    console.log(`Overlap with Premium Ads:`, overlap);
}

checkOverlaps();
