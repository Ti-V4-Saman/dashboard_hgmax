const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Replace the dependency array
content = content.replace(
  `}, [dateRange, dateFilterType]);`,
  `}, [dateRange, dateFilterType, platform]);`
);

// Add platform to all API fetches inside that useEffect
content = content.replace(
  /\?startDate=\$\{start\}&endDate=\$\{end\}&dateFilterType=\$\{dateFilterType\}/g,
  `?startDate=\${start}&endDate=\${end}&dateFilterType=\${dateFilterType}&platform=\${platform}`
);

fs.writeFileSync('app/page.tsx', content);
console.log('Fixed page.tsx API fetches to include platform.');
