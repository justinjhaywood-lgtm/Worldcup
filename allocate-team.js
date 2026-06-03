const { getState, saveState, requireAdminPin } = require('./shared-state');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed.' }) };
    }

    const body = JSON.parse(event.body || '{}');
    requireAdminPin(body.pin);

    const playerName = String(body.playerName || '').trim();
    const playerEmail = String(body.playerEmail || '').trim();
    const requestedTeamName = String(body.teamName || '').trim();

    if (!playerName) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Player name is required.' }) };
    }

    if (!playerEmail || !playerEmail.includes('@')) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'A valid player email is required.' }) };
    }

    const state = await getState();
    const available = (state.teams || []).filter(t => !t.taken);

    if (!available.length) {
      return { statusCode: 409, body: JSON.stringify({ ok: false, error: 'All teams have already been allocated.' }) };
    }

    let chosen;
    if (requestedTeamName) {
      chosen = available.find(t => String(t.name).toLowerCase() === requestedTeamName.toLowerCase());
      if (!chosen) {
        const existsButTaken = (state.teams || []).find(t => String(t.name).toLowerCase() === requestedTeamName.toLowerCase());
        return {
          statusCode: 409,
          body: JSON.stringify({
            ok: false,
            error: existsButTaken ? `${requestedTeamName} is not currently available.` : `${requestedTeamName} was not found in the team list.`
          })
        };
      }
    } else {
      chosen = available[Math.floor(Math.random() * available.length)];
    }

    const original = (state.teams || []).find(t => t.name === chosen.name);
    const now = new Date().toISOString();
    const paymentRef = body.paymentRef || (requestedTeamName ? 'ADMIN-SPECIFIC-ALLOCATED' : 'ADMIN-ALLOCATED');

    original.taken = true;
    original.player = { name: playerName, email: playerEmail };
    original.paymentRef = paymentRef;
    original.drawnAt = now;

    const draw = {
      drawnAt: now,
      playerName,
      playerEmail,
      team: original.name,
      group: original.group,
      paymentRef,
      adminAllocated: true,
      specificTeamAllocated: !!requestedTeamName
    };

    state.draws = state.draws || [];
    state.draws.push(draw);

    await saveState(state);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, draw, state })
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ ok: false, error: err.message || 'Could not allocate team.' })
    };
  }
};
