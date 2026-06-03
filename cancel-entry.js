const { getState, saveState, response } = require('./shared-state');

function clean(value) {
  return String(value || '').trim().slice(0, 180);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { ok:false, error:'POST only.' });
  try {
    const payload = JSON.parse(event.body || '{}');
    const pin = clean(payload.pin);
    const adminPin = String(process.env.ADMIN_PIN || '2620').trim();
    if (pin !== adminPin) return response(403, { ok:false, error:'Wrong admin PIN.' });

    const state = await getState();
    const drawIndex = Number(payload.drawIndex);
    const drawnAt = clean(payload.drawnAt);
    const playerName = clean(payload.playerName);
    const playerEmail = clean(payload.playerEmail).toLowerCase();
    const teamName = clean(payload.team);

    let index = -1;
    if (Number.isInteger(drawIndex) && drawIndex >= 0 && drawIndex < state.draws.length) {
      const candidate = state.draws[drawIndex];
      const sameTeam = !teamName || candidate.team === teamName;
      const sameDate = !drawnAt || candidate.drawnAt === drawnAt;
      if (sameTeam && sameDate) index = drawIndex;
    }

    if (index < 0) {
      index = state.draws.findIndex(d =>
        (!drawnAt || d.drawnAt === drawnAt) &&
        (!teamName || d.team === teamName) &&
        (!playerName || d.playerName === playerName) &&
        (!playerEmail || String(d.playerEmail || '').toLowerCase() === playerEmail)
      );
    }

    if (index < 0) return response(404, { ok:false, error:'Could not find that draw entry.' });

    const [cancelled] = state.draws.splice(index, 1);
    const team = state.teams.find(t => t.name === cancelled.team);
    if (team) {
      team.taken = false;
      team.playerName = null;
      team.playerEmail = null;
      team.paymentRef = null;
      team.drawnAt = null;
      team.adminAllocated = false;
    }

    state.lastAdminCancellation = {
      cancelledAt: new Date().toISOString(),
      playerName: cancelled.playerName,
      playerEmail: cancelled.playerEmail,
      team: cancelled.team,
      drawnAt: cancelled.drawnAt
    };

    await saveState(state);
    return response(200, { ok:true, cancelled, state });
  } catch (err) {
    return response(500, { ok:false, error:'Could not cancel the entry.', detail: err.message });
  }
};
