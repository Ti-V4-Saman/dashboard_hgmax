const fs = require('fs');
let content = fs.readFileSync('app/api/ads-daily/route.ts', 'utf8');

const anchor = `const endDate = searchParams.get('endDate');`;
if (content.includes(anchor) && !content.includes('dateFilterType')) {
    content = content.replace(anchor, `${anchor}\n  const dateFilterType = searchParams.get('dateFilterType') || 'movimentacao';\n  const crmDateCol = dateFilterType === 'criacao' ? 'data_criacao' : 'data_movimentacao';`);
}

content = content.replace(/DATE_FORMAT\(data_criacao,/g, `DATE_FORMAT(\${crmDateCol},`);
content = content.replace(/data_criacao BETWEEN/g, `\${crmDateCol} BETWEEN`);

fs.writeFileSync('app/api/ads-daily/route.ts', content);
console.log('Fixed ads-daily.');
