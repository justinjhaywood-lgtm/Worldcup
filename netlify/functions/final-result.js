const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'wc2026_sweepstake_shared_v7';
const RESULT_KEY = 'final-result';

function getStoreRef() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.BLOBS_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN || process.env.BLOBS_TOKEN;
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

function buildResult(winner) {
  winner = String(winner || '').trim().toLowerCase();
  const spain = { team: 'Spain', player: 'Richard Bradley', shirt: 'spain' };
  const argentina = { team: 'Argentina', player: 'Mollie Jennings-Parkes', shirt: 'argentina' };
  if (winner !== 'spain' && winner !== 'argentina') return { known: false };
  const champion = winner === 'spain' ? spain : argentina;
  const runnerUpEntry = winner === 'spain' ? argentina : spain;
  return {
    known: true,
    winner: champion.team,
    runnerUp: runnerUpEntry.team,
    champion,
    runnerUpEntry,
    championText: champion.player + ' wins £150',
    runnerUpText: runnerUpEntry.player + ' wins £50',
    message: 'Congratulations',
    updatedAt: new Date().toISOString()
  };
}

exports.handler = async (event) => {
  try {
    const store = getStoreRef();

    if (event.httpMethod === 'GET') {
      const result = await store.get(RESULT_KEY, { type: 'json' }).catch(() => null);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ ok: true, result: result || { known: false } })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const expected = String(process.env.ADMIN_PIN || '2620').trim();
      if (String(body.pin || '').trim() !== expected) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Wrong admin PIN.' })
        };
      }
      const result = buildResult(body.winner);
      if (!result.known) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Choose Spain or Argentina.' })
        };
      }
      await store.setJSON(RESULT_KEY, result);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ ok: true, result })
      };
    }

    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed.' }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message || 'Final result error.' })
    };
  }
};
