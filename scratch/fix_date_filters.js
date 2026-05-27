const fs = require('fs');

function updateFile(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    
    // Add dateFilterType param
    if (!content.includes("const dateFilterType = searchParams.get('dateFilterType')")) {
        const replaceAnchor = "const endDateStr = searchParams.get('endDate');"; // stats
        const replaceAnchor2 = "const endDate = searchParams.get('endDate');"; // others
        
        let anchor = content.includes(replaceAnchor) ? replaceAnchor : replaceAnchor2;
        content = content.replace(anchor, `${anchor}\n  const dateFilterType = searchParams.get('dateFilterType') || 'movimentacao';\n  const crmDateCol = dateFilterType === 'criacao' ? 'data_criacao' : 'data_movimentacao';`);
    }

    // Replace hardcoded data_criacao with template literal
    content = content.replace(/WHERE data_criacao BETWEEN \? AND \?/g, "WHERE ${crmDateCol} BETWEEN ? AND ?");

    fs.writeFileSync(filename, content);
}

['app/api/stats/route.ts', 'app/api/commercial-performance/route.ts', 'app/api/ads-performance/route.ts'].forEach(file => {
    updateFile(file);
    console.log(`Updated ${file}`);
});
