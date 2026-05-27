import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT * FROM metas ORDER BY data_inicio DESC');
    return NextResponse.json({ metas: rows });
  } catch (error: any) {
    console.error('Metas GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      data_inicio, data_termino,
      meta_investimento, investimento_meta_ads, investimento_google_ads,
      investimento_linkedin_ads, investimento_tiktok_ads,
      meta_lead, meta_mql, meta_sql, meta_venda,
      meta_faturamento, meta_venda_ltv, meta_faturamento_ltv,
      meta_vendas_projeto, meta_faturamento_projeto,
    } = body;

    if (!data_inicio || !data_termino) {
      return NextResponse.json({ error: 'Datas são obrigatórias' }, { status: 400 });
    }

    await query(
      `INSERT INTO metas (
        data_inicio, data_termino, meta_investimento,
        investimento_meta_ads, investimento_google_ads,
        investimento_linkedin_ads, investimento_tiktok_ads,
        meta_lead, meta_mql, meta_sql, meta_venda,
        meta_faturamento, meta_venda_ltv, meta_faturamento_ltv,
        meta_vendas_projeto, meta_faturamento_projeto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data_inicio, data_termino, meta_investimento || 0,
        investimento_meta_ads || 0, investimento_google_ads || 0,
        investimento_linkedin_ads || 0, investimento_tiktok_ads || 0,
        meta_lead || 0, meta_mql || 0, meta_sql || 0, meta_venda || 0,
        meta_faturamento || 0, meta_venda_ltv || 0, meta_faturamento_ltv || 0,
        meta_vendas_projeto || 0, meta_faturamento_projeto || 0,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Metas POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const clean: Record<string, any> = {};
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) clean[k] = v;
    });

    if (Object.keys(clean).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const sets = Object.keys(clean).map(k => `${k} = ?`).join(', ');
    await query(`UPDATE metas SET ${sets} WHERE id = ?`, [...Object.values(clean), id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Metas PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await query('DELETE FROM metas WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Metas DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
