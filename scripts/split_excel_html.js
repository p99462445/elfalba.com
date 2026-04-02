const fs = require('fs');

async function processFile() {
    const inputFile = 'Member_original.xls';
    const outputFile = 'test_users_300.csv';

    // Read first 10MB which should be more than enough for 300 rows
    const buffer = Buffer.alloc(10 * 1024 * 1024);
    const fd = fs.openSync(inputFile, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 10 * 1024 * 1024, 0);
    fs.closeSync(fd);

    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer.slice(0, bytesRead));

    const cw = fs.createWriteStream(outputFile);

    const rows = content.split(/<tr/i);
    let count = 0;
    const max = 300;
    let headerSent = false;

    console.log('Total text length read:', content.length);
    console.log('Rows detected:', rows.length);

    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i];
        const cells = [];
        const tdRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;
        let match;
        while ((match = tdRegex.exec(rowData)) !== null) {
            let cell = match[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            cell = cell.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
            cells.push(cell);
        }

        if (cells.length > 0) {
            const csvLine = cells.map(cell => {
                let escaped = cell.replace(/"/g, '""');
                if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
                    return `"${escaped}"`;
                }
                return escaped;
            }).join(',');

            if (!headerSent) {
                cw.write(csvLine + '\n');
                headerSent = true;
                console.log('Header written.');
            } else if (count < max) {
                cw.write(csvLine + '\n');
                count++;
            } else {
                break;
            }
        }
    }

    cw.end();
    console.log(`Successfully extracted ${count} data rows to ${outputFile}`);
}

processFile().catch(console.error);
