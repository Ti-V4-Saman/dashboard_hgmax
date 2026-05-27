const fs = require('fs');

const content = fs.readFileSync('app/page.tsx', 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('const CommercialAnalysis = ({'));
const endIdx = lines.findIndex(l => l.includes('const DynamicCharts = ({'));

if (startIdx !== -1 && endIdx !== -1) {
    const cleanJSX = `const CommercialAnalysis = ({ adsData, crmData, realCommercialData }) => {
  const [activeAssetView, setActiveAssetView] = useState('campaign');
  const [sortConfig, setSortConfig] = useState({ field: 'leadsIn', order: 'desc' });
  const [performanceView, setPerformanceView] = useState('responsavel'); // 'responsavel' ou 'unidade'
  const [selectedReason, setSelectedReason] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const performanceData = useMemo(() => {
    // Use real data when available
    if (realCommercialData) {
      const key = performanceView === 'responsavel' ? 'vendedor' : 'regiao';
      const realRows = realCommercialData[key];
      if (realRows && realRows.length > 0) return realRows;
    }

    // Fallback mock
    const groups = {};
    const field = performanceView;
    crmData.forEach(d => {
      const key = d[field] || 'Geral';
      if (!groups[key]) groups[key] = { name: key, leads: new Set(), vendas: 0, faturamento: 0 };
      groups[key].leads.add(d.idLead);
      if (d.etapa === 'Ganho') {
        groups[key].vendas++;
        groups[key].faturamento += 100;
      }
    });
    return Object.values(groups).map(g => ({
      ...g,
      leads: g.leads.size,
      ticket: g.vendas > 0 ? g.faturamento / g.vendas : 0,
      efetividade: g.leads.size > 0 ? (g.vendas / g.leads.size) * 100 : 0
    })).sort((a, b) => b.faturamento - a.faturamento);
  }, [crmData, performanceView, realCommercialData]);

  const lossReasonsData = useMemo(() => {
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
  }, [crmData, selectedAsset, activeAssetView]);

  const lossesByStage = useMemo(() => {
    const stagesOrder = ["Novos Leads", "Contato Efetivo", "Agendamento", "Compareceu ao Test Training"];
    return stagesOrder.map(s => ({ stage: s, lost: Math.floor(Math.random() * 40) + 10 }));
  }, []);

  const assetLossData = useMemo(() => {
    if (realCommercialData?.quality) {
      const realData = realCommercialData.quality[activeAssetView] || [];
      return [...realData].sort((a, b) => { 
        const f = sortConfig.field; 
        const o = sortConfig.order === 'desc' ? -1 : 1; 
        return (a[f] || 0) < (b[f] || 0) ? o : -o; 
      });
    }

    const groups = {};
    const field = activeAssetView;
    
    adsData.forEach(item => { 
      const key = item[field] || 'Geral'; 
      if (!groups[key]) groups[key] = { name: key, leadsIn: 0, lostCount: 0, closingTimes: [] }; 
      groups[key].leadsIn += item.leads; 
    });

    crmData.forEach(d => { 
      const key = d[field === 'ad' ? 'ad' : field] || 'Geral'; 
      if (groups[key]) {
        const matchReason = !selectedReason || d.motivoPerda === selectedReason;
        if (d.etapa === 'Perdido' && matchReason) groups[key].lostCount++;
      }
    });

    return Object.values(groups).map(asset => ({ 
      ...asset, 
      lossPct: asset.leadsIn > 0 ? (asset.lostCount / asset.leadsIn) * 100 : 0
    })).sort((a, b) => { 
      const f = sortConfig.field; 
      const o = sortConfig.order === 'desc' ? -1 : 1; 
      return (a[f] || 0) < (b[f] || 0) ? o : -o; 
    });
  }, [adsData, crmData, activeAssetView, sortConfig, selectedReason, realCommercialData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-medium text-slate-900 text-lg uppercase tracking-tight">Performance de Vendas</h3>
            <p className="text-xs text-slate-400">Resultados e eficiência por vendedor ou região</p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button onClick={() => setPerformanceView('responsavel')} className={\`px-4 py-1.5 text-[10px] font-medium rounded-md transition-all uppercase flex items-center gap-2 \${performanceView === 'responsavel' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}\`}>
              <User size={12}/> Vendedor
            </button>
            <button onClick={() => setPerformanceView('unidade')} className={\`px-4 py-1.5 text-[10px] font-medium rounded-md transition-all uppercase flex items-center gap-2 \${performanceView === 'unidade' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}\`}>
              <MapPin size={12}/> Região
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white text-slate-400 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">{performanceView === 'responsavel' ? 'Vendedor' : 'Região'}</th>
                <th className="px-4 py-4 text-center">Leads</th>
                <th className="px-4 py-4 text-center">Vendas</th>
                <th className="px-4 py-4 text-right">Faturamento</th>
                <th className="px-4 py-4 text-right">Ticket</th>
                <th className="px-6 py-4 text-center">Efetividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {performanceData.map((row, i) => (
                <tr key={i} className="bg-white hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-900 font-medium">{row.name}</td>
                  <td className="px-4 py-4 text-center text-slate-600">{row.leads}</td>
                  <td className="px-4 py-4 text-center text-slate-600 font-medium">{row.vendas}</td>
                  <td className="px-4 py-4 text-right text-slate-600">{row.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-medium border border-indigo-100">
                      {row.efetividade.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><h3 className="font-medium text-slate-900 text-lg uppercase tracking-tight flex items-center gap-2">Análise de Qualidade</h3></div>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            {['campaign', 'ad', 'platform'].map(v => (
              <button key={v} onClick={() => { setActiveAssetView(v); setSelectedAsset(null); }} className={\`px-4 py-1.5 text-[10px] font-medium rounded-md transition-all uppercase tracking-tighter \${activeAssetView === v ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}\`}>
                {v === 'campaign' ? 'Campanha' : v === 'ad' ? 'Anúncio' : 'Rede'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white text-slate-400 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => setSortConfig({ field: 'name', order: sortConfig.field === 'name' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center gap-2">Ativo <ArrowUpDown size={10}/></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => setSortConfig({ field: 'leadsIn', order: sortConfig.field === 'leadsIn' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center justify-center gap-2">Entradas <ArrowUpDown size={10}/></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:text-slate-900 transition-colors text-rose-600" onClick={() => setSortConfig({ field: 'lostCount', order: sortConfig.field === 'lostCount' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center justify-center gap-2">Perdas <ArrowUpDown size={10}/></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => setSortConfig({ field: 'lossPct', order: sortConfig.field === 'lossPct' && sortConfig.order === 'desc' ? 'asc' : 'desc' })}>
                  <div className="flex items-center justify-center gap-2">% Perda <ArrowUpDown size={10}/></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assetLossData.map((asset, i) => (
                <tr key={i} onClick={() => setSelectedAsset(selectedAsset === asset.name ? null : asset.name)} className={\`cursor-pointer \${selectedAsset === asset.name ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'}\`}>
                  <td className="px-6 py-4 font-medium text-slate-900">{asset.name}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{asset.leadsIn.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-medium text-rose-600">{asset.lostCount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-slate-400">{asset.lossPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center"><h3 className="font-medium text-slate-900 uppercase tracking-tight text-sm">Motivos de Perda</h3></div>
          <table className="w-full text-left text-[12px]">
            <thead className="text-slate-400 font-medium uppercase text-[9px] tracking-widest border-b border-slate-50">
              <tr><th className="px-6 py-3">Motivo</th><th className="px-6 py-3 text-center">QTD</th><th className="px-6 py-3 text-center">% TOTAL</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lossReasonsData.map((reason, i) => (
                <tr key={i} onClick={() => setSelectedReason(selectedReason === reason.name ? null : reason.name)} className={\`cursor-pointer \${selectedReason === reason.name ? 'bg-rose-50' : 'hover:bg-slate-50'}\`}>
                  <td className="px-6 py-4 text-slate-700">{reason.name}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-900">{reason.count}</td>
                  <td className="px-6 py-4 text-center text-slate-400">{reason.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6 border-slate-100 shadow-sm rounded-none">
          <h3 className="font-medium text-slate-900 uppercase tracking-tight text-sm mb-10">Perdas por Etapa</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lossesByStage} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={160} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="lost" radius={[0, 4, 4, 0]} barSize={18}>
                  <LabelList dataKey="lost" position="right" style={{ fontSize: '10px', fill: '#94a3b8' }} />
                  {lossesByStage.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={index === 0 ? '#cbd5e1' : '#f43f5e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
`;

    // Reconstruct the file correctly
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
