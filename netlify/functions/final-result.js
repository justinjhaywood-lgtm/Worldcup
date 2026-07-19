const { getStore } = require('@netlify/blobs');
const { requireAdminPin } = require('./shared-state');

const STORE_NAME = 'wc2026_sweepstake_shared_v7';
const RESULT_KEY = 'final-result';

function getBlobStore() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.BLOBS_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN || process.env.BLOBS_TOKEN;
  if (siteID && token) return getStore({ name: STORE_NAME, siteID, token });
  return getStore(STORE_NAME);
}

function makeResult(winner) {
  winner = String(winner || '').trim().toLowerCase();
  if (winner !== 'spain' && winner !== 'argentina') {
    return { known: false, source: 'pending', updatedAt: new Date().toISOString() };
  }

  const spain = {
    team: 'Spain',
    player: 'Richard Bradley',
    shirt: 'spain'
  };

  const argentina = {
    team: 'Argentina',
    player: 'Mollie Jennings-Parkes',
    shirt: 'argentina'
  };

  const champion = winner === 'spain' ? spain : argentina;
  const runnerUp = winner === 'spain' ? argentina : spain;

  return {
    known: true,
    winner: champion.team,
    runnerUp: runnerUp.team,
    champion,
    runnerUpEntry: runnerUp,
    championText: `${champion.player} wins £150`,
    runnerUpText: `${runnerUp.player} wins £50`,
    message: 'Congratulations',
    updatedAt: new Date().toISOString()
  };
}

exports.handler = async (event) => {
  try {
    const store = getBlobStore();

    if (event.httpMethod === 'GET') {
      let saved = null;
      try {
        saved = await store.get(RESULT_KEY, { type: 'json' });
      } catch (err) {
        saved = null;
      }

      // Stored/admin result is the source of truth.
      if (saved && saved.known) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: JSON.stringify({ ok: true, result: saved })
        };
      }

      // BBC auto-check placeholder.
      // This deliberately returns pending unless a manual admin result has been set.
      // Live BBC pages often change format and may block scraping, so the app should not
      // risk declaring a winner from a brittle scrape. Admin override is provided in-app.
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          ok: true,
          result: {
            known: false,
            source: 'pending',
            note: 'Final result has not been confirmed in the app yet.',
            checkedAt: new Date().toISOString()
          }
        })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      requireAdminPin(body.pin);
      const result = makeResult(body.winner);
      if (!result.known) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Choose Spain or Argentina as the winner.' })
        };
      }
      result.source = 'admin';
      await store.setJSON(RESULT_KEY, result);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ ok: true, result })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      requireAdminPin(body.pin);
      await store.setJSON(RESULT_KEY, { known: false, source: 'cleared', updatedAt: new Date().toISOString() });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ ok: true, result: { known: false } })
      };
    }

    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed.' }) };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message || 'Could not check final result.' })
    };
  }
};
