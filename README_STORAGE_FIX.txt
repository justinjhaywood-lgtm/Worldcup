WORLD CUP 2026 SWEEPSTAKE - NETLIFY BLOBS STORAGE FIX

Your functions are now running. If get-state says:
"The environment has not been configured to use Netlify Blobs"
then Netlify Blobs needs manual environment variables.

Add these in Netlify:
Site configuration > Environment variables > Add variable

1) NETLIFY_SITE_ID
   Value: your Netlify Site ID
   Find it at: Site configuration > General > Site details > Site ID

2) NETLIFY_AUTH_TOKEN
   Value: a Netlify personal access token
   Create it at: User settings > Applications > Personal access tokens > New access token

Optional:
ADMIN_PIN=your admin reset PIN

Then redeploy:
Deploys > Trigger deploy > Clear cache and deploy site

Test these URLs after deploy:
/.netlify/functions/ping
/.netlify/functions/blob-check
/.netlify/functions/get-state

ping should prove functions work.
blob-check should prove storage works.
get-state should return ok:true and the sweepstake state.

Notes:
- This version uses a fresh storage name: wc2026_sweepstake_shared_v7.
- That avoids corrupted earlier test data carrying over.
