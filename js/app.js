// --- 1. FIREBASE CONFIG ---
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

// --- 2. LOGIN LOGIC (MAIN FIX) ---
auth.onAuthStateChanged(user => {
    const authScreen = document.getElementById('auth-screen');
    const appInterface = document.getElementById('app-interface');

    if (user) {
        // Login Successful
        authScreen.style.display = 'none';
        appInterface.style.display = 'block';
        updateProfileUI(user);
        loadPosts();
    } else {
        // Logout / No User
        authScreen.style.display = 'flex';
        appInterface.style.display = 'none';
    }
});

function handleLogin() {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    auth.signInWithEmailAndPassword(e, p).catch(err => {
        document.getElementById('login-error').innerText = err.message;
    });
}

function handleSignup() {
    const n = document.getElementById('signup-name').value;
    const e = document.getElementById('signup-email').value;
    const p = document.getElementById('signup-pass').value;
    auth.createUserWithEmailAndPassword(e, p).then(cred => {
        cred.user.updateProfile({ displayName: n }).then(() => location.reload());
    }).catch(err => alert(err.message));
}
function handleLogout() { if(confirm("Logout?")) auth.signOut(); }

// --- 3. TAB SWITCHING ---
function switchTab(id, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id + '-screen').classList.add('active');
    
    document.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    const fab = document.getElementById('fab-btn');
    fab.style.display = (id === 'home') ? 'flex' : 'none';
}

function openScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id + '-screen').classList.add('active');
}

// --- 4. STUDY TABS LOGIC ---
function filterStudy(cat, btn) {
    const btns = document.getElementById('study-tabs').querySelectorAll('button');
    btns.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-light', 'border');
    });
    btn.classList.remove('btn-light', 'border');
    btn.classList.add('btn-primary');
}

// --- 5. DATA ---
function loadPosts() {
    const container = document.getElementById('posts-container');
    db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snap => {
        if(snap.empty) { container.innerHTML = "<p class='text-center mt-5'>No posts yet</p>"; return; }
        let html = "";
        snap.forEach(doc => {
            let d = doc.data();
            let dp = `https://ui-avatars.com/api/?name=${d.userName}&background=random&color=fff`;
            html += `
            <div class="card border-0 shadow-sm rounded-4 mb-3">
                <div class="card-body p-3">
                    <div class="d-flex gap-2 align-items-center mb-2">
                        <img src="${dp}" class="rounded-circle" width="40" height="40">
                        <div><h6 class="mb-0 fw-bold">${d.userName}</h6></div>
                    </div>
                    <p>${d.text}</p>
                    <div class="d-flex justify-content-between pt-2 border-top text-muted">
                        <i class="bi bi-chat"></i><i class="bi bi-heart"></i><i class="bi bi-share"></i>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    });
}

function savePost() {
    const txt = document.getElementById('post-text').value;
    if(!txt) return;
    db.collection("posts").add({
        text: txt,
        userName: auth.currentUser.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('post-text').value = "";
        bootstrap.Modal.getInstance(document.getElementById('createPostModal')).hide();
    });
}

function updateProfileUI(user) {
    document.getElementById('profile-name-display').innerText = user.displayName;
    document.getElementById('profile-email-display').innerText = user.email;
    document.getElementById('profile-img-display').src = `https://ui-avatars.com/api/?name=${user.displayName}&background=0d6efd&color=fff`;
    document.getElementById('ac-name').value = user.displayName;
}

function openSettings() { document.getElementById('settings-screen').classList.add('active'); }
function closeSettings() { document.getElementById('settings-screen').classList.remove('active'); }
function openAccountCentre() { document.getElementById('account-screen').classList.add('active'); }
function closeAccountCentre() { document.getElementById('account-screen').classList.remove('active'); }

function saveProfileChanges() {
    const n = document.getElementById('ac-name').value;
    auth.currentUser.updateProfile({displayName: n}).then(() => location.reload());
}
function toggleDarkMode() { document.body.classList.toggle('dark-theme'); }
