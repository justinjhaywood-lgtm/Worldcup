World Cup 2026 Sweepstake Generator - Shared Draw Version
=========================================================

IMPORTANT DEPLOYMENT NOTE
-------------------------
This version uses Netlify Functions and Netlify Blobs so that drawn teams are shared across browsers/devices.

Do NOT deploy this version by dragging only the finished static output folder if Netlify is not building the project. Netlify needs to install dependencies and deploy the functions.

Recommended deployment options:

OPTION 1 - GitHub / Git deploy
1. Unzip this package.
2. Upload the whole unzipped folder to a GitHub repository.
3. In Netlify, choose Add new site -> Import an existing project.
4. Connect the GitHub repository.
5. Build command: npm install
6. Publish directory: .
7. Functions directory: netlify/functions
8. Deploy.

OPTION 2 - Netlify CLI
1. Install Node.js if needed.
2. Unzip this package.
3. Open a terminal in the unzipped folder.
4. Run: npm install
5. Run: npx netlify deploy --prod
6. When asked for publish directory, use: .

Environment variable:
ADMIN_PIN=1234
You can change this in Netlify under Site configuration -> Environment variables.

How to check functions are working:
Open this address on your live site:
https://YOUR-SITE-NAME.netlify.app/.netlify/functions/get-state

If it returns JSON with "ok": true, the functions are working.
If it gives a 404 or error page, the functions have not been deployed.

Current PayPal Pool URL:
https://www.paypal.com/pool/9pFSWweTFK?sr=accr
