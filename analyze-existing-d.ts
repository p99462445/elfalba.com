import * as XLSX from 'xlsx';

function analyze() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['마감일남은공고목록'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    const values = new Set();
    for (let i = 1; i < data.length; i++) {
        if (data[i]) values.add(data[i][3]);
    }
    console.log(`Unique values in Existing DB Column D:`, Array.from(values));
}

analyze();
