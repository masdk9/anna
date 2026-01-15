// ==========================================
//  1. FIREBASE CONFIGURATION
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
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
//  2. UI CONTROLLER (Screen Change Logic)
// ==========================================

// --- App me Ghusne ka Code ---
function enterApp(user) {
    console.log("Entering App: " + user.email);

    // 1. Login Screen Hatao
    const authScreen = document.getElementById('auth-screen');
    if(authScreen) authScreen.classList.remove('active');

    // 2. App Dikhao
    document.body.classList.remove('not-logged-in');
    
    // 3. Home Tab par le jao
    switchTab('home', document.querySelector('.nav-item-btn'));

    // 4. User Data Load karo
    loadPosts();
    
    // 5. Profile Name Update
    if(document.getElementById('profile-email-display')) {
        document.getElementById('profile-email-display').innerText = user.email;
        document.getElementById('profile-name-display').innerText = user.displayName || "User";
        // Update DP
        const dpUrl = `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=0d6efd&color=fff`;
        document.getElementById('profile-img-display').src = dpUrl;
    }
}

// --- App se Nikalne ka Code ---
function exitApp() {
    console.log("Exiting App...");
    document.body.classList.add('not-logged-in');
    
    // Sab screens chupao
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    
    // Login Screen wapas dikhao
    const authScreen = document.getElementById('auth-screen');
    if(authScreen) authScreen.classList.add('active');
}

// ==========================================
//  3. AUTH LISTENER (The Gatekeeper)
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // Agar user login hai, to App me bhejo
        enterApp(user);
    } else {
        // Agar user nahi hai, to Login screen dikhao
        exitApp();
    }
});

// ==========================================
//  4. LOGIN FUNCTION
// ==========================================
function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const btn = document.querySelector('.login button'); 
    const errorDiv = document.getElementById('auth-error');

    if(errorDiv) errorDiv.innerText = "";

    if(!email || !pass) {
        if(errorDiv) errorDiv.innerText = "Please enter email and password";
        else alert("Please enter email and password");
        return;
    }

    // Button Feedback
    btn.innerText = "Please wait...";
    btn.disabled = true;

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            // Success Message
            btn.innerText = "Success! 🔓";
            
            // NOTE: Yahan se screen change 'onAuthStateChanged' karega.
            // Hum bas wait karenge.
        })
        .catch((error) => {
            console.error(error);
            btn.innerText = "Login"; // Reset Button
            btn.disabled = false;
            
            if(errorDiv) {
                errorDiv.innerText = error.message.replace('Firebase: ', '');
                errorDiv.style.color = 'red';
            } else {
                alert(error.message);
            }
        });
}

// ==========================================
//  5. SIGNUP FUNCTION
// ==========================================
function handleSignup() {
    const email = document.getElementById('signup-email').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const pass = document.getElementById('signup-pass').value.trim();
    const confirmPass = document.getElementById('signup-confirm-pass').value.trim();
    const errorDiv = document.getElementById('signup-error');
    
    if(errorDiv) errorDiv.innerText = "";

    if(!name || !email || !pass || !confirmPass) {
        if(errorDiv) errorDiv.innerText = "All fields required";
        return;
    }
    if(pass !== confirmPass) {
        if(errorDiv) errorDiv.innerText = "Passwords do not match";
        return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            cred.user.updateProfile({ displayName: name }).then(() => {
                location.reload(); // Reload to refresh profile
            });
        })
        .catch((error) => {
            if(errorDiv) errorDiv.innerText = error.message;
        });
}

// ==========================================
//  6. LOGOUT
// ==========================================
function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        auth.signOut().then(() => {
            exitApp();
        });
    }
}

// ==========================================
//  7. POSTS & APP LOGIC
// ==========================================
function loadPosts() {
    const container = document.getElementById('posts-container');
    if(!container) return;
    
    db.collection("posts").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        if(snapshot.empty) {
            container.innerHTML = "<div class='text-center mt-5 text-muted'><p>No posts yet</p></div>";
            return;
        }
        let html = "";
        snapshot.forEach(doc => {
            let data = doc.data();
            let usernameHandle = "@" + (data.userEmail ? data.userEmail.split('@')[0] : "user");
            let dpUrl = `https://ui-avatars.com/api/?name=${data.userName}&background=random&color=fff&size=128`;

            html += `
            <div class="card border-0 shadow-sm rounded-4 mb-3">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex gap-2 align-items-center">
                            <img src="${dpUrl}" class="rounded-circle border" width="45" height="45">
                            <div style="line-height: 1.2;">
                                <h6 class="mb-0 fw-bold text-dark" style="font-size: 15px;">${data.userName}</h6>
                                <small class="text-muted" style="font-size: 12px;">${usernameHandle}</small>
                            </div>
                        </div>
                    </div>
                    <p class="mb-3 text-dark mt-2" style="white-space: pre-wrap; font-size: 15px;">${data.text}</p>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                        <i class="bi bi-heart fs-5 text-muted"></i>
                        <i class="bi bi-chat fs-5 text-muted"></i>
                        <i class="bi bi-share fs-5 text-muted"></i>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    });
}

function savePost() {
    const text = document.getElementById('post-text').value;
    const user = auth.currentUser;
    if (!text.trim()) return alert("Post cannot be empty!");
    
    db.collection("posts").add({
        text: text,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0
    }).then(() => {
        document.getElementById('post-text').value = "";
        const modalEl = document.getElementById('createPostModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    });
}

function openEditProfile() {
    const user = auth.currentUser;
    if(user) {
        document.getElementById('edit-name').value = user.displayName || "";
        document.getElementById('edit-email').value = user.email || "";
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    }
}

function saveProfileChanges() {
    const newName = document.getElementById('edit-name').value;
    if (!newName.trim()) return alert("Name cannot be empty!");
    auth.currentUser.updateProfile({ displayName: newName }).then(() => {
        alert("Profile Updated!");
        location.reload();
    });
}

// Navigation Helper
function switchTab(screenId, navEl) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
    
    document.querySelectorAll('.nav-item-btn').forEach(btn => btn.classList.remove('active'));
    if(navEl) navEl.classList.add('active');
    
    const fab = document.getElementById('fab-btn');
    if(fab) fab.style.display = (screenId === 'home') ? 'flex' : 'none';
}

function openScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
}
