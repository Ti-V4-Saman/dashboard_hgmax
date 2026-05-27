
const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: '45.55.43.112',
    user: 'root',
    password: 'LuizV4123098',
    database: 'hgmax'
  });

  try {
    console.log('--- bd_google_ads ---');
    const [colsGoogle] = await connection.execute('SHOW COLUMNS FROM bd_google_ads');
    console.log(colsGoogle.map(c => c.Field));
    
    console.log('--- bd_meta_ads ---');
    const [colsMeta] = await connection.execute('SHOW COLUMNS FROM bd_meta_ads');
    console.log(colsMeta.map(c => c.Field));

    const [rows] = await connection.execute('SELECT * FROM bd_google_ads LIMIT 1');
    console.log('Sample Google:', rows[0]);

    const [rowsMeta] = await connection.execute('SELECT * FROM bd_meta_ads LIMIT 1');
    console.log('Sample Meta:', rowsMeta[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

test();
