import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
    const googleQuery = `
      SELECT 
        DATE_FORMAT(data, '%Y-%m-%d') as date,
        COALESCE(SUM(valor_gasto), 0) as spent,
        COALESCE(SUM(impressoes), 0) as impressions,
        COALESCE(SUM(clicks_no_link), 0) as clicks,
        COALESCE(SUM(conversoes), 0) as leads
      FROM bd_google_ads 
      WHERE data BETWEEN ? AND ?
      GROUP BY data
      ORDER BY data ASC
    `;

    const metaQuery = `
      SELECT 
        DATE_FORMAT(data, '%Y-%m-%d') as date,
        COALESCE(SUM(valor_gasto), 0) as spent,
        COALESCE(SUM(impressoes), 0) as impressions,
        COALESCE(SUM(clicks_no_link), 0) as clicks,
        COALESCE(SUM(leads), 0) as leads
      FROM bd_meta_ads 
      WHERE data BETWEEN ? AND ?
      GROUP BY data
      ORDER BY data ASC
    `;

    const mqlQuery = `
      SELECT 
        DATE_FORMAT(${crmDateCol}, '%Y-%m-%d') as date,
        CASE 
          WHEN LOWER(source) LIKE '%google%' THEN 'google'
          WHEN LOWER(source) LIKE '%meta%' OR LOWER(source) LIKE '%facebook%' OR LOWER(source) LIKE '%instagram%' THEN 'meta'
          ELSE 'other'
        END as platform,
        COUNT(*) as mqls
      FROM dados_crm 
      WHERE etapa = 'Para Venda' 
        AND ${crmDateCol} BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(${crmDateCol}, '%Y-%m-%d'), platform
      ORDER BY date ASC
    `;

    const [googleRes, metaRes, mqlRes] = await Promise.all([
      query(googleQuery, [startDate, endDate]),
      query(metaQuery, [startDate, endDate]),
      query(mqlQuery, [`${startDate} 00:00:00`, `${endDate} 23:59:59`])
    ]);

    return NextResponse.json({
      google: googleRes,
      meta: metaRes,
      mqls: mqlRes
    });

  } catch (error: any) {
    console.error('Ads daily error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
