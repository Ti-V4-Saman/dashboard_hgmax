const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('const lossReasonsData = useMemo(() => {'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('return (') && lines[i+1] && lines[i+1].includes('space-y-8') && lines[i+2] && lines[i+2].includes('Performance de Vendas'));

console.log('START:', startIndex);
console.log('END:', endIndex);
if (endIndex > -1) {
  console.log(lines[endIndex - 1]);
  console.log(lines[endIndex]);
  console.log(lines[endIndex + 1]);
}
