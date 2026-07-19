// firebase-init.js
// Loaded as a <script type="module"> on every page.
// Fill in YOUR_* values from Firebase Console > Project settings > General > Your apps > SDK setup.
// This config is safe to expose publicly — it is not a secret. Access is controlled by
// Firebase Auth + Firestore security rules (see firestore.rules), not by hiding this file.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "",
  authDomain: "my-store-mtg7.firebaseapp.com",
  databaseURL: "https://my-store-mtg7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-store-mtg7",
  storageBucket: "my-store-mtg7.firebasestorage.app",
  messagingSenderId: "787722917748",
  appId: "1:787722917748:web:cd1ff8997d549465e1be21",
  measurementId: "G-16Z2DFBE2P"
};


export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Shared nav-bar helper: every protected page calls this so the
// account state + logout button + YouTube link stay identical everywhere.
export function mountAppBar(activePage) {
  const bar = document.createElement("div");
  bar.className = "mtg7-appbar";
  bar.innerHTML = `
    <div class="mtg7-appbar-inner">
      <a href="calculator.html" class="mtg7-brand">MTG7 &middot; Curve Setting-Out</a>
      <nav class="mtg7-nav">
        <a href="calculator.html" data-page="calculator">Calculator</a>
        <a href="dashboard.html" data-page="dashboard">Dashboard</a>
        <a href="https://www.youtube.com/@DnsMTG7-uc7nf" target="_blank" rel="noopener">YouTube</a>
        <span class="mtg7-email" id="mtg7UserEmail"></span>
        <button id="mtg7LogoutBtn" class="mtg7-logout">Log out</button>
      </nav>
    </div>`;
  document.body.prepend(bar);

  bar.querySelectorAll("[data-page]").forEach(a => {
    if (a.dataset.page === activePage) a.classList.add("active");
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    const emailEl = bar.querySelector("#mtg7UserEmail");
    emailEl.textContent = user.email || user.displayName || "Signed in";
  });

  bar.querySelector("#mtg7LogoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
