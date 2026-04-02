const fs = require('fs');

function decodeCP949(buffer) {
    // Basic fallback if TextDecoder('euc-kr') is not available
    try {
        return new TextDecoder('euc-kr').decode(buffer);
    } catch (e) {
        return buffer.toString('binary');
    }
}

async function debug() {
    const buf = fs.readFileSync('Member_original.xls');
    const content = decodeCP949(buf);

    console.log('Total content length:', content.length);

    const rows = content.split(/<tr/i);
    console.log('Possible rows found:', rows.length);

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
        console.log(`ROW ${i} START:`, rows[i].substring(0, 100).replace(/\n/g, ' '));
        // Find cells
        const cells = rows[i].match(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi);
        console.log(`ROW ${i} CELLS:`, cells ? cells.length : 0);
    }
}

debug();
