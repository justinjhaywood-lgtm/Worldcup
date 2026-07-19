const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'wc2026_sweepstake_shared_v7';
const STATE_KEY = 'state';

const DEFAULT_TEAMS = [
  {group:'A', name:'Mexico'}, {group:'A', name:'South Africa'}, {group:'A', name:'Korea Republic'}, {group:'A', name:'Czechia'},
  {group:'B', name:'Canada'}, {group:'B', name:'Bosnia and Herzegovina'}, {group:'B', name:'Qatar'}, {group:'B', name:'Switzerland'},
  {group:'C', name:'Brazil'}, {group:'C', name:'Morocco'}, {group:'C', name:'Haiti'}, {group:'C', name:'Scotland'},
  {group:'D', name:'USA'}, {group:'D', name:'Paraguay'}, {group:'D', name:'Australia'}, {group:'D', name:'Türkiye'},
  {group:'E', name:'Côte d’Ivoire'}, {group:'E', name:'Ecuador'}, {group:'E', name:'Germany'}, {group:'E', name:'Curaçao'},
  {group:'F', name:'Netherlands'}, {group:'F', name:'Japan'}, {group:'F', name:'Tunisia'}, {group:'F', name:'Sweden'},
  {group:'G', name:'Belgium'}, {group:'G', name:'IR Iran'}, {group:'G', name:'Egypt'}, {group:'G', name:'New Zealand'},
  {group:'H', name:'Saudi Arabia'}, {group:'H', name:'Uruguay'}, {group:'H', name:'Spain'}, {group:'H', name:'Cabo Verde'},
  {group:'I', name:'France'}, {group:'I', name:'Senegal'}, {group:'I', name:'Norway'}, {group:'I', name:'Iraq'},
  {group:'J', name:'Argentina'}, {group:'J', name:'Algeria'}, {group:'J', name:'Austria'}, {group:'J', name:'Jordan'},
  {group:'K', name:'Portugal'}, {group:'K', name:'Congo DR'}, {group:'K', name:'Uzbekistan'}, {group:'K', name:'Colombia'},
  {group:'L', name:'England'}, {group:'L', name:'Ghana'}, {group:'L', name:'Panama'}, {group:'L', name:'Croatia'}
];

function freshState() {
  return {
    version: 7,
    createdAt: new Date().toISOString(),
    teams: DEFAULT_TEAMS.map(t => ({...t, taken:false, playerName:null, playerEmail:null, paymentRef:null, drawnAt:null})),
    draws: [],
    revealTeamsInDrawRecord: false,
    finalResult: { known: false }
  };
}

function normaliseState(state) {
  if (!state || !Array.isArray(state.teams) || !Array.isArray(state.draws) || state.teams.length !== DEFAULT_TEAMS.length) {
    return freshState();
  }

  state.teams = DEFAULT_TEAMS.map((defaultTeam, index) => {
    const existing = state.teams[index] || {};
    return {
      ...existing,
      group: existing.group || defaultTeam.group,
      name: existing.name || existing.team || existing.country || defaultTeam.name,
      taken: Boolean(existing.taken),
      playerName: existing.playerName || (existing.player && existing.player.name) || null,
      playerEmail: existing.playerEmail || (existing.player && existing.player.email) || null,
      paymentRef: existing.paymentRef || null,
      drawnAt: existing.drawnAt || null
    };
  });

  state.draws = state.draws.map(draw => ({
    ...draw,
    team: draw.team || draw.name || draw.country || '',
    group: draw.group || ''
  }));

  state.revealTeamsInDrawRecord = Boolean(state.revealTeamsInDrawRecord);
  state.finalResult = state.finalResult && state.finalResult.known ? state.finalResult : { known: false };
  state.version = 10;
  return state;
}

function getBlobStore() {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.BLOBS_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN || process.env.BLOBS_TOKEN;

  // Some Netlify deployments provide the Blobs context automatically.
  // If not, manual siteID/token environment variables make it work reliably.
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  return getStore(STORE_NAME);
}

async function getState() {
  const store = getBlobStore();
  let state = null;
  try {
    state = await store.get(STATE_KEY, { type: 'json' });
  } catch (err) {
    state = null;
  }
  state = normaliseState(state);
  if (!state.createdAt) state.createdAt = new Date().toISOString();
  await store.setJSON(STATE_KEY, state);
  return state;
}

async function saveState(state) {
  const store = getBlobStore();
  await store.setJSON(STATE_KEY, normaliseState(state));
  return state;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

module.exports = { DEFAULT_TEAMS, freshState, getState, saveState, response };
