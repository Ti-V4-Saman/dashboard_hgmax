const fs = require('fs');

const content = fs.readFileSync('app/page.tsx', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('const lossReasonsData = useMemo(() => {'));
const endIdx = lines.findIndex(l => l.includes('const assetLossData = useMemo(() => {'));

if (startIdx !== -1 && endIdx !== -1) {
    const cleanJSX = `  const lossReasonsData = useMemo(() => {
    if (realCommercialData?.quality?.lostAgg) {
      const reasons = {};
      const lostAgg = realCommercialData.quality.lostAgg;
      
      lostAgg.forEach(d => {
        const field = activeAssetView === 'ad' ? 'ad' : activeAssetView;
        const matchAsset = !selectedAsset || d[field] === selectedAsset;
        if (matchAsset) {
          const reason = d.motivoPerda || 'Não informado';
          reasons[reason] = (reasons[reason] || 0) + d.count;
        }
      });

      const total = Object.values(reasons).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(reasons).map(([name, count]) => ({
        name, count, percentage: ((count / total) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count);
    }

    const reasons = {};
    const lostRecords = crmData.filter(d => {
      const isLost = d.etapa === 'Perdido';
      const field = activeAssetView === 'ad' ? 'ad' : activeAssetView;
      const matchAsset = !selectedAsset || d[field] === selectedAsset;
      return isLost && matchAsset;
    });

    lostRecords.forEach(d => {
      const reason = d.motivoPerda || 'Não informado';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    const total = lostRecords.length || 1;
    return Object.entries(reasons).map(([name, count]) => ({
      name, count, percentage: ((count / total) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);
  }, [crmData, selectedAsset, activeAssetView, realCommercialData]);

  const lossesByStage = useMemo(() => {
    if (realCommercialData?.quality?.lostAgg) {
      const stages = {};
      const lostAgg = realCommercialData.quality.lostAgg;
      
      lostAgg.forEach(d => {
        const field = activeAssetView === 'ad' ? 'ad' : activeAssetView;
        const matchAsset = !selectedAsset || d[field] === selectedAsset;
        if (matchAsset) {
          const stage = d.etapa || 'Sem Etapa';
          stages[stage] = (stages[stage] || 0) + d.count;
        }
      });

      return Object.entries(stages)
        .map(([stage, lost]) => ({ stage, lost }))
        .sort((a, b) => b.lost - a.lost);
    }

    const stagesOrder = ["Novos Leads", "Contato Efetivo", "Agendamento", "Compareceu ao Test Training"];
    return stagesOrder.map(s => ({ stage: s, lost: Math.floor(Math.random() * 40) + 10 }));
  }, [realCommercialData, selectedAsset, activeAssetView]);

`;

    const newLines = [
        ...lines.slice(0, startIdx),
        cleanJSX,
        ...lines.slice(endIdx)
    ];

    fs.writeFileSync('app/page.tsx', newLines.join('\n'));
    console.log('Fixed successfully with absolute indices.');
} else {
    console.log('Could not find boundaries.');
}
