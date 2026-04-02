import * as XLSX from 'xlsx';

function count() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['마감일남은공고목록'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    const counts: Record<string, number> = {};
    for (let i = 1; i < data.length; i++) {
        if (!data[i]) continue;
        const val = data[i][3] || 'undefined';
        counts[val] = (counts[val] || 0) + 1;
    }
    console.log(`Counts for Existing DB Column D:`, counts);
}

count();
