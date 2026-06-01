const { getState, response } = require('./shared-state');

exports.handler = async () => {
  try {
    const state = await getState();
    return response(200, {
      ok: true,
      message: 'Netlify Blobs storage is working.',
      remaining: state.teams.filter(t => !t.taken).length,
      draws: state.draws.length,
      hasManualSiteId: Boolean(process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.BLOBS_SITE_ID),
      hasManualToken: Boolean(process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN || process.env.BLOBS_TOKEN)
    });
  } catch (err) {
    return response(500, {
      ok: false,
      error: 'Netlify Blobs storage is not configured yet.',
      detail: err.message,
      fix: 'Add NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables in Netlify, then clear-cache redeploy.'
    });
  }
};
