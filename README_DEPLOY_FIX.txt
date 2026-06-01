WORLD CUP 2026 SWEEPSTAKE - SHARED DRAW RECORD V6

This version includes BOTH:
- index.html at the project root
- public/index.html

It also includes:
- netlify/functions/ping.js
- netlify/functions/get-state.js
- netlify/functions/draw-team.js
- netlify/functions/reset-sweepstake.js

IMPORTANT NETLIFY SETTINGS

In Netlify > Site settings > Build & deploy > Build settings, use:

Base directory: leave blank
Build command: npm install
Publish directory: .
Functions directory: netlify/functions

If your Netlify UI still says npm.install, change it to npm install.
There must be a space, not a dot.

Then trigger: Deploys > Trigger deploy > Clear cache and deploy site

AFTER DEPLOY

Test this first:
https://YOUR-SITE.netlify.app/.netlify/functions/ping

You should see:
{"ok":true,"message":"Netlify functions are working"}

If ping gives 404, the functions were not deployed. Check the latest deploy log and the Functions tab.
