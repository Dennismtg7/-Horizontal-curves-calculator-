"""
export_calculations.py

The website itself is static HTML/JS + Firebase (no Python server is required
to run it). This script is an optional admin utility you can run on your own
computer to back up / audit everyone's saved calculations to a CSV file,
using the Firebase Admin SDK (which bypasses the security rules, so keep
the service-account key private).

Setup:
    pip install firebase-admin
    Firebase Console > Project settings > Service accounts > Generate new
    private key -> save as serviceAccountKey.json next to this script
    (DO NOT commit this file to GitHub — it's in .gitignore already).

Run:
    python export_calculations.py
"""

import csv
from datetime import datetime, timezone

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


def export_all_calculations(output_path: str = "calculations_export.csv") -> None:
    rows = []
    users_ref = db.collection("users").stream()

    for user_doc in users_ref:
        uid = user_doc.id
        calc_ref = db.collection("users").document(uid).collection("calculations").stream()
        for calc_doc in calc_ref:
            data = calc_doc.data()
            inputs = data.get("inputs", {})
            created = data.get("createdAt")
            created_str = created.isoformat() if hasattr(created, "isoformat") else str(created)
            rows.append({
                "uid": uid,
                "calculation_id": calc_doc.id,
                "title": data.get("title", ""),
                "created_at": created_str,
                "radius_R": inputs.get("R", ""),
                "theta_deg": inputs.get("theta_d", ""),
                "theta_min": inputs.get("theta_m", ""),
                "theta_sec": inputs.get("theta_s", ""),
                "chainage_T1": inputs.get("ch_t1", ""),
                "interval": inputs.get("interval", ""),
                "direction": inputs.get("direction", ""),
            })

    if not rows:
        print("No calculations found.")
        return

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Exported {len(rows)} calculations to {output_path} at "
          f"{datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    export_all_calculations()
