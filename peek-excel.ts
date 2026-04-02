import * as XLSX from 'xlsx';

function peek(path: string) {
    console.log(`\n--- Peeking: ${path} ---`);
    try {
        const workbook = XLSX.readFile(path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log('Headers:', data[0]);
        console.log('Sample Row 1:', data[1]);
    } catch (e: any) {
        console.error(`Error reading ${path}:`, e.message);
    }
}

const jobsPath = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';
const membersPath = 'C:\\Users\\박근홍\\Desktop\\회원5만명DB.xlsx';

peek(jobsPath);
peek(membersPath);
