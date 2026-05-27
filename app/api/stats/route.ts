import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { subDays, differenceInDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const dateFilterType = searchParams.get('dateFilterType') || 'movimentacao';
  const crmDateCol = dateFilterType === 'criacao' ? 'data_criacao' : 'data_movimentacao';

  if (!startDateStr || !endDateStr) {
    return NextResponse.json({ error: 'Missing dates' }, { status: 400 });
  }

  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const daysDiff = differenceInDays(end, start) + 1;

    const prevStart = subDays(start, daysDiff);
    const prevEnd = subDays(end, daysDiff);

    const prevStartStr = format(prevStart, 'yyyy-MM-dd');
    const prevEndStr = format(prevEnd, 'yyyy-MM-dd');

    const fetchPeriodStats = async (s: string, e: string) => {
      const googleAdsQuery = `SELECT SUM(valor_gasto) as total FROM bd_google_ads WHERE data BETWEEN ? AND ?`;
      const metaAdsQuery = `SELECT SUM(valor_gasto) as total FROM bd_meta_ads WHERE data BETWEEN ? AND ?`;
      
      // Funnel and CRM queries
      const crmSummaryQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'Ganho' THEN 1 END) as vendasConcluidas,
          COUNT(CASE WHEN status = 'Ganho' AND funil = 'Comercial' THEN 1 END) as vendasComercial,
          SUM(CASE WHEN status = 'Ganho' THEN CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2)) ELSE 0 END) as faturamentoBruto,
          COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leads,
          COUNT(CASE WHEN etapa = 'Para Venda' THEN 1 END) as leadsQualificados,
          COUNT(CASE WHEN etapa LIKE '%Em negociação%' THEN 1 END) as oportunidades,
          COUNT(CASE WHEN status = 'Perdido' THEN 1 END) as perdidos,
          AVG(CASE WHEN status = 'Ganho' THEN DATEDIFF(data_movimentacao, data_criacao) END) as tempoMedio
        FROM dados_crm 
        WHERE ${crmDateCol} BETWEEN ? AND ?
      `;

      const [googleRes, metaRes, crmRes] = await Promise.all([
        query(googleAdsQuery, [s, e]),
        query(metaAdsQuery, [s, e]),
        query(crmSummaryQuery, [`${s} 00:00:00`, `${e} 23:59:59`])
      ]);

      const crm = (crmRes as any)[0];

      return {
        totalInvestimento: (Number((googleRes as any)[0]?.total) || 0) + (Number((metaRes as any)[0]?.total) || 0),
        vendasConcluidas: Number(crm?.vendasConcluidas) || 0,
        faturamentoBruto: Number(crm?.faturamentoBruto) || 0,
        funnel: {
          leads: Number(crm?.leads) || 0,
          leadsQualificados: Number(crm?.leadsQualificados) || 0,
          oportunidades: Number(crm?.oportunidades) || 0,
          vendas: Number(crm?.vendasConcluidas) || 0,
          vendasComercial: Number(crm?.vendasComercial) || 0,
          perdidos: Number(crm?.perdidos) || 0,
          tempoMedio: Number(crm?.tempoMedio) || 0
        }
      };
    };


    const fetchDailyStats = async (s: string, e: string) => {
      const adsDailyQuery = `
        SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, SUM(spent) as spent FROM (
          SELECT data as date, SUM(valor_gasto) as spent FROM bd_google_ads WHERE data BETWEEN ? AND ? GROUP BY data
          UNION ALL
          SELECT data as date, SUM(valor_gasto) as spent FROM bd_meta_ads WHERE data BETWEEN ? AND ? GROUP BY data
        ) as combined
        GROUP BY date
        ORDER BY date ASC
      `;

      const crmDailyQuery = `
        SELECT 
          DATE_FORMAT(${crmDateCol}, '%Y-%m-%d') as date,
          COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leads,
          COUNT(CASE WHEN etapa = 'Para Venda' THEN 1 END) as mql,
          COUNT(CASE WHEN etapa LIKE '%Em negociação%' THEN 1 END) as opportunity,
          COUNT(CASE WHEN status = 'Ganho' THEN 1 END) as sales,
          SUM(CASE WHEN status = 'Ganho' THEN CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2)) ELSE 0 END) as faturamento,
          COUNT(CASE WHEN status = 'Perdido' THEN 1 END) as lost
        FROM dados_crm
        WHERE ${crmDateCol} BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(${crmDateCol}, '%Y-%m-%d')
        ORDER BY date ASC
      `;

      const [adsRes, crmRes] = await Promise.all([
        query(adsDailyQuery, [s, e, s, e]),
        query(crmDailyQuery, [`${s} 00:00:00`, `${e} 23:59:59`])
      ]);

      const mergedMap: Record<string, any> = {};

      (adsRes as any[]).forEach(row => {
        const d = row.date;
        mergedMap[d] = { date: d, spent: Number(row.spent) || 0, leads: 0, mql: 0, opportunity: 0, sales: 0, faturamento: 0, lost: 0 };
      });

      (crmRes as any[]).forEach(row => {
        const d = row.date;
        if (!mergedMap[d]) {
          mergedMap[d] = { date: d, spent: 0, leads: 0, mql: 0, opportunity: 0, sales: 0, faturamento: 0, lost: 0 };
        }
        mergedMap[d].leads = Number(row.leads) || 0;
        mergedMap[d].mql = Number(row.mql) || 0;
        mergedMap[d].opportunity = Number(row.opportunity) || 0;
        mergedMap[d].sales = Number(row.sales) || 0;
        mergedMap[d].faturamento = Number(row.faturamento) || 0;
        mergedMap[d].lost = Number(row.lost) || 0;
      });

      return Object.values(mergedMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
    };

    const [current, previous, daily] = await Promise.all([
      fetchPeriodStats(startDateStr, endDateStr),
      fetchPeriodStats(prevStartStr, prevEndStr),
      fetchDailyStats(startDateStr, endDateStr)
    ]);

    return NextResponse.json({
      current,
      previous,
      daily
    });

  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

