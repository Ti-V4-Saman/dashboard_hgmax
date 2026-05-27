const fs = require('fs');

const content = fs.readFileSync('app/page.tsx', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('const fetchRealStats = async () => {'));
const endIdx = lines.findIndex(l => l.includes('}, [dateRange]);')) + 1; // get the closing hook

if (startIdx !== -1 && endIdx !== -1) {
    const cleanJSX = `    const fetchRealStats = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(\`/api/stats?startDate=\${start}&endDate=\${end}&dateFilterType=\${dateFilterType}\`);
        const data = await res.json();
        if (data.current) {
          setRealStats(data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados reais:", error);
      }
    };
    fetchRealStats();

    const fetchAdsDaily = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(\`/api/ads-daily?startDate=\${start}&endDate=\${end}&dateFilterType=\${dateFilterType}\`);
        const data = await res.json();
        if (!data.error) setRealAdsDaily(data);
      } catch (error) {
        console.error("Erro ao buscar dados de ads:", error);
      }
    };
    fetchAdsDaily();

    const fetchPerfData = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(\`/api/ads-performance?startDate=\${start}&endDate=\${end}&dateFilterType=\${dateFilterType}\`);
        const data = await res.json();
        if (!data.error) setRealPerfData(data);
      } catch (error) {
        console.error("Erro ao buscar performance:", error);
      }
    };
    fetchPerfData();

    const fetchCommercialData = async () => {
      try {
        const start = format(dateRange.from, 'yyyy-MM-dd');
        const end = format(dateRange.to, 'yyyy-MM-dd');
        const res = await fetch(\`/api/commercial-performance?startDate=\${start}&endDate=\${end}&dateFilterType=\${dateFilterType}\`);
        const data = await res.json();
        if (!data.error) setRealCommercialData(data);
      } catch (error) {
        console.error("Erro ao buscar dados comerciais:", error);
      }
    };
    fetchCommercialData();
  }, [dateRange, dateFilterType]);`;

    const newLines = [
        ...lines.slice(0, startIdx),
        cleanJSX,
        ...lines.slice(endIdx)
    ];

    fs.writeFileSync('app/page.tsx', newLines.join('\n'));
    console.log('Fixed page.tsx hooks successfully.');
} else {
    console.log('Could not find boundaries.');
}
