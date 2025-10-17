// Simple verification script: calls local lookup proxy and verifies returned shape
(async function(){
  try {
    const res = await fetch('http://localhost:3011/api/lookup/units');
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('Expected array but got: ' + typeof json);
    if (json.length === 0) {
      console.log('OK: returned empty array');
      return;
    }
    const sample = json[0];
    if (sample.id === undefined) throw new Error('Missing id on sample item');
    if (sample.name === undefined) throw new Error('Missing name on sample item');
    console.log('OK: lookup proxy returned', json.length, 'items. Sample:', { id: sample.id, name: sample.name, meta: sample.meta });
  } catch (err) {
    console.error('FAILED:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();

