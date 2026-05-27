const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

const anchor = 'Performance de Vendas</h3>';
const startIdx = content.lastIndexOf('<Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">', content.indexOf(anchor));

const endAnchor = '<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">';
const endIdx = content.indexOf(endAnchor);

if (startIdx !== -1 && endIdx !== -1) {
    const newJSX = `      <Card className="border-slate-100 shadow-sm rounded-none overflow-hidden">
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
              <tr><th className="px-6 py-4">Ativo</th><th className="px-6 py-4 text-center">Entradas</th><th className="px-6 py-4 text-center text-rose-600">Perdas</th><th className="px-6 py-4 text-center">% Perda</th></tr>
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

      `;

    content = content.substring(0, startIdx) + newJSX + content.substring(endIdx);
    fs.writeFileSync('app/page.tsx', content);
    console.log('Fixed successfully with absolute indices.');
} else {
    console.log('Could not find boundaries.');
}
