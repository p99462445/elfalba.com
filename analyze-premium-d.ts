import * as XLSX from 'xlsx';

function analyze() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['job_output_data_20260323'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    const values = new Set();
    for (let i = 1; i < data.length; i++) {
        if (data[i]) values.add(data[i][3]);
    }
    console.log(`Unique values in Column D:`, Array.from(values));
}

analyze();
