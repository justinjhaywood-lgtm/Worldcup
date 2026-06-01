const { getState, response } = require('./shared-state');

exports.handler = async () => {
  try {
    const state = await getState();
    return response(200, { ok: true, state });
  } catch (err) {
    return response(500, { ok: false, error: 'Could not load the sweepstake state.', detail: err.message });
  }
};
