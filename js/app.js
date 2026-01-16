// ==========================================
//  1. FIREBASE CONFIG
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA_suE-En5oIv3z04gJV5TPhlDwYyx-QFI",
  authDomain: "masd-repo-git.firebaseapp.com",
  projectId: "masd-repo-git",
  storageBucket: "masd-repo-git.firebasestorage.app",
  messagingSenderId: "317994984658",
  appId: "1:317994984658:web:c55231ca09e70341c8f90b"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
//  2. UI CONTROLLER (Screens)
// ==========================================

function enterApp(user) {
    document.getElementById('auth-screen').classList.remove('active');
    document.body.classList.remove('not-logged-in');
    
    // Load Data
    switchTab('home', document.querySelector('.nav-item-btn'));
    updateProfileUI(user);
    loadPosts();
    loadTheme(); // Theme check karo
}

function exitApp() {
    document.body.classList.add('not-logged-in');
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById('auth-screen').classList.add('active');
}

function updateProfileUI(user) {
    if(document.getElementById('profile-email-display')) {
        document.getElementById('profile-email-display').innerText = user.email;
        document.getElementById('profile-name-display').innerText = user.displayName || "User";
        
        const dpUrl = `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=0d6efd&color=fff`;
        document.getElementById('profile-img-display').src = dpUrl;
    }
    // Edit Modal Fields
    if(document.getElementById('edit-email')) {
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-name').value = user.displayName || "";
    }
}

// ==========================================
//  3. AUTH LOGIC
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) enterApp(user);
    else exitApp();
});

function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const btn = document.querySelector('.login button');
    const errorDiv = document.getElementById('auth-error');

    if(errorDiv) errorDiv.innerText = "";
    if(!email || !pass) return errorDiv ? errorDiv.innerText = "Enter email & password" : null;

    btn.innerText = "Wait..."; btn.disabled = true;

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => btn.innerText = "Success!")
        .catch(err => {
            btn.innerText = "Login"; btn.disabled = false;
            if(errorDiv) errorDiv.innerText = err.message.replace('Firebase: ', '');
        });
}

function handleSignup() {
    const email = document.getElementById('signup-email').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const pass = document.getElementById('signup-pass').value.trim();
    const confirmPass = document.getElementById('signup-confirm-pass').value.trim();
    const errorDiv = document.getElementById('signup-error');

    if(pass !== confirmPass) return errorDiv.innerText = "Passwords do not match";

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            cred.user.updateProfile({ displayName: name }).then(() => location.reload());
        })
        .catch(err => errorDiv.innerText = err.message);
}

function handleLogout() {
    if(confirm("Logout?")) auth.signOut();
}

// ==========================================
//  4. SETTINGS & DARK MODE LOGIC
// ==========================================
function openSettings() {
    document.getElementById('settings-screen').classList.add('active');
    document.querySelector('.nav-wrapper').style.display = 'none'; // Hide Nav
    document.getElementById('fab-btn').style.display = 'none'; // Hide FAB
}

function closeSettings() {
    document.getElementById('settings-screen').classList.remove('active');
    document.querySelector('.nav-wrapper').style.display = 'flex'; // Show Nav
    document.getElementById('fab-btn').style.display = 'flex'; // Show FAB
}

function toggleDarkMode() {
    const isDark = document.getElementById('dark-mode-toggle').checked;
    if (isDark) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('dark-mode-toggle');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if(toggle) toggle.checked = true;
    }
}

// ==========================================
//  5. POSTS & APP LOGIC
// ==========================================
function loadPosts() {
    const container = document.getElementById('posts-container');
    if(!container) return;
    
    container.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary"></div></div>`;
    
    db.collection("posts").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        if(snapshot.empty) return container.innerHTML = "<p class='text-center mt-5 text-muted'>No posts yet</p>";
        
        let html = "";
        snapshot.forEach(doc => {
            let data = doc.data();
            let dpUrl = `https://ui-avatars.com/api/?name=${data.userName}&background=random&color=fff&size=128`;
            html += `
            <div class="card border-0 shadow-sm rounded-4 mb-3">
                <div class="card-body p-3">
                    <div class="d-flex gap-2 align-items-center mb-2">
                        <img src="${dpUrl}" class="rounded-circle border" width="40" height="40">
                        <div><h6 class="mb-0 fw-bold">${data.userName}</h6></div>
                    </div>
                    <p class="mb-3">${data.text}</p>
                    <div class="d-flex justify-content-between border-top pt-2">
                         <i class="bi bi-heart"></i> <i class="bi bi-chat"></i> <i class="bi bi-share"></i>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    });
}

function savePost() {
    const text = document.getElementById('post-text').value;
    const btn = document.querySelector('#createPostModal .btn-primary');
    if(!text.trim()) return;

    btn.innerText = "Posting..."; btn.disabled = true;

    db.collection("posts").add({
        text: text,
        userName: auth.currentUser.displayName || "User",
        userEmail: auth.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('post-text').value = "";
        
        // Force Close Modal
        const modalEl = document.getElementById('createPostModal');
        let modal = bootstrap.Modal.getInstance(modalEl);
        if(!modal) modal = new bootstrap.Modal(modalEl);
        modal.hide();
        
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style = "";
        
        btn.innerText = "Post"; btn.disabled = false;
    });
}

function openEditProfile() {
    new bootstrap.Modal(document.getElementById('editProfileModal')).show();
}

function saveProfileChanges() {
    const newName = document.getElementById('edit-name').value;
    if(!newName) return;
    
    auth.currentUser.updateProfile({ displayName: newName }).then(() => {
        updateProfileUI(auth.currentUser);
        // Force Close Modal
        const modalEl = document.getElementById('editProfileModal');
        let modal = bootstrap.Modal.getInstance(modalEl);
        if(!modal) modal = new bootstrap.Modal(modalEl);
        modal.hide();
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style = "";
    });
}

// Nav
function switchTab(screenId, navEl) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
    document.querySelectorAll('.nav-item-btn').forEach(btn => btn.classList.remove('active'));
    if(navEl) navEl.classList.add('active');
    
    const fab = document.getElementById('fab-btn');
    if(fab) fab.style.display = (screenId === 'home') ? 'flex' : 'none';
}
function openScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id + '-screen').classList.add('active');
}
