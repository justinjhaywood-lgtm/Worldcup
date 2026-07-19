const { getState, saveState, response } = require('./shared-state');

function buildResult(winner) {
  winner = String(winner || '').trim().toLowerCase();

  const spain = { team: 'Spain', player: 'Richard Bradley', shirt: 'spain' };
  const argentina = { team: 'Argentina', player: 'Mollie Jennings-Parkes', shirt: 'argentina' };

  if (winner !== 'spain' && winner !== 'argentina') return { known: false };

  const champion = winner === 'spain' ? spain : argentina;
  const runnerUpEntry = winner === 'spain' ? argentina : spain;

  return {
    known: true,
    locked: true,
    winner: champion.team,
    runnerUp: runnerUpEntry.team,
    champion,
    runnerUpEntry,
    championText: champion.player + ' wins £150',
    runnerUpText: runnerUpEntry.player + ' wins £50',
    message: 'Congratulations',
    source: 'admin',
    updatedAt: new Date().toISOString()
  };
}

exports.handler = async (event) => {
  try {
    const state = await getState();

    if (event.httpMethod === 'GET') {
      return response(200, { ok: true, result: state.finalResult || { known: false } });
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const pin = String(payload.pin || '').trim();
      const adminPin = String(process.env.ADMIN_PIN || '2620').trim();

      if (pin !== adminPin) return response(403, { ok: false, error: 'Wrong admin PIN.' });

      const result = buildResult(payload.winner);
      if (!result.known) return response(400, { ok: false, error: 'Choose Spain or Argentina.' });

      state.finalResult = result;
      await saveState(state);

      return response(200, { ok: true, result, state });
    }

    return response(405, { ok: false, error: 'Method not allowed.' });
  } catch (err) {
    return response(500, { ok: false, error: 'Could not update final result.', detail: err.message });
  }
};
