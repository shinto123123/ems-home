import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const SESSION_KEY = "emsUser";

// Called by signin.html right after a successful signInWithEmailAndPassword + profile lookup
export function onLogin({ uid, role, name, email, docId }) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ uid, role, name, email, docId }));
}

// { uid, role, name, email, docId } or null if nobody is logged in
export function getCurrentUser() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

// Call at the top of every dashboard page. Redirects to signin if not logged in
// as one of the allowed roles for that page. rootPrefix is "./" for pages at the
// project root or "../" for pages one folder deep (Admin/, Employee/, HR/, Intern/, manager/).
export function requireRole(allowedRoles, rootPrefix = "../") {
    const user = getCurrentUser();
    if (!user || !allowedRoles.includes(user.role)) {
        window.location.href = rootPrefix + "signin.html";
        return null;
    }
    return user;
}

export async function logout(rootPrefix = "../") {
    localStorage.removeItem(SESSION_KEY);
    try {
        await signOut(auth);
    } catch {
        // ignore - session is already cleared locally
    }
    window.location.href = rootPrefix + "signin.html";
}

// Replaces the hardcoded "John Doe / Admin" text in a page's .nav-profile-info block
// with the real logged-in user's name/role.
export function paintNavProfile(user) {
    const nameEl = document.querySelector(".nav-profile-info h4");
    const roleEl = document.querySelector(".nav-profile-info small");
    if (!user) return;
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
}
