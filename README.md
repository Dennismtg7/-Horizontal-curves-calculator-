# MTG7 Horizontal Curve Setting-Out Calculator

A web app for the six horizontal-curve setting-out methods (tangent offsets,
long chord, deflection angles, Rankine's method, chord-deflection with theodolite,
and EDM/coordinates), with auto-generated SVG diagrams, user accounts, and a
dashboard of saved calculations.

**Architecture:** static HTML/CSS/JS front end (no server to run yourself) +
Firebase for authentication, database, and hosting + GitHub for version
control and automatic deploys. Python is included as an *optional* admin
utility, not something the site needs to run.

```
public/
  index.html          → sign up / log in
  calculator.html     → the calculator (protected — redirects to index.html if not logged in)
  dashboard.html       → saved calculations, delete/view, YouTube banner
  firebase-init.js     → Firebase config + shared nav bar logic
  mtg7-appbar.css      → shared nav bar styling
firestore.rules        → security rules (each user can only see their own data)
firebase.json          → hosting config
.firebaserc             → your Firebase project id
.github/workflows/deploy.yml → auto-deploy to Firebase Hosting on every push to main
admin/export_calculations.py → optional Python script to export data to CSV
```

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** → name it
   (e.g. `mtg7-curve-calculator`) → finish the wizard.
2. **Build → Authentication → Get started.** Enable:
   - **Email/Password**
   - **Google** (pick a support email)
3. **Build → Firestore Database → Create database** → start in **production
   mode** → pick a region close to Kenya (e.g. `europe-west` or the default).
4. **Project settings (gear icon) → General → Your apps → Web (</>) icon.**
   Register an app (nickname anything, e.g. "MTG7 Web"). Firebase shows you a
   config object — copy the values into `public/firebase-init.js`, replacing
   every `YOUR_...` placeholder:
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   This config is public by design — it's not a secret key. Real protection
   comes from `firestore.rules`, which only lets a signed-in user read or
   write their own `users/{their-uid}/calculations` documents.

5. Also put your project ID into `.firebaserc` and into
   `.github/workflows/deploy.yml` (both `YOUR_PROJECT_ID` spots).

## 2. Push the code to GitHub

```bash
cd mtg7-curve-app
git init
git add .
git commit -m "Initial commit: curve calculator with auth and dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Create the empty repo first on github.com if you haven't (New repository,
no README/license so it stays empty for this push).

## 3. Connect GitHub to Firebase Hosting (auto-deploy)

1. Install the Firebase CLI once, locally: `npm install -g firebase-tools`
2. Log in: `firebase login`
3. From inside the project folder run:
   ```bash
   firebase init hosting:github
   ```
   Follow the prompts (pick your existing project, existing `firebase.json`).
   This automatically creates the `FIREBASE_SERVICE_ACCOUNT` secret in your
   GitHub repo and finishes wiring up `.github/workflows/deploy.yml` for you.
4. Deploy the Firestore rules once manually:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. From now on, every `git push` to `main` redeploys the site automatically
   (GitHub Actions runs the workflow in `.github/workflows/deploy.yml`).

If you'd rather deploy by hand instead of via GitHub Actions:
```bash
firebase deploy --only hosting
```

## 4. Custom domain (optional)

Firebase Hosting → **Add custom domain** and follow the DNS instructions —
works the same way whether you use a `.com` or a Kenyan `.co.ke` domain.

## 5. YouTube channel link

The channel link (`https://www.youtube.com/@DnsMTG7-uc7nf`) is already wired
into:
- the sign-up/login page (`index.html`)
- the shared nav bar on every page (`firebase-init.js` → `mountAppBar`)
- the dashboard banner (`dashboard.html`)

To change the handle later, search for `DnsMTG7-uc7nf` across the `public/`
folder and replace it everywhere it appears.

## 6. How sign-up and the dashboard work

- `index.html` lets someone create an account with email/password or Google,
  then redirects to `calculator.html`.
- `calculator.html` checks auth on load (via `mountAppBar`) and bounces
  anyone not logged in back to `index.html`.
- After computing a curve, the **Save to Dashboard** button writes the
  inputs and the rendered result (including diagrams) to Firestore at
  `users/{uid}/calculations/{autoId}`.
- `dashboard.html` lists everything for the current user in real time, with
  View (reopens the saved result in a modal) and Delete.

## 7. Optional: Python export/admin script

`admin/export_calculations.py` uses the Firebase Admin SDK to dump every
user's saved calculations to a CSV for backup/analysis. It runs on your own
computer, not on the website:

```bash
cd admin
pip install -r requirements.txt
# Firebase Console → Project settings → Service accounts → Generate new
# private key → save the file as admin/serviceAccountKey.json
python export_calculations.py
```

`serviceAccountKey.json` is already in `.gitignore` — never commit it or push
it to GitHub, since it grants full admin access to your Firebase project.

## 8. Local preview before deploying

```bash
firebase emulators:start --only hosting
```
or simply open `public/index.html` in a browser — note that `file://` pages
can have issues with Google sign-in popups, so prefer the emulator or a
quick `npx serve public`.
