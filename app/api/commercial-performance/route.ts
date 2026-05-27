import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins',
  'BH': 'Belo Horizonte'
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const dateFilterType = searchParams.get('dateFilterType') || 'movimentacao';
  const crmDateCol = dateFilterType === 'criacao' ? 'data_criacao' : 'data_movimentacao';

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing dates' }, { status: 400 });
  }

  try {
    const crmStart = `${startDate} 00:00:00`;
    const crmEnd = `${endDate} 23:59:59`;

    // Helper: convert Brazilian varchar valor ('9.750,00') to numeric in SQL
    const valorToNum = `CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2))`;

    // By vendedor
    const vendedorData = await query(`
      SELECT 
        CASE WHEN vendedor = '90289' THEN 'Victor Duarte' ELSE vendedor END as name,
        COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leads,
        COUNT(CASE WHEN status = 'Ganho' THEN 1 END) as vendas,
        COALESCE(SUM(CASE WHEN status = 'Ganho' THEN ${valorToNum} ELSE 0 END), 0) as faturamento
      FROM dados_crm 
      WHERE ${crmDateCol} BETWEEN ? AND ?
        AND vendedor IS NOT NULL AND vendedor != ''
      GROUP BY name
      ORDER BY faturamento DESC
    `, [crmStart, crmEnd]);

    // By estado (region)
    const estadoData = await query(`
      SELECT 
        estado as sigla,
        COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leads,
        COUNT(CASE WHEN status = 'Ganho' THEN 1 END) as vendas,
        COALESCE(SUM(CASE WHEN status = 'Ganho' THEN ${valorToNum} ELSE 0 END), 0) as faturamento
      FROM dados_crm 
      WHERE ${crmDateCol} BETWEEN ? AND ?
        AND estado IS NOT NULL AND estado != ''
      GROUP BY estado
      ORDER BY faturamento DESC
    `, [crmStart, crmEnd]);

    const vendedor = (vendedorData as any[]).map(r => ({
      name: r.name,
      leads: Number(r.leads) || 0,
      vendas: Number(r.vendas) || 0,
      faturamento: Number(r.faturamento) || 0,
      ticket: Number(r.vendas) > 0 ? Number(r.faturamento) / Number(r.vendas) : 0,
      efetividade: Number(r.leads) > 0 ? (Number(r.vendas) / Number(r.leads)) * 100 : 0
    }));

    // Map states: known → full name, unknown → group as 'Outros'
    const regiaoMap: Record<string, any> = {};
    (estadoData as any[]).forEach(r => {
      const sigla = (r.sigla || '').trim().toUpperCase();
      const name = STATE_NAMES[sigla] || 'Outros';
      if (!regiaoMap[name]) regiaoMap[name] = { name, leads: 0, vendas: 0, faturamento: 0 };
      regiaoMap[name].leads += Number(r.leads) || 0;
      regiaoMap[name].vendas += Number(r.vendas) || 0;
      regiaoMap[name].faturamento += Number(r.faturamento) || 0;
    });
    const regiao = Object.values(regiaoMap).map((r: any) => ({
      ...r,
      ticket: r.vendas > 0 ? r.faturamento / r.vendas : 0,
      efetividade: r.leads > 0 ? (r.vendas / r.leads) * 100 : 0
    })).sort((a: any, b: any) => b.faturamento - a.faturamento);

    // Quality Analysis (Asset Loss Data)
    const qualityCampaignData = await query(`
      SELECT 
        campanha as name,
        COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leadsIn,
        COUNT(CASE WHEN status = 'Perdido' THEN 1 END) as lostCount
      FROM dados_crm
      WHERE ${crmDateCol} BETWEEN ? AND ?
        AND campanha IS NOT NULL AND campanha != '' AND campanha != 'Não definido'
      GROUP BY campanha
    `, [crmStart, crmEnd]);

    const qualityAdData = await query(`
      SELECT 
        anuncio as name,
        COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leadsIn,
        COUNT(CASE WHEN status = 'Perdido' THEN 1 END) as lostCount
      FROM dados_crm
      WHERE ${crmDateCol} BETWEEN ? AND ?
        AND anuncio IS NOT NULL AND anuncio != '' AND anuncio != 'Não definido'
      GROUP BY anuncio
    `, [crmStart, crmEnd]);

    const qualitySourceData = await query(`
      SELECT 
        CASE 
          WHEN LOWER(source) LIKE '%ig%' OR LOWER(source) LIKE '%fb%' OR LOWER(source) LIKE '%meta%' OR LOWER(source) LIKE '%instagram%' OR LOWER(source) LIKE '%facebook%' THEN 'Meta Ads'
          WHEN LOWER(source) LIKE '%google%' THEN 'Google Ads'
          WHEN source IS NULL OR source = '' OR source = 'Não definido' THEN 'Não rastreada'
          ELSE 'Outras'
        END as name,
        COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leadsIn,
        COUNT(CASE WHEN status = 'Perdido' THEN 1 END) as lostCount
      FROM dados_crm
      WHERE ${crmDateCol} BETWEEN ? AND ?
      GROUP BY name
    `, [crmStart, crmEnd]);

    const formatQuality = (data: any[]) => data.map(r => ({
      name: r.name,
      leadsIn: Number(r.leadsIn) || 0,
      lostCount: Number(r.lostCount) || 0,
      lossPct: Number(r.leadsIn) > 0 ? (Number(r.lostCount) / Number(r.leadsIn)) * 100 : 0
    })).sort((a, b) => b.lostCount - a.lostCount);

    const lostLeadsAggQuery = await query(`
      SELECT 
        campanha, 
        anuncio, 
        CASE 
          WHEN LOWER(source) LIKE '%ig%' OR LOWER(source) LIKE '%fb%' OR LOWER(source) LIKE '%meta%' OR LOWER(source) LIKE '%instagram%' OR LOWER(source) LIKE '%facebook%' THEN 'Meta Ads'
          WHEN LOWER(source) LIKE '%google%' THEN 'Google Ads'
          WHEN source IS NULL OR source = '' OR source = 'Não definido' THEN 'Não rastreada'
          ELSE 'Outras'
        END as source_mapped,
        COALESCE(NULLIF(etapa, ''), 'Sem Etapa') as etapa,
        COALESCE(NULLIF(motivo_perda, ''), 'Não informado') as motivo_perda,
        COUNT(*) as count
      FROM dados_crm
      WHERE status = 'Perdido' AND ${crmDateCol} BETWEEN ? AND ?
      GROUP BY campanha, anuncio, source_mapped, etapa, motivo_perda
    `, [crmStart, crmEnd]);

    const lostAgg = (lostLeadsAggQuery as any[]).map(r => ({
      campaign: r.campanha,
      ad: r.anuncio,
      platform: r.source_mapped,
      etapa: r.etapa,
      motivoPerda: r.motivo_perda,
      count: Number(r.count)
    }));

    const quality = {
      campaign: formatQuality(qualityCampaignData as any[]),
      ad: formatQuality(qualityAdData as any[]),
      platform: formatQuality(qualitySourceData as any[]),
      lostAgg
    };

    return NextResponse.json({ vendedor, regiao, quality });

  } catch (error: any) {
    console.error('Commercial performance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
