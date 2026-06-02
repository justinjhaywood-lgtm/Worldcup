const { getState, saveState, response } = require('./shared-state');

function clean(value) {
  return String(value || '').trim().slice(0, 120);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { ok:false, error:'POST only.' });
  try {
    const payload = JSON.parse(event.body || '{}');
    const pin = clean(payload.pin);
    const adminPin = String(process.env.ADMIN_PIN || '2620').trim();
    if (pin !== adminPin) return response(403, { ok:false, error:'Wrong admin PIN.' });

    const playerName = clean(payload.playerName);
    const playerEmail = clean(payload.playerEmail);
    const paymentRef = clean(payload.paymentRef || 'ADMIN-ALLOCATED');

    if (!playerName) return response(400, { ok:false, error:'Player name is required.' });
    if (!playerEmail || !playerEmail.includes('@')) return response(400, { ok:false, error:'A valid email address is required.' });

    const state = await getState();
    const available = state.teams.filter(t => !t.taken);
    if (!available.length) return response(409, { ok:false, error:'All teams have already been drawn.', state });

    const chosen = available[Math.floor(Math.random() * available.length)];
    const original = state.teams.find(t => t.name === chosen.name);
    const drawnAt = new Date().toISOString();

    original.taken = true;
    original.playerName = playerName;
    original.playerEmail = playerEmail;
    original.paymentRef = paymentRef;
    original.drawnAt = drawnAt;
    original.adminAllocated = true;

    const draw = {
      drawnAt,
      playerName,
      playerEmail,
      team: original.name,
      group: original.group,
      paymentRef,
      adminAllocated: true
    };

    state.draws.push(draw);
    await saveState(state);

    return response(200, { ok:true, draw, state });
  } catch (err) {
    return response(500, { ok:false, error:'Could not allocate a team.', detail: err.message });
  }
};
