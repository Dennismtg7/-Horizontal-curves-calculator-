#!/usr/bin/env python3
"""
SurveyPro — Admin Script
========================
Use this to:
  - Upload resource files to Firebase Storage
  - List all registered users
  - Export user data
  - Send announcements (future)

Usage:
  python admin.py upload <filepath>        # Upload a file to Storage/resources/
  python admin.py list-users               # List all registered users
  python admin.py export-users             # Export users to CSV
  python admin.py stats                    # Show platform stats

Requirements:
  pip install firebase-admin
  Place your serviceAccountKey.json in this folder (from Firebase Console →
  Project Settings → Service Accounts → Generate new private key)
"""

import sys, os, csv, datetime
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage

KEY_FILE = 'serviceAccountKey.json'

def init_firebase():
    if not os.path.exists(KEY_FILE):
        print(f'ERROR: {KEY_FILE} not found.')
        print('Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key')
        sys.exit(1)
    cred = credentials.Certificate(KEY_FILE)
    firebase_admin.initialize_app(cred, {
        'storageBucket': open('firebase_project.txt').read().strip() + '.appspot.com'
        if os.path.exists('firebase_project.txt') else input('Your Firebase project ID: ') + '.appspot.com'
    })
    return firestore.client()

# ── UPLOAD FILE TO STORAGE ──────────────────────────────
def upload_resource(filepath):
    if not os.path.exists(filepath):
        print(f'File not found: {filepath}')
        return
    filename = os.path.basename(filepath)
    bucket = storage.bucket()
    blob = bucket.blob(f'resources/{filename}')
    blob.upload_from_filename(filepath)
    blob.make_public()
    print(f'✓ Uploaded: resources/{filename}')
    print(f'  URL: {blob.public_url}')

# ── LIST USERS ───────────────────────────────────────────
def list_users():
    print(f'\n{"UID":<30} {"Email":<35} {"Name":<25} {"Created"}')
    print('─' * 100)
    page = auth.list_users()
    count = 0
    while page:
        for u in page.users:
            created = datetime.datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000) \
                      if u.user_metadata.creation_timestamp else '—'
            print(f'{u.uid:<30} {(u.email or "—"):<35} {(u.display_name or "—"):<25} {created}')
            count += 1
        page = page.get_next_page()
    print(f'\nTotal users: {count}')

# ── EXPORT USERS TO CSV ──────────────────────────────────
def export_users():
    filename = f'users_export_{datetime.date.today()}.csv'
    rows = []
    page = auth.list_users()
    while page:
        for u in page.users:
            created = datetime.datetime.fromtimestamp(u.user_metadata.creation_timestamp / 1000) \
                      if u.user_metadata.creation_timestamp else ''
            rows.append({
                'uid':          u.uid,
                'email':        u.email or '',
                'display_name': u.display_name or '',
                'created_at':   str(created),
                'email_verified': u.email_verified,
                'provider':     u.provider_data[0].provider_id if u.provider_data else ''
            })
        page = page.get_next_page()
    with open(filename, 'w', newline='') as f:
        if rows:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
    print(f'✓ Exported {len(rows)} users to {filename}')

# ── PLATFORM STATS ───────────────────────────────────────
def show_stats(db):
    users_ref = db.collection('users')
    docs = list(users_ref.stream())
    total_tools = sum(d.to_dict().get('toolsUsed', 0) for d in docs)
    total_dl    = sum(d.to_dict().get('downloads',  0) for d in docs)
    print(f'\n{"─"*40}')
    print(f'  Total users:       {len(docs)}')
    print(f'  Total tool opens:  {total_tools}')
    print(f'  Total downloads:   {total_dl}')
    print(f'{"─"*40}\n')

# ── MAIN ────────────────────────────────────────────────
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1]
    db = init_firebase()

    if cmd == 'upload':
        if len(sys.argv) < 3:
            print('Usage: python admin.py upload <filepath>')
        else:
            upload_resource(sys.argv[2])

    elif cmd == 'list-users':
        list_users()

    elif cmd == 'export-users':
        export_users()

    elif cmd == 'stats':
        show_stats(db)

    else:
        print(f'Unknown command: {cmd}')
        print(__doc__)
