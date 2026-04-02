import * as XLSX from 'xlsx';

function peek() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['마감일남은공고목록'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    for (let i = 1; i < 10; i++) {
        console.log(`Row ${i}: [I] = ${data[i][8]}`);
    }
}

peek();
