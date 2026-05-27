const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '45.55.43.112',
    user: 'root',
    password: 'LuizV4123098',
    database: 'hgmax'
  });
  
  try {
    const [schema] = await conn.execute('DESCRIBE metas');
    console.log('=== SCHEMA ===');
    console.log(JSON.stringify(schema, null, 2));
    
    const [rows] = await conn.execute('SELECT * FROM metas LIMIT 10');
    console.log('\n=== DATA ===');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await conn.end();
}

main();
