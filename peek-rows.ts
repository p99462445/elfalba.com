import * as XLSX from 'xlsx';

const wb = XLSX.readFile('C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx');
const sheet = wb.Sheets['마감일남은공고목록'];
const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 0; i < 4; i++) {
    console.log(`\n--- [Excel Row ${i + 1}] ---`);
    const row = data[i] || [];
    row.forEach((cell, idx) => {
        const colLetter = XLSX.utils.encode_col(idx);
        console.log(`${colLetter}: ${cell}`);
    });
}
