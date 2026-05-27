const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '45.55.43.112', user: 'root', password: 'LuizV4123098', database: 'hgmax'
  });
  
  // Check valor column type and non-zero values
  const [sample] = await conn.execute(`
    SELECT valor, COUNT(*) as total 
    FROM dados_crm 
    WHERE status = 'Ganho'
    GROUP BY valor 
    ORDER BY total DESC 
    LIMIT 15
  `);
  console.log('=== Distribuição de valores (Ganho) ===');
  console.table(sample);

  // Check column type
  const [cols] = await conn.execute(`DESCRIBE dados_crm valor`);
  console.log('\n=== Tipo da coluna valor ===');
  console.table(cols);

  await conn.end();
})();
