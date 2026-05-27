import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mergeData(adsRows: any[], crmRows: any[]): any[] {
  const map: Record<string, any> = {};

  for (const row of adsRows) {
    if (!row.name || row.name.trim() === '') continue;
    const key = `${row.name}|${row.platform}`;
    if (!map[key]) map[key] = { name: row.name, platform: row.platform, spent: 0, leads: 0, oportunidade: 0, venda: 0, faturamento: 0 };
    map[key].spent += Number(row.spent) || 0;
    map[key].leads += Number(row.leads) || 0;
  }

  for (const row of crmRows) {
    if (!row.name || row.name.trim() === '') continue;
    const key = `${row.name}|${row.platform}`;
    if (!map[key]) map[key] = { name: row.name, platform: row.platform, spent: 0, leads: 0, oportunidade: 0, venda: 0, faturamento: 0 };
    map[key].oportunidade += Number(row.oportunidade) || 0;
    map[key].venda += Number(row.venda) || 0;
    map[key].faturamento += Number(row.faturamento) || 0;
  }

  return Object.values(map);
}

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

    const platformCase = `
      CASE WHEN LOWER(source) LIKE '%google%' THEN 'google'
           WHEN LOWER(source) LIKE '%meta%' OR LOWER(source) LIKE '%facebook%' OR LOWER(source) LIKE '%instagram%' THEN 'meta'
           ELSE 'other' END
    `;

    // ===== CAMPAIGN =====
    const campAds = await query(`
      SELECT campanha as name, 'google' as platform, COALESCE(SUM(valor_gasto),0) as spent, COALESCE(SUM(conversoes),0) as leads
      FROM bd_google_ads WHERE data BETWEEN ? AND ? AND campanha IS NOT NULL AND campanha != '' GROUP BY campanha
      UNION ALL
      SELECT campanha as name, 'meta' as platform, COALESCE(SUM(valor_gasto),0) as spent, COALESCE(SUM(leads),0) as leads
      FROM bd_meta_ads WHERE data BETWEEN ? AND ? AND campanha IS NOT NULL AND campanha != '' GROUP BY campanha
    `, [startDate, endDate, startDate, endDate]);

    const campCrm = await query(`
      SELECT campanha as name, ${platformCase} as platform,
        COUNT(CASE WHEN etapa = 'Para Venda' THEN 1 END) as oportunidade,
        COUNT(CASE WHEN status = 'Ganho' THEN 1 END) as venda,
        COALESCE(SUM(CASE WHEN status = 'Ganho' THEN CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) as faturamento
      FROM dados_crm WHERE ${crmDateCol} BETWEEN ? AND ? AND campanha IS NOT NULL AND campanha != ''
      GROUP BY campanha, platform
    `, [crmStart, crmEnd]);

    // ===== AD =====
    const adMetaAds = await query(`
      SELECT anuncio as name, 'meta' as platform, COALESCE(SUM(valor_gasto),0) as spent, COALESCE(SUM(leads),0) as leads
      FROM bd_meta_ads WHERE data BETWEEN ? AND ? AND anuncio IS NOT NULL AND anuncio != '' GROUP BY anuncio
    `, [startDate, endDate]);

    const adGoogleCrm = await query(`
      SELECT anuncio as name, 'google' as platform,
        COALESCE(SUM(CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2))),0) as spent,
        COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leads
      FROM dados_crm WHERE LOWER(source) LIKE '%google%' AND data_criacao BETWEEN ? AND ? AND anuncio IS NOT NULL AND anuncio != ''
      GROUP BY anuncio
    `, [crmStart, crmEnd]);

    const adCrm = await query(`
      SELECT anuncio as name, ${platformCase} as platform,
        COUNT(CASE WHEN etapa = 'Para Venda' THEN 1 END) as oportunidade,
        COUNT(CASE WHEN status = 'Ganho' THEN 1 END) as venda,
        COALESCE(SUM(CASE WHEN status = 'Ganho' THEN CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) as faturamento
      FROM dados_crm WHERE ${crmDateCol} BETWEEN ? AND ? AND anuncio IS NOT NULL AND anuncio != ''
      GROUP BY anuncio, platform
    `, [crmStart, crmEnd]);

    // ===== KEYWORD =====
    const kwData = await query(`
      SELECT \`palavra-chave\` as name, 'google' as platform,
        COALESCE(SUM(CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2))),0) as spent,
        COUNT(CASE WHEN etapa = 'Entrada' THEN 1 END) as leads,
        COUNT(CASE WHEN etapa = 'Para Venda' THEN 1 END) as oportunidade,
        COUNT(CASE WHEN status = 'Ganho' THEN 1 END) as venda,
        COALESCE(SUM(CASE WHEN status = 'Ganho' THEN CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) as faturamento
      FROM dados_crm WHERE LOWER(source) LIKE '%google%' AND data_criacao BETWEEN ? AND ? AND \`palavra-chave\` IS NOT NULL AND \`palavra-chave\` != ''
      GROUP BY \`palavra-chave\`
    `, [crmStart, crmEnd]);

    return NextResponse.json({
      campaign: mergeData(campAds as any[], campCrm as any[]),
      ad: mergeData([...(adMetaAds as any[]), ...(adGoogleCrm as any[])], adCrm as any[]),
      keyword: (kwData as any[]).map(r => ({
        name: r.name, platform: r.platform,
        spent: Number(r.spent) || 0, leads: Number(r.leads) || 0,
        oportunidade: Number(r.oportunidade) || 0, venda: Number(r.venda) || 0,
        faturamento: Number(r.faturamento) || 0
      }))
    });

  } catch (error: any) {
    console.error('Ads performance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
