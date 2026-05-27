const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf8');

// Update DynamicCharts invocation
content = content.replace(
  `realDailyData={realStats.daily}`,
  `realDailyData={realStats.daily}\n                dateFilterType={dateFilterType}`
);

// Update DynamicCharts definition
content = content.replace(
  `const DynamicCharts = ({ adsData, crmData, range, goalMap, realDailyData = [] }) => {`,
  `const DynamicCharts = ({ adsData, crmData, range, goalMap, realDailyData = [], dateFilterType = 'movimentacao' }) => {`
);

// Update DynamicCharts internal filter
content = content.replace(
  `const dayCrm = crmData.fullFilteredCrm.filter(d => d.dataMovimentacao.startsWith(dateStr));`,
  `const dayCrm = crmData.fullFilteredCrm.filter(d => {
        const dDate = dateFilterType === 'criacao' ? d.dataCriacao : d.dataMovimentacao;
        return dDate.startsWith(dateStr);
      });`
);

// Update DynamicCharts dependency array for processedData
content = content.replace(
  `}, [adsData, crmData, range, metric, grouping, totalGoal, realDailyData]);`,
  `}, [adsData, crmData, range, metric, grouping, totalGoal, realDailyData, dateFilterType]);`
);

fs.writeFileSync('app/page.tsx', content);
console.log('Fixed DynamicCharts successfully.');
