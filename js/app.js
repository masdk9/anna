// ==========================================
//  FIREBASE & INIT
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
//  SCREEN LOGIC
// ==========================================
function enterApp(user) {
    document.getElementById('auth-screen').classList.remove('active');
    document.body.classList.remove('not-logged-in');
    updateProfileUI(user);
    loadPosts();
    loadTheme();
}
function exitApp() {
    document.body.classList.add('not-logged-in');
    document.getElementById('auth-screen').classList.add('active');
}
auth.onAuthStateChanged(user => user ? enterApp(user) : exitApp());

// ==========================================
//  LOGIN / SIGNUP
// ==========================================
function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if(!email || !pass) return alert("Enter email & password");
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
}
function handleSignup() {
    const email = document.getElementById('signup-email').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const pass = document.getElementById('signup-pass').value.trim();
    if(!email || !pass) return alert("Fill all fields");
    auth.createUserWithEmailAndPassword(email, pass)
        .then(cred => cred.user.updateProfile({ displayName: name }).then(() => location.reload()))
        .catch(e => alert(e.message));
}
function handleLogout() { if(confirm("Logout?")) auth.signOut(); }

// ==========================================
//  POSTS (Part 3 - Updated Footer)
// ==========================================
function loadPosts() {
    const container = document.getElementById('posts-container');
    db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            let data = doc.data();
            let username = "@" + (data.userEmail ? data.userEmail.split('@')[0] : "user");
            let dp = `https://ui-avatars.com/api/?name=${data.userName}&background=random&color=fff`;

            html += `
            <div class="card border-0 shadow-sm rounded-4 mb-3">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex gap-2 align-items-center">
                            <img src="${dp}" class="rounded-circle" width="45" height="45">
                            <div style="line-height:1.2">
                                <h6 class="mb-0 fw-bold text-dark">${data.userName}</h6>
                                <small class="text-muted">${username}</small>
                            </div>
                        </div>
                        <i class="bi bi-three-dots-vertical text-muted"></i>
                    </div>
                    <p class="mb-3 mt-2 text-dark" style="font-size:15px;">${data.text}</p>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top text-muted px-2">
                        <div class="d-flex align-items-center gap-1"><i class="bi bi-chat"></i> <small>12</small></div>
                        <div class="d-flex align-items-center gap-1"><i class="bi bi-heart"></i> <small>45</small></div>
                        <div class="d-flex align-items-center gap-1"><i class="bi bi-bar-chart"></i> <small>1.2k</small></div>
                        <i class="bi bi-bookmark"></i> <i class="bi bi-share"></i>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html || "<p class='text-center mt-5 text-muted'>No posts yet</p>";
    });
}

// ==========================================
//  CREATE POST & POLLS
// ==========================================
function togglePoll() {
    const section = document.getElementById('poll-section');
    section.style.display = (section.style.display === 'none') ? 'block' : 'none';
}

function savePost() {
    const text = document.getElementById('post-text').value;
    const btn = document.querySelector('#createPostModal .btn-primary');
    const isPoll = document.getElementById('poll-section').style.display === 'block';

    if(!text && !isPoll) return alert("Write something!");

    btn.innerText = "Posting..."; btn.disabled = true;

    db.collection("posts").add({
        text: text,
        type: isPoll ? 'poll' : 'text', 
        userName: auth.currentUser.displayName || "User",
        userEmail: auth.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('post-text').value = "";
        document.getElementById('poll-section').style.display = 'none';
        
        // Close Modal
        const el = document.getElementById('createPostModal');
        const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
        modal.hide();
        document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
        document.body.classList.remove('modal-open');
        document.body.style = "";
        
        btn.innerText = "Post"; btn.disabled = false;
    });
}

// ==========================================
//  ACCOUNT, SETTINGS & NAVIGATION
// ==========================================
function openAccountCentre() {
    document.getElementById('account-screen').classList.add('active');
    document.querySelector('.nav-wrapper').style.display = 'none';
    const u = auth.currentUser;
    document.getElementById('ac-name').value = u.displayName || "";
    document.getElementById('ac-email').value = u.email;
    document.getElementById('ac-username').value = u.email.split('@')[0];
    document.getElementById('ac-img').src = `https://ui-avatars.com/api/?name=${u.displayName}&background=0d6efd&color=fff`;
}

function closeAccountCentre() {
    document.getElementById('account-screen').classList.remove('active');
    document.querySelector('.nav-wrapper').style.display = 'flex';
}

function saveProfileChanges() {
    const newName = document.getElementById('ac-name').value;
    if(newName) {
        auth.currentUser.updateProfile({displayName: newName}).then(() => {
            alert("Profile Updated");
            location.reload();
        });
    }
}

function updateProfileUI(user) {
    if(document.getElementById('profile-name-display')) {
        document.getElementById('profile-name-display').innerText = user.displayName || "User";
        document.getElementById('profile-email-display').innerText = "@" + user.email.split('@')[0];
        document.getElementById('profile-img-display').src = `https://ui-avatars.com/api/?name=${user.displayName}&background=0d6efd&color=fff`;
    }
}

function openSettings() {
    document.getElementById('settings-screen').classList.add('active');
    document.querySelector('.nav-wrapper').style.display = 'none';
}
function closeSettings() {
    document.getElementById('settings-screen').classList.remove('active');
    document.querySelector('.nav-wrapper').style.display = 'flex';
}
function toggleDarkMode() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}
function loadTheme() {
    if(localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        if(document.getElementById('dark-mode-toggle')) document.getElementById('dark-mode-toggle').checked = true;
    }
}

// Navigation Logic
function openScreen(id) {
    document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
    document.getElementById(id + '-screen').classList.add('active');
}
function switchTab(id, el) {
    openScreen(id);
    document.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    // Show FAB only on Home
    const fab = document.getElementById('fab-btn');
    if(fab) fab.style.display = (id === 'home') ? 'flex' : 'none';
}
