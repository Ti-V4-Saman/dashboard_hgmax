const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: '45.55.43.112', user: 'root', password: 'LuizV4123098', database: 'hgmax'
  });
  
  try {
    const [colsGoogle] = await conn.execute(`DESCRIBE bd_google_ads`);
    console.log('Google Ads columns:', colsGoogle.map(c => c.Field));

    const [sampleGoogle] = await conn.execute(`SELECT * FROM bd_google_ads LIMIT 3`);
    console.log('Google Ads sample:', sampleGoogle);

    const [colsMeta] = await conn.execute(`DESCRIBE bd_meta_ads`);
    console.log('Meta Ads columns:', colsMeta.map(c => c.Field));

    const [sampleMeta] = await conn.execute(`SELECT * FROM bd_meta_ads LIMIT 3`);
    console.log('Meta Ads sample:', sampleMeta);

  } catch (err) {
    console.error('Error querying DB:', err);
  }
  
  await conn.end();
})();
