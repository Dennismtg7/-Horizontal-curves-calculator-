# ⟁ SurveyPro — Surveying & Engineering Platform

A full-stack web platform for surveying and engineering tools, built with
**HTML/CSS/JS** on the frontend, **Firebase** for auth/database/hosting, and
**GitHub Actions** for automatic deployment.

---

## 🗂 Project Structure

```
survey-platform/
├── index.html                  ← Main landing page (home)
├── firebase.json               ← Firebase Hosting config
├── firestore.rules             ← Firestore security rules
├── storage.rules               ← Firebase Storage security rules
├── .firebaserc                 ← Firebase project alias
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Actions auto-deploy
├── public/
│   ├── css/main.css            ← All styles
│   └── js/app.js               ← Auth, dashboard, routing logic
├── pages/
│   ├── curve-calculator.html   ← Horizontal curve tool wrapper
│   ├── traverse-calculator.html← Traverse tool wrapper
│   └── setting-out.html        ← Setting-out data tool wrapper
├── setup.py                    ← One-command setup script (Python)
├── admin.py                    ← Admin tasks (upload files, list users)
└── requirements.txt            ← Python dependencies
```

---

## 🚀 Quick Start (Step by Step)

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [Git](https://git-scm.com)
- A Google account (for Firebase)
- A GitHub account

---

### Step 1 — Clone & open the project

```bash
git clone https://github.com/YOUR_USERNAME/survey-platform.git
cd survey-platform
```

---

### Step 2 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `survey-pro`)
3. Enable **Google Analytics** if you want (optional)

#### Enable services:
- **Authentication** → Sign-in method → Enable **Email/Password** and **Google**
- **Firestore Database** → Create database → Start in **production mode** → pick a region
- **Storage** → Get started → Start in **production mode**

#### Get your Firebase config:
- Project Settings (⚙) → General → Your apps → **Add app** → Web (</>) 
- Register app → copy the `firebaseConfig` object

---

### Step 3 — Add your Firebase config to index.html

Open `index.html` and find this section near the bottom:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

Replace each `"YOUR_..."` with your actual values.

**OR** run the automated setup:

```bash
pip install -r requirements.txt
python setup.py
```

---

### Step 4 — Add your calculator tools

Copy your calculator HTML files into the `pages/` folder:

```bash
cp ~/Downloads/curve_calculator.html  pages/curve-calculator-tool.html
cp ~/Downloads/traverse.html          pages/traverse-calculator-tool.html
cp ~/Downloads/setting_out_data.html  pages/setting-out-tool.html
```

Then open each wrapper page (`pages/curve-calculator.html` etc.) and
uncomment the `<iframe>` line that loads the tool file.

---

### Step 5 — Install Firebase CLI & deploy

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Link your project
firebase use YOUR_PROJECT_ID

# Deploy Firestore rules and Storage rules
firebase deploy --only firestore:rules,storage

# Deploy the website
firebase deploy --only hosting
```

Your site is now live at: `https://YOUR_PROJECT_ID.web.app`

---

### Step 6 — Upload resource files

Put your downloadable files in a local folder, then upload:

```bash
# Using the admin script
python admin.py upload path/to/horizontal-curve-formulas.pdf
python admin.py upload path/to/traverse-booking-sheet.xlsx
# ... etc for each file
```

**OR** upload directly in the Firebase Console:
Storage → Files → Upload → into the `resources/` folder

Files must be named exactly as referenced in `index.html`:
- `horizontal-curve-formulas.pdf`
- `traverse-booking-sheet.xlsx`
- `setting-out-table-template.pdf`
- `dms-conversion-guide.pdf`
- `curve-example-dataset.csv`
- `surveying-abbreviations.pdf`

---

### Step 7 — Connect GitHub for auto-deploy

1. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/survey-platform.git
git push -u origin main
```

2. Get a Firebase service account key:
   - Firebase Console → Project Settings → Service Accounts
   - → **Generate new private key** → download the JSON file

3. Add GitHub Secrets:
   - GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**
   - Add: `FIREBASE_SERVICE_ACCOUNT` = paste entire JSON file contents
   - Add: `FIREBASE_PROJECT_ID` = your project ID

4. Now every `git push` to `main` auto-deploys your site! ✓

---

## 🔧 Admin Tasks (Python)

```bash
# Show platform stats
python admin.py stats

# List all registered users
python admin.py list-users

# Export users to CSV
python admin.py export-users

# Upload a file to Firebase Storage
python admin.py upload myfile.pdf
```

Requires `serviceAccountKey.json` in the project root.

---

## 🔒 Firestore Data Structure

```
users/
  {uid}/
    displayName:  string
    email:        string
    createdAt:    timestamp
    toolsUsed:    number
    downloads:    number

resources/         (managed via Console or admin.py)
  {id}/
    name:         string
    filename:     string
    type:         string
```

---

## 📺 YouTube Integration

The site is already linked to `@DnsMTG7-uc7nf`.

To add real video cards, get your **YouTube Data API key**:
1. [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create API key
4. Fetch your latest videos:

```javascript
const YOUTUBE_API_KEY = 'YOUR_KEY';
const CHANNEL_ID = 'UCxxxxxx'; // from your YouTube channel URL

fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=6&order=date&type=video&key=${YOUTUBE_API_KEY}`)
  .then(r => r.json())
  .then(data => {
    data.items.forEach(item => {
      // render video cards with item.snippet.title, thumbnails, etc.
    });
  });
```

---

## 🌐 Custom Domain (optional)

1. Firebase Console → Hosting → Add custom domain
2. Enter your domain (e.g. `surveypro.co.ke`)
3. Follow the DNS verification steps
4. Firebase provides a free SSL certificate automatically

---

## 📞 Support

- YouTube: [@DnsMTG7-uc7nf](https://www.youtube.com/@DnsMTG7-uc7nf)
- Issues: Open a GitHub issue on this repo
