World Cup 2026 Sweepstake Generator - Shared Draw Version v5
============================================================

This package is laid out in the most standard Netlify/Git format:

/public/index.html
/netlify/functions/get-state.js
/netlify/functions/draw-team.js
/netlify/functions/reset-sweepstake.js
/netlify/functions/ping.js
/package.json
/netlify.toml

GitHub to Netlify setup:
1. Unzip this package.
2. Upload the CONTENTS of the unzipped folder to the ROOT of a GitHub repo.
   The repo root must directly show: public, netlify, package.json, netlify.toml.
3. In Netlify: Add new site -> Import an existing project -> choose the repo.
4. Use these build settings:
   Base directory: leave blank
   Build command: npm install
   Publish directory: public
   Functions directory: netlify/functions
5. Deploy.

Important check:
Open this first:
https://YOUR-SITE.netlify.app/.netlify/functions/ping

If ping returns {"ok":true}, functions are deployed.
Then open:
https://YOUR-SITE.netlify.app/.netlify/functions/get-state

If get-state returns {"ok":true}, the shared draw record is working.

Environment variable:
ADMIN_PIN=your-admin-pin
You can change this in Netlify under Site configuration -> Environment variables.

PayPal Pool URL currently used:
https://www.paypal.com/pool/9pFSWweTFK?sr=accr


Version 14 update:
- Draw record teams are hidden by default.
- Admin can use Reveal teams in draw record after all tickets are sold.
- Admin can hide them again if needed.
