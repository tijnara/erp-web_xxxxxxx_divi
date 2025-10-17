// Simple verification script using axios (axios is in project dependencies)
const axios = require('axios');
(async function(){
  try {
    const res = await axios.get('http://localhost:3011/api/lookup/units', { timeout: 5000 });
    const data = res.data;
    if (!Array.isArray(data)) throw new Error('Expected array but got: ' + typeof data);
    if (data.length === 0) {
      console.log('OK: returned empty array');
      return;
    }
    const sample = data[0];
    if (sample.id === undefined) throw new Error('Missing id on sample item');
    if (sample.name === undefined) throw new Error('Missing name on sample item');
    console.log('OK: lookup proxy returned', data.length, 'items. Sample:', { id: sample.id, name: sample.name, meta: sample.meta });
  } catch (err) {
    console.error('FAILED:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();

