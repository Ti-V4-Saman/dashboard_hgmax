const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const injectionTarget = `  const [datePreset, setDatePreset] = useState('30');`;

const newHandler = `  const [datePreset, setDatePreset] = useState('30');

  const handleRangeChange = (id, custom) => {
    if (id === 'custom') {
      setDateRange(custom);
      setDatePreset('custom');
      return;
    }
    const now = new Date();
    let f = dateRange.from;
    let t = dateRange.to;
    switch (id) {
      case 'today': f = now; t = now; break;
      case 'yesterday': f = subDays(now, 1); t = subDays(now, 1); break;
      case '7': f = subDays(now, 7); t = now; break;
      case '15': f = subDays(now, 15); t = now; break;
      case '30': f = subDays(now, 30); t = now; break;
      case 'mtd': f = startOfMonth(now); t = endOfMonth(now); break;
      case 'lastMonth': {
        const prev = subMonths(now, 1);
        f = startOfMonth(prev); t = endOfMonth(prev); break;
      }
      case 'ytd': f = startOfYear(now); t = endOfYear(now); break;
      case 'lastYear': {
        const prevY = subYears(now, 1);
        f = startOfYear(prevY); t = endOfYear(prevY); break;
      }
    }
    setDateRange({ from: startOfDay(f), to: endOfDay(t) });
    setDatePreset(id);
  };`;

content = content.replace(injectionTarget, newHandler);
fs.writeFileSync('app/page.tsx', content);
console.log('Injected handleRangeChange successfully.');
