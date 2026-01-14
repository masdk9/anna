// ==========================================
//  PASTE YOUR FIREBASE CONFIG HERE 👇
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA_suE-En5oIv3z04gJV5TPhlDwYyx-QFI",
  authDomain: "masd-repo-git.firebaseapp.com",
  projectId: "masd-repo-git",
  storageBucket: "masd-repo-git.firebasestorage.app",
  messagingSenderId: "317994984658",
  appId: "1:317994984658:web:c55231ca09e70341c8f90b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); // Database Enabled

// --- AUTH LOGIC ---
auth.onAuthStateChanged((user) => {
    const authScreen = document.getElementById('auth-screen');
    if (user) {
        document.body.classList.remove('not-logged-in');
        authScreen.classList.remove('active');
        switchTab('home', document.querySelector('.nav-item-btn'));
        
        // Update Profile UI
        document.getElementById('profile-email-display').innerText = user.email;
        document.getElementById('profile-name-display').innerText = user.displayName || "User";
        
        // FUTURE: Load Posts Here
    } else {
        document.body.classList.add('not-logged-in');
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        authScreen.classList.add('active');
    }
});

function toggleAuth(mode) {
    document.getElementById('auth-error').innerText = ""; 
    if(mode === 'signup') {
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('signup-box').style.display = 'block';
    } else {
        document.getElementById('signup-box').style.display = 'none';
        document.getElementById('login-box').style.display = 'block';
    }
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    auth.signInWithEmailAndPassword(email, pass).catch((error) => {
        document.getElementById('auth-error').innerText = error.message;
    });
}

function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-pass').value;
    const name = document.getElementById('signup-name').value;
    
    if(!name) { document.getElementById('auth-error').innerText = "Name required"; return; }

    auth.createUserWithEmailAndPassword(email, pass).then((cred) => {
        cred.user.updateProfile({ displayName: name }).then(() => location.reload());
    }).catch((error) => {
        document.getElementById('auth-error').innerText = error.message;
    });
}

function handleLogout() {
    if(confirm("Logout?")) auth.signOut();
}

// --- UI LOGIC ---
function switchTab(screenId, navEl) {
    if(document.body.classList.contains('not-logged-in')) return;

    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');

    document.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.classList.remove('active');
        let icon = btn.querySelector('i');
        if(icon.classList.contains('bi-house-door-fill')) icon.className = 'bi bi-house-door';
        if(icon.classList.contains('bi-chat-dots-fill')) icon.className = 'bi bi-chat-dots';
        if(icon.classList.contains('bi-person-fill')) icon.className = 'bi bi-person';
    });

    if(navEl) {
        navEl.classList.add('active');
        let activeIcon = navEl.querySelector('i');
        if(activeIcon.classList.contains('bi-house-door')) activeIcon.className = 'bi bi-house-door-fill';
        if(activeIcon.classList.contains('bi-chat-dots')) activeIcon.className = 'bi bi-chat-dots-fill';
        if(activeIcon.classList.contains('bi-person')) activeIcon.className = 'bi bi-person-fill';
    }

    const fab = document.getElementById('fab-btn');
    if (screenId === 'home') {
        fab.style.display = 'flex';
        setTimeout(() => fab.classList.remove('hide'), 100);
    } else {
        fab.classList.add('hide');
        setTimeout(() => fab.style.display = 'none', 300);
    }
}

function openScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
    document.querySelectorAll('.nav-item-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('fab-btn').classList.add('hide');
}

// Scroll Logic
let isScrolling;
const fab = document.getElementById('fab-btn');
window.addEventListener('scroll', function (event) {
    if (!document.getElementById('home-screen').classList.contains('active')) return;
    fab.classList.add('hide');
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(function() { fab.classList.remove('hide'); }, 250);
}, false);
