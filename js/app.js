// ======================================================
//  SECTION 1: FIREBASE CONFIGURATION & INITIALIZATION
// ======================================================
const firebaseConfig = {
  apiKey: "AIzaSyA_suE-En5oIv3z04gJV5TPhlDwYyx-QFI",
  authDomain: "masd-repo-git.firebaseapp.com",
  projectId: "masd-repo-git",
  storageBucket: "masd-repo-git.firebasestorage.app",
  messagingSenderId: "317994984658",
  appId: "1:317994984658:web:c55231ca09e70341c8f90b"
};

// Initialize Firebase (Check karta hai taaki double load na ho)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ======================================================
//  SECTION 2: AUTHENTICATION LOGIC (Login/Signup)
// ======================================================

// --- 2.1 Login State Listener (Main Gatekeeper) ---
auth.onAuthStateChanged((user) => {
    const authScreen = document.getElementById('auth-screen');
    const body = document.body;

    if (user) {
        // --- LOGGED IN ---
        console.log("User Logged In:", user.email);

        loadPosts(); // Posts load karo
        
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
        if(authScreen) authScreen.classList.add('active');
    }
});

// --- 2.2 LOGIN FUNCTION ---
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
            // Screen apne aap change hogi
        })
        .catch((error) => {
            console.error("Login Error:", error);
            errorDiv.innerText = cleanErrorMessage(error.message);
        });
}

// --- 2.3 NEW SIGNUP FUNCTION (Updated for Username & Confirm Pass) ---
function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const name = document.getElementById('signup-name').value;
    const pass = document.getElementById('signup-pass').value;
    const confirmPass = document.getElementById('signup-confirm-pass').value;
    const errorDiv = document.getElementById('signup-error');
    
    // Reset Error
    errorDiv.innerText = "";

    // Validation
    if(!name || !email || !pass || !confirmPass) {
        errorDiv.innerText = "All fields are required!";
        return;
    }

    if(pass !== confirmPass) {
        errorDiv.innerText = "Passwords do not match! ❌";
        return;
    }

    if(pass.length < 6) {
        errorDiv.innerText = "Password must be at least 6 characters";
        return;
    }

    // Create Account
    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            // User ban gaya, ab Username set karo
            cred.user.updateProfile({ displayName: name }).then(() => {
                location.reload(); 
            });
        })
        .catch((error) => {
            console.error("Signup Error:", error);
            errorDiv.innerText = cleanErrorMessage(error.message);
        });
}

// --- 2.4 LOGOUT FUNCTION ---
function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        auth.signOut();
    }
}

// Error Message Cleaner
function cleanErrorMessage(msg) {
    return msg.replace('Firebase: ', '').replace(' (auth/wrong-password).', '').replace(' (auth/user-not-found).', '');
}


// ======================================================
//  SECTION 3: UI & TAB NAVIGATION
// ======================================================

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


// ======================================================
//  SECTION 4: POSTS LOGIC (CREATE & REDESIGNED LOAD)
// ======================================================

// --- 4.1 SAVE POST ---
function savePost() {
    const text = document.getElementById('post-text').value;
    const user = auth.currentUser;

    if (!text.trim()) return alert("Post cannot be empty!");

    const postBtn = document.querySelector('#createPostModal .btn-primary');
    postBtn.disabled = true;
    postBtn.innerText = "Posting...";

    db.collection("posts").add({
        text: text,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0
    }).then(() => {
        console.log("Post Saved!");
        document.getElementById('post-text').value = "";
        
        // Modal Band karo
        const modalEl = document.getElementById('createPostModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        
        postBtn.disabled = false;
        postBtn.innerText = "Post";
    }).catch((error) => {
        console.error("Error writing post: ", error);
        alert("Error: " + error.message);
        postBtn.disabled = false;
        postBtn.innerText = "Post";
    });
}

// --- 4.2 LOAD POSTS (NEW PROFESSIONAL DESIGN) ---
function loadPosts() {
    const container = document.getElementById('posts-container');
    
    db.collection("posts")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            
            if(snapshot.empty) {
                container.innerHTML = `<div class="text-center mt-5 text-muted"><p>No posts yet. Start the conversation!</p></div>`;
                return;
            }

            let html = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // Time Logic
                let timeString = "Just now";
                if(data.timestamp) {
                    const date = data.timestamp.toDate();
                    const isToday = date.toDateString() === new Date().toDateString();
                    timeString = isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
                }

                // Username Handle Logic (@name)
                let usernameHandle = "@" + (data.userEmail ? data.userEmail.split('@')[0] : "user");

                // DP Logic
                const dpUrl = `https://ui-avatars.com/api/?name=${data.userName}&background=random&color=fff&size=128`;

                // --- NEW CARD HTML ---
                html += `
                <div class="card border-0 shadow-sm rounded-4 mb-3">
                    <div class="card-body p-3">
                        
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex gap-2 align-items-center">
                                <img src="${dpUrl}" class="rounded-circle border" width="45" height="45" alt="DP">
                                <div style="line-height: 1.2;">
                                    <h6 class="mb-0 fw-bold text-dark" style="font-size: 15px;">${data.userName}</h6>
                                    <small class="text-muted" style="font-size: 12px;">${usernameHandle} • ${timeString}</small>
                                </div>
                            </div>
                            <button class="btn btn-sm text-muted rounded-circle p-1">
                                <i class="bi bi-bookmark fs-5"></i>
                            </button>
                        </div>

                        <p class="mb-3 text-dark mt-2" style="white-space: pre-wrap; font-size: 15px; font-weight: 400;">${data.text}</p>
                        
                        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                            <button class="btn btn-sm text-muted d-flex align-items-center gap-1 border-0">
                                <i class="bi bi-heart fs-6"></i> <span>${data.likes || 0}</span>
                            </button>
                            <button class="btn btn-sm text-muted d-flex align-items-center gap-1 border-0">
                                <i class="bi bi-chat fs-6"></i> <span>0</span>
                            </button>
   <button class="btn btn-sm text-muted d-flex align-items-center gap-1 border-0">
         <i class="bi bi-share fs-6"></i> <span>0</span>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            });

            container.innerHTML = html;
        });
}


// ======================================================
//  SECTION 5: PROFILE & ACCOUNT CENTRE LOGIC
// ======================================================

// 1. Modal Kholna
function openEditProfile() {
    const user = auth.currentUser;
    if(!user) return;

    document.getElementById('edit-name').value = user.displayName || "";
    document.getElementById('edit-email').value = user.email || "";

    const modalEl = document.getElementById('editProfileModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// 2. Naam Save Karna
function saveProfileChanges() {
    const newName = document.getElementById('edit-name').value;
    const user = auth.currentUser;
    const btn = document.querySelector('#editProfileModal .btn-primary');

    if (!newName.trim()) return alert("Name cannot be empty!");

    btn.innerText = "Saving...";
    btn.disabled = true;

    user.updateProfile({
        displayName: newName
    }).then(() => {
        alert("Profile Updated! ✅");
        location.reload(); 
    }).catch((error) => {
        console.error(error);
        alert("Error: " + error.message);
        btn.innerText = "Save Changes";
        btn.disabled = false;
    });
}
