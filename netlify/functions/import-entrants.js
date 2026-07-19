const { getState, saveState, requireAdminPin } = require('./shared-state');

function clean(value) {
  return String(value || '').trim();
}

function parseBoolean(value) {
  const v = clean(value).toLowerCase();
  return v === 'yes' || v === 'true' || v === '1';
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed.' }) };
    }

    const body = JSON.parse(event.body || '{}');
    requireAdminPin(body.pin);

    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'No entrant rows were provided.' }) };
    }

    const state = await getState();
    state.draws = Array.isArray(state.draws) ? state.draws : [];

    const imported = [];
    const skipped = [];

    for (const row of rows) {
      const playerName = clean(row.playerName || row.name || row['Player name'] || row['Name']);
      const playerEmail = clean(row.playerEmail || row.email || row['Email address'] || row['Email']);
      const teamName = clean(row.team || row.drawnTeam || row['Drawn team'] || row['Team']);
      let group = clean(row.group || row['Group']);
      const paymentRef = clean(row.paymentRef || row['Payment ref']) || 'ADMIN-RESTORED';

      if (!playerName || !teamName) {
        skipped.push({ row, reason: 'Missing player name or team.' });
        continue;
      }

      const team = (state.teams || []).find(t => String(t.name).toLowerCase() === teamName.toLowerCase());
      if (!team) {
        skipped.push({ row, reason: `${teamName} was not found in the team list.` });
        continue;
      }

      // If already taken by the same person/team, avoid duplicating.
      const duplicate = state.draws.some(d =>
        String(d.team).toLowerCase() === String(team.name).toLowerCase() &&
        String(d.playerName).toLowerCase() === playerName.toLowerCase()
      );
      if (duplicate) {
        skipped.push({ row, reason: 'Duplicate entry already exists.' });
        continue;
      }

      if (team.taken && String(team.playerName || '').toLowerCase() !== playerName.toLowerCase()) {
        skipped.push({ row, reason: `${team.name} is already allocated to another person.` });
        continue;
      }

      const drawnAt = clean(row.drawnAt || row['Date/time']) || new Date().toISOString();
      group = group || team.group || '';

      team.taken = true;
      team.playerName = playerName;
      team.playerEmail = playerEmail || null;
      team.paymentRef = paymentRef;
      team.drawnAt = drawnAt;

      const draw = {
        drawnAt,
        playerName,
        playerEmail,
        team: team.name,
        group,
        paymentRef,
        adminRestored: true,
        adminAllocated: parseBoolean(row.adminAllocated || row['Admin allocated'])
      };

      state.draws.push(draw);
      imported.push(draw);
    }

    await saveState(state);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, imported, skipped, state })
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ ok: false, error: err.message || 'Could not import entrants.' })
    };
  }
};
