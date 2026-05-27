const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: '45.55.43.112', user: 'root', password: 'LuizV4123098', database: 'hgmax'
  });
  
  const [rows] = await conn.execute(`
      SELECT 
        DATE(data_movimentacao) as date,
        COUNT(*) as count,
        SUM(CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2))) as faturamento
      FROM dados_crm 
      WHERE status = 'Ganho'
      GROUP BY DATE(data_movimentacao)
      ORDER BY date DESC
  `);
  console.log('Movimentacao:', rows);

  const [rows2] = await conn.execute(`
      SELECT 
        DATE(data_criacao) as date,
        COUNT(*) as count,
        SUM(CAST(REPLACE(REPLACE(valor, '.', ''), ',', '.') AS DECIMAL(15,2))) as faturamento
      FROM dados_crm 
      WHERE status = 'Ganho'
      GROUP BY DATE(data_criacao)
      ORDER BY date DESC
  `);
  console.log('Criacao:', rows2);
  
  await conn.end();
})();
