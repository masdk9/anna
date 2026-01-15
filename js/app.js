// ==========================================
//  1. FIREBASE CONFIG & INIT
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA_suE-En5oIv3z04gJV5TPhlDwYyx-QFI",
  authDomain: "masd-repo-git.firebaseapp.com",
  projectId: "masd-repo-git",
  storageBucket: "masd-repo-git.firebasestorage.app",
  messagingSenderId: "317994984658",
  appId: "1:317994984658:web:c55231ca09e70341c8f90b"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
//  2. DEBUG LOGIN FUNCTION (Alerts Included)
// ==========================================
function handleLogin() {
    // Value uthao aur spaces hatao
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    
    // DEBUG: Alert check
    alert("System Check: Logging in as...\n" + email);

    if(!email || !pass) {
        alert("❌ Please enter both Email and Password.");
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            alert("✅ SUCCESS! Login Successful.");
            window.location.reload(); 
        })
        .catch((error) => {
            alert("❌ LOGIN FAILED:\nError Code: " + error.code + "\nMessage: " + error.message);
        });
}

// ==========================================
//  3. SIGNUP FUNCTION
// ==========================================
function handleSignup() {
    const email = document.getElementById('signup-email').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const pass = document.getElementById('signup-pass').value.trim();
    const confirmPass = document.getElementById('signup-confirm-pass').value.trim();
    const errorDiv = document.getElementById('signup-error');
    
    errorDiv.innerText = "";

    if(!name || !email || !pass || !confirmPass) {
        errorDiv.innerText = "All fields required!";
        return;
    }
    if(pass !== confirmPass) {
        errorDiv.innerText = "Passwords do not match!";
        return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            cred.user.updateProfile({ displayName: name }).then(() => {
                alert("Account Created! Logging in...");
                window.location.reload(); 
            });
        })
        .catch((error) => {
            errorDiv.innerText = error.message;
        });
}

// ==========================================
//  4. AUTH STATE & LOGOUT
// ==========================================
auth.onAuthStateChanged((user) => {
    const authScreen = document.getElementById('auth-screen');
    const body = document.body;

    if (user) {
        // --- LOGGED IN ---
        loadPosts();
        body.classList.remove('not-logged-in');
        authScreen.classList.remove('active');
        switchTab('home', document.querySelector('.nav-item-btn'));
        
        // Update Profile UI
        if(document.getElementById('profile-email-display')) {
            document.getElementById('profile-email-display').innerText = user.email;
            document.getElementById('profile-name-display').innerText = user.displayName || "User";
            const dpUrl = `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=0d6efd&color=fff`;
            document.getElementById('profile-img-display').src = dpUrl;
        }
    } else {
        // --- LOGGED OUT ---
        body.classList.add('not-logged-in');
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        if(authScreen) authScreen.classList.add('active');
    }
});

function handleLogout() {
    if(confirm("Logout?")) {
        auth.signOut().then(() => {
             window.location.reload();
        });
    }
}

// ==========================================
//  5. UI NAVIGATION
// ==========================================
function switchTab(screenId, navEl) {
    if(document.body.classList.contains('not-logged-in')) return;

    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const targetScreen = document.getElementById(screenId + '-screen');
    if(targetScreen) targetScreen.classList.add('active');

    document.querySelectorAll('.nav-item-btn').forEach(btn => btn.classList.remove('active'));
    if(navEl) navEl.classList.add('active');

    // FAB Visibility
    const fab = document.getElementById('fab-btn');
    if(fab) {
        fab.style.display = (screenId === 'home') ? 'flex' : 'none';
    }
}

function openScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
}

// ==========================================
//  6. POSTS LOGIC (Instagram Style)
// ==========================================
function savePost() {
    const text = document.getElementById('post-text').value;
    const user = auth.currentUser;

    if (!text.trim()) return alert("Post cannot be empty!");
    
    // Save to Firestore
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

function loadPosts() {
    const container = document.getElementById('posts-container');
    
    db.collection("posts").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        if(snapshot.empty) {
            container.innerHTML = `<div class="text-center mt-5 text-muted"><p>No posts yet.</p></div>`;
            return;
        }
        let html = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            let usernameHandle = "@" + (data.userEmail ? data.userEmail.split('@')[0] : "user");
            const dpUrl = `https://ui-avatars.com/api/?name=${data.userName}&background=random&color=fff&size=128`;

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
                        <i class="bi bi-bookmark fs-5 text-muted"></i>
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

// ==========================================
//  7. PROFILE EDIT
// ==========================================
function openEditProfile() {
    const user = auth.currentUser;
    if(!user) return;
    document.getElementById('edit-name').value = user.displayName || "";
    document.getElementById('edit-email').value = user.email || "";
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

function saveProfileChanges() {
    const newName = document.getElementById('edit-name').value;
    if (!newName.trim()) return alert("Name cannot be empty!");
    auth.currentUser.updateProfile({ displayName: newName }).then(() => {
        alert("Profile Updated!");
        window.location.reload();
    });
}
