const fs = require('fs');

async function repair() {
    const inputFile = 'Member_original.xls';
    const outputFile = 'test_users_final_fixed.csv';

    // 1. Read as Buffer
    const buf = fs.readFileSync(inputFile);

    // 2. Based on hex analysis (ed8ca9ec8aa4), it IS proper UTF-8.
    // 3. Just need to parse it cleanly.
    const content = buf.toString('utf8');

    const rows = content.split(/<tr/i);
    let count = 0;
    const max = 301;

    const csvStream = fs.createWriteStream(outputFile);
    csvStream.write('\ufeff'); // UTF-8 BOM

    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i];
        const cells = [];
        const tdRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;
        let match;

        while ((match = tdRegex.exec(rowData)) !== null) {
            let cell = match[1]
                .replace(/<[^>]*>/g, '') // Remove <b>, etc.
                .replace(/&nbsp;/g, ' ')
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&')
                .trim();
            cells.push(cell);
        }

        if (cells.length > 0) {
            const csvLine = cells.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
            csvStream.write(csvLine + '\n');

            if (count === 0) console.log('Parsed Header:', cells.slice(0, 10).join(' | '));
            count++;
            if (count >= max) break;
        }
    }

    csvStream.end();
    console.log(`\n✅ Success! [${outputFile}] created.`);
}

repair();
