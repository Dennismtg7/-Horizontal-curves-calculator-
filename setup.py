#!/usr/bin/env python3
"""
SurveyPro — Firebase + GitHub Setup Script
==========================================
Run this once after cloning the repo to configure Firebase,
set up GitHub secrets, and do the first deployment.

Requirements:
  pip install -r requirements.txt

Usage:
  python setup.py
"""

import subprocess, sys, os, json, webbrowser, time

BOLD  = '\033[1m'
TEAL  = '\033[96m'
GREEN = '\033[92m'
RED   = '\033[91m'
GOLD  = '\033[93m'
RESET = '\033[0m'

def step(n, msg):
    print(f'\n{TEAL}{BOLD}── Step {n}: {msg}{RESET}')

def ok(msg):
    print(f'{GREEN}✓ {msg}{RESET}')

def warn(msg):
    print(f'{GOLD}⚠  {msg}{RESET}')

def err(msg):
    print(f'{RED}✗ {msg}{RESET}')

def run(cmd, check=True, capture=False):
    r = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if check and r.returncode != 0:
        err(f'Command failed: {cmd}')
        if r.stderr: print(r.stderr)
        sys.exit(1)
    return r

def ask(prompt, default=''):
    val = input(f'{BOLD}{prompt}{RESET} [{default}]: ').strip()
    return val or default

# ── BANNER ─────────────────────────────────────────────────
print(f"""
{TEAL}{BOLD}
  ╔══════════════════════════════════════════╗
  ║   SurveyPro — Firebase + GitHub Setup   ║
  ╚══════════════════════════════════════════╝
{RESET}
This script will:
  1. Check Node.js + npm are installed
  2. Install Firebase CLI
  3. Log you into Firebase
  4. Link your Firebase project
  5. Patch your firebaseConfig in index.html
  6. Set GitHub secrets for CI/CD
  7. Run the first deployment
""")

input('Press Enter to start...')

# ── STEP 1: Check Node ────────────────────────────────────
step(1, 'Checking Node.js & npm')
try:
    node_v = run('node --version', capture=True).stdout.strip()
    npm_v  = run('npm --version',  capture=True).stdout.strip()
    ok(f'Node {node_v}, npm {npm_v}')
except SystemExit:
    err('Node.js is not installed.')
    print('Download from: https://nodejs.org')
    sys.exit(1)

# ── STEP 2: Install Firebase CLI ─────────────────────────
step(2, 'Installing Firebase CLI')
cli_check = run('firebase --version', check=False, capture=True)
if cli_check.returncode == 0:
    ok(f'Firebase CLI already installed: {cli_check.stdout.strip()}')
else:
    run('npm install -g firebase-tools')
    ok('Firebase CLI installed')

# ── STEP 3: Firebase login ────────────────────────────────
step(3, 'Firebase login')
print('A browser window will open for Firebase authentication.')
run('firebase login')
ok('Logged into Firebase')

# ── STEP 4: Get Firebase project details ─────────────────
step(4, 'Firebase project configuration')
print(f"""
{GOLD}Open Firebase Console and follow these steps:
  1. Go to: https://console.firebase.google.com
  2. Create a new project (or use existing)
  3. Enable Authentication → Email/Password + Google
  4. Enable Firestore Database (Start in production mode)
  5. Enable Storage
  6. Go to Project Settings → General → Your Apps → Add Web App
  7. Copy the firebaseConfig object values below
{RESET}""")
webbrowser.open('https://console.firebase.google.com')
time.sleep(2)

project_id    = ask('Firebase Project ID')
api_key       = ask('apiKey')
auth_domain   = ask('authDomain', f'{project_id}.firebaseapp.com')
storage_bucket= ask('storageBucket', f'{project_id}.appspot.com')
sender_id     = ask('messagingSenderId')
app_id        = ask('appId')

# ── STEP 5: Patch index.html ──────────────────────────────
step(5, 'Patching firebaseConfig in index.html')
idx = open('index.html').read()

replacements = {
    '"YOUR_API_KEY"':            f'"{api_key}"',
    '"YOUR_PROJECT.firebaseapp.com"': f'"{auth_domain}"',
    '"YOUR_PROJECT_ID"':         f'"{project_id}"',
    '"YOUR_PROJECT.appspot.com"':f'"{storage_bucket}"',
    '"YOUR_SENDER_ID"':          f'"{sender_id}"',
    '"YOUR_APP_ID"':             f'"{app_id}"',
}
for old, new in replacements.items():
    idx = idx.replace(old, new)
open('index.html', 'w').write(idx)

# Patch .firebaserc
rc = json.loads(open('.firebaserc').read())
rc['projects']['default'] = project_id
open('.firebaserc', 'w').write(json.dumps(rc, indent=2))
ok('index.html and .firebaserc updated')

# ── STEP 6: Deploy Firestore rules and Storage rules ─────
step(6, 'Deploying Firestore + Storage rules')
run(f'firebase use {project_id}')
run('firebase deploy --only firestore:rules,storage')
ok('Security rules deployed')

# ── STEP 7: First hosting deployment ─────────────────────
step(7, 'First Firebase Hosting deployment')
run('firebase deploy --only hosting')
ok('Site deployed!')

# ── STEP 8: GitHub CI/CD setup ───────────────────────────
step(8, 'GitHub Actions / CI-CD setup')
print(f"""
{GOLD}To enable auto-deploy on GitHub push:

  1. Go to your GitHub repo → Settings → Secrets → Actions
  2. Add these secrets:

     FIREBASE_PROJECT_ID  = {project_id}
     FIREBASE_SERVICE_ACCOUNT = <JSON from Firebase Console>

  To get the service account JSON:
    Firebase Console → Project Settings → Service Accounts
    → Generate new private key → download the JSON
    → Paste the entire JSON content as the secret value

  3. Push to the 'main' branch — GitHub Actions will deploy automatically.
{RESET}""")
webbrowser.open(f'https://console.firebase.google.com/project/{project_id}/settings/serviceaccounts/adminsdk')

# ── DONE ──────────────────────────────────────────────────
print(f"""
{GREEN}{BOLD}
  ✓ Setup complete!
  ✓ Your site is live at: https://{project_id}.web.app
{RESET}
Next steps:
  • Upload resource files to Firebase Storage → resources/
  • Add your calculator HTML pages to the pages/ folder
  • Push to GitHub main branch for auto-deploy
  • Subscribe to your own YouTube channel 😄
""")
