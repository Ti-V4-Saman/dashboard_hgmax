
const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: '45.55.43.112',
    user: 'root',
    password: 'LuizV4123098',
    database: 'hgmax'
  });

  try {
    const [maxGoogle] = await connection.execute('SELECT MAX(data) as max_date FROM bd_google_ads');
    console.log('Max Google Date:', maxGoogle[0].max_date);

    const [maxMeta] = await connection.execute('SELECT MAX(data) as max_date FROM bd_meta_ads');
    console.log('Max Meta Date:', maxMeta[0].max_date);
    
    const [maxCrm] = await connection.execute('SELECT MAX(data_movimentacao) as max_date FROM dados_crm');
    console.log('Max CRM Date:', maxCrm[0].max_date);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

test();
