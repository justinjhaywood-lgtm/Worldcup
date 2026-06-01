const { freshState, saveState, response } = require('./shared-state');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { ok:false, error:'POST only.' });
  try {
    const payload = JSON.parse(event.body || '{}');
    const pin = String(payload.pin || '').trim();
    const adminPin = String(process.env.ADMIN_PIN || '2620').trim();
    if (pin !== adminPin) return response(403, { ok:false, error:'Wrong admin PIN.' });
    const state = freshState();
    await saveState(state);
    return response(200, { ok:true, state });
  } catch (err) {
    return response(500, { ok:false, error:'Could not reset the sweepstake.', detail: err.message });
  }
};
