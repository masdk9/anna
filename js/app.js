// CONFIG
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

// AUTH
auth.onAuthStateChanged(user => {
    if (user) {
        document.body.classList.add('logged-in');
        updateProfileUI(user);
        loadPosts();
    } else {
        document.body.classList.remove('logged-in');
    }
});

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => document.getElementById('auth-error').innerText = e.message);
}

function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-pass').value;
    const name = document.getElementById('signup-name').value;
    auth.createUserWithEmailAndPassword(email, pass).then(cred => {
        cred.user.updateProfile({ displayName: name }).then(() => location.reload());
    }).catch(e => document.getElementById('signup-error').innerText = e.message);
}
function handleLogout() { if(confirm("Logout?")) auth.signOut(); }

// APP LOGIC
function switchTab(id, el) {
    document.querySelectorAll('.container .screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id + '-screen').classList.add('active');
    
    document.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    const fab = document.getElementById('fab-btn');
    fab.style.display = (id === 'home') ? 'flex' : 'none';
}

function openScreen(id) {
    document.querySelectorAll('.container .screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id + '-screen').classList.add('active');
    document.getElementById('fab-btn').style.display = 'none';
}

// FIX: Study Filter Navigation Logic
function filterStudy(category, btn) {
    // 1. Highlight Button
    const allBtns = document.getElementById('study-tabs').querySelectorAll('button');
    allBtns.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-light', 'border');
    });
    btn.classList.remove('btn-light', 'border');
    btn.classList.add('btn-primary');

    // 2. Logic (Yahan aage chalkar content change hoga)
    console.log("Category Selected:", category);
    // Abhi ke liye bas visual change hai, taaki user ko lage navigation ho raha hai.
}

function loadPosts() {
    const container = document.getElementById('posts-container');
    db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snap => {
        let html = "";
        snap.forEach(doc => {
            let data = doc.data();
            let dp = `https://ui-avatars.com/api/?name=${data.userName}&background=random&color=fff`;
            html += `
            <div class="card border-0 shadow-sm rounded-4 mb-3">
                <div class="card-body p-3">
                    <div class="d-flex gap-2 align-items-center mb-2">
                        <img src="${dp}" class="rounded-circle" width="40" height="40">
                        <div><h6 class="mb-0 fw-bold">${data.userName}</h6></div>
                    </div>
                    <p>${data.text}</p>
                    <div class="d-flex justify-content-between pt-2 border-top text-muted">
                        <i class="bi bi-chat"></i><i class="bi bi-heart"></i><i class="bi bi-share"></i>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html || "<p class='text-center mt-5'>No posts yet</p>";
    });
}

function savePost() {
    const text = document.getElementById('post-text').value;
    if(!text) return;
    db.collection("posts").add({
        text: text,
        userName: auth.currentUser.displayName || "User",
        userEmail: auth.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('post-text').value = "";
        bootstrap.Modal.getInstance(document.getElementById('createPostModal')).hide();
    });
}

function togglePoll() {
    const s = document.getElementById('poll-section');
    s.style.display = s.style.display === 'none' ? 'block' : 'none';
}

function updateProfileUI(user) {
    if(document.getElementById('profile-name-display')) {
        document.getElementById('profile-name-display').innerText = user.displayName || "User";
        document.getElementById('profile-email-display').innerText = "@" + user.email.split('@')[0];
        document.getElementById('profile-img-display').src = `https://ui-avatars.com/api/?name=${user.displayName}&background=0d6efd&color=fff`;
    }
    // Update Account Centre Fields
    if(document.getElementById('ac-name')) document.getElementById('ac-name').value = user.displayName;
    if(document.getElementById('ac-email')) document.getElementById('ac-email').value = user.email;
    if(document.getElementById('ac-username')) document.getElementById('ac-username').value = user.email.split('@')[0];
}

function openSettings() { document.getElementById('settings-screen').classList.add('active'); }
function closeSettings() { document.getElementById('settings-screen').classList.remove('active'); }
function openAccountCentre() { document.getElementById('account-screen').classList.add('active'); }
function closeAccountCentre() { document.getElementById('account-screen').classList.remove('active'); }

function saveProfileChanges() {
    const n = document.getElementById('ac-name').value;
    if(n) auth.currentUser.updateProfile({displayName: n}).then(() => location.reload());
}
function toggleDarkMode() {
    document.body.classList.toggle('dark-theme');
}
