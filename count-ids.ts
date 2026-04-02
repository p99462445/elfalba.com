import * as XLSX from 'xlsx';

function count() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['마감일남은공고목록'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    let withId = 0, noId = 0;
    for (let i = 1; i < data.length; i++) {
        if (!data[i]) continue;
        if (data[i][1]) withId++;
        else noId++;
    }
    console.log(`기존악녀DB: targetId 있음=${withId}, 없음=${noId}`);
}

count();
