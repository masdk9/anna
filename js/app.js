// ==========================================
//  1. FIREBASE CONFIGURATION (Fixed for Browser)
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
// (Ye check karta hai ki firebase pehle se load to nahi hai)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
//  2. AUTHENTICATION LOGIC
// ==========================================

// Login State Listener (Check agar user login hai ya nahi)
auth.onAuthStateChanged((user) => {
    const authScreen = document.getElementById('auth-screen');
    const body = document.body;

    if (user) {
        // --- LOGGED IN ---
        console.log("User Logged In:", user.email);
        body.classList.remove('not-logged-in');
        authScreen.classList.remove('active');
        
        // Home tab par le jao
        switchTab('home', document.querySelector('.nav-item-btn'));
        
        // Profile Data Update karo
        if(document.getElementById('profile-email-display')) {
            document.getElementById('profile-email-display').innerText = user.email;
            document.getElementById('profile-name-display').innerText = user.displayName || "User";
        }
        
    } else {
        // --- LOGGED OUT ---
        console.log("User Signed Out");
        body.classList.add('not-logged-in');
        
        // Auth Screen Dikhao
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        authScreen.classList.add('active');
    }
});

// Switch between Login & Signup Forms
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

// LOGIN FUNCTION
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const errorDiv = document.getElementById('auth-error');

    if(!email || !pass) {
        errorDiv.innerText = "Please enter email and password";
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            console.log("Login Success");
            // onAuthStateChanged automatically handles the screen switch
        })
        .catch((error) => {
            console.error("Login Error:", error);
            errorDiv.innerText = cleanErrorMessage(error.message);
        });
}

// SIGNUP FUNCTION
function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-pass').value;
    const name = document.getElementById('signup-name').value;
    const errorDiv = document.getElementById('auth-error');
    
    if(!name || !email || !pass) { 
        errorDiv.innerText = "All fields are required"; 
        return; 
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            // User ban gaya, ab uska Naam set karo
            cred.user.updateProfile({ displayName: name }).then(() => {
                location.reload(); // Reload taaki fresh data dikhe
            });
        })
        .catch((error) => {
            console.error("Signup Error:", error);
            errorDiv.innerText = cleanErrorMessage(error.message);
        });
}

// LOGOUT FUNCTION
function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        auth.signOut();
    }
}

// Error Message Cleaner (Firebase ke error message ko sundar banana)
function cleanErrorMessage(msg) {
    return msg.replace('Firebase: ', '').replace(' (auth/wrong-password).', '').replace(' (auth/user-not-found).', '');
}


// ==========================================
//  3. UI & TAB LOGIC
// ==========================================

function switchTab(screenId, navEl) {
    if(document.body.classList.contains('not-logged-in')) return;

    // Hide all screens
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    // Show target screen
    const targetScreen = document.getElementById(screenId + '-screen');
    if(targetScreen) targetScreen.classList.add('active');

    // Reset all icons
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.classList.remove('active');
        let icon = btn.querySelector('i');
        if(icon.classList.contains('bi-house-door-fill')) icon.className = 'bi bi-house-door';
        if(icon.classList.contains('bi-chat-dots-fill')) icon.className = 'bi bi-chat-dots';
        if(icon.classList.contains('bi-person-fill')) icon.className = 'bi bi-person';
    });

    // Activate clicked icon
    if(navEl) {
        navEl.classList.add('active');
        let activeIcon = navEl.querySelector('i');
        if(activeIcon.classList.contains('bi-house-door')) activeIcon.className = 'bi bi-house-door-fill';
        if(activeIcon.classList.contains('bi-chat-dots')) activeIcon.className = 'bi bi-chat-dots-fill';
        if(activeIcon.classList.contains('bi-person')) activeIcon.className = 'bi bi-person-fill';
    }

    // FAB Visibility (Only on Home)
    const fab = document.getElementById('fab-btn');
    if(fab) {
        if (screenId === 'home') {
            fab.style.display = 'flex';
            setTimeout(() => fab.classList.remove('hide'), 100);
        } else {
            fab.classList.add('hide');
            setTimeout(() => fab.style.display = 'none', 300);
        }
    }
}

function openScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
    document.querySelectorAll('.nav-item-btn').forEach(btn => btn.classList.remove('active'));
    if(document.getElementById('fab-btn')) document.getElementById('fab-btn').classList.add('hide');
}

// Scroll Logic for FAB (Hide on scroll down)
let isScrolling;
const fabBtn = document.getElementById('fab-btn');
window.addEventListener('scroll', function (event) {
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen && !homeScreen.classList.contains('active')) return;
    if (!fabBtn) return;

    fabBtn.classList.add('hide');
    window.clearTimeout(isScrolling);
    isScrolling = setTimeout(function() {
        fabBtn.classList.remove('hide');
    }, 250);
}, false);
