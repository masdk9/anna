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

function enterApp(user) {
    console.log("Entering App: " + user.email);

    // 1. Screens Toggle
    const authScreen = document.getElementById('auth-screen');
    if(authScreen) authScreen.classList.remove('active');
    document.body.classList.remove('not-logged-in');
    
    // 2. Load Home
    switchTab('home', document.querySelector('.nav-item-btn'));

    // 3. User Data Set Karo
    updateProfileUI(user);
    
    // 4. Posts Load Karo
    loadPosts();
}

function exitApp() {
    console.log("Exiting App...");
    document.body.classList.add('not-logged-in');
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    
    const authScreen = document.getElementById('auth-screen');
    if(authScreen) authScreen.classList.add('active');
}

// UI Update Helper (Bina Reload kiye data dikhane ke liye)
function updateProfileUI(user) {
    // Profile Page Data
    if(document.getElementById('profile-email-display')) {
        document.getElementById('profile-email-display').innerText = user.email;
        document.getElementById('profile-name-display').innerText = user.displayName || "User";
        
        // DP Update
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
//  3. AUTH LISTENER
// ==========================================
auth.onAuthStateChanged((user) => {
    if (user) {
        enterApp(user);
    } else {
        exitApp();
    }
});

// ==========================================
//  4. LOGIN & SIGNUP logic
// ==========================================
function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const btn = document.querySelector('.login button'); 
    const errorDiv = document.getElementById('auth-error');

    if(errorDiv) errorDiv.innerText = "";

    if(!email || !pass) {
        if(errorDiv) errorDiv.innerText = "Please enter email and password";
        return;
    }

    btn.innerText = "Please wait...";
    btn.disabled = true;

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            btn.innerText = "Success! 🔓";
            // onAuthStateChanged handle karega entry
        })
        .catch((error) => {
            btn.innerText = "Login"; 
            btn.disabled = false;
            if(errorDiv) {
                errorDiv.innerText = error.message.replace('Firebase: ', '');
                errorDiv.style.color = 'red';
            }
        });
}

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
                location.reload(); 
            });
        })
        .catch((error) => {
            if(errorDiv) errorDiv.innerText = error.message;
        });
}

function handleLogout() {
    if(confirm("Are you sure you want to logout?")) {
        auth.signOut().then(() => {
            exitApp();
        });
    }
}

// ==========================================
//  5. POSTS LOGIC (Fixed Popup & Loading)
// ==========================================

function loadPosts() {
    const container = document.getElementById('posts-container');
    if(!container) return;
    
    // Loading Spinner (Jab tak data na aaye)
    container.innerHTML = `
        <div class="text-center mt-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted small mt-2">Loading feed...</p>
        </div>`;
    
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
    const postBtn = document.querySelector('#createPostModal .btn-primary');

    if (!text.trim()) return alert("Post cannot be empty!");
    
    postBtn.innerText = "Posting...";
    postBtn.disabled = true;

    db.collection("posts").add({
        text: text,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0
    }).then(() => {
        // 1. Clear Input
        document.getElementById('post-text').value = "";
        
        // 2. CLOSE MODAL (Fixed Logic)
        const modalEl = document.getElementById('createPostModal');
        
        // Try Bootstrap method
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) modal = new bootstrap.Modal(modalEl); // Agar instance kho gaya to naya banao
        modal.hide();

        // 3. FORCE CLEANUP (Agar backdrop chipak jaye)
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(bd => bd.remove());
        document.body.classList.remove('modal-open');
        document.body.style = "";

        postBtn.innerText = "Post";
        postBtn.disabled = false;
    });
}

// ==========================================
//  6. PROFILE EDIT (Instant Update - No Reload)
// ==========================================

function openEditProfile() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

function saveProfileChanges() {
    const newName = document.getElementById('edit-name').value;
    const btn = document.querySelector('#editProfileModal .btn-primary');

    if (!newName.trim()) return alert("Name cannot be empty!");

    btn.innerText = "Saving...";
    btn.disabled = true;

    auth.currentUser.updateProfile({ displayName: newName }).then(() => {
        // 1. UI Update (Instant)
        document.getElementById('profile-name-display').innerText = newName;
        // DP bhi update kar do
        const dpUrl = `https://ui-avatars.com/api/?name=${newName}&background=0d6efd&color=fff`;
        document.getElementById('profile-img-display').src = dpUrl;

        // 2. Close Modal
        const modalEl = document.getElementById('editProfileModal');
        let modal = bootstrap.Modal.getInstance(modalEl);
        if (!modal) modal = new bootstrap.Modal(modalEl);
        modal.hide();
        
        // Force cleanup backdrop
        document.querySelectorAll('.modal-backdrop').forEach(bd => bd.remove());
        document.body.classList.remove('modal-open');
        document.body.style = "";

        // Reset Button
        btn.innerText = "Save Changes";
        btn.disabled = false;
        
    }).catch(err => {
        alert("Error: " + err.message);
        btn.innerText = "Save Changes";
        btn.disabled = false;
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





// ==========================================
//  8. SETTINGS & DARK MODE LOGIC
// ==========================================

// Settings Page Kholne ka function
function openSettings() {
    // Current screen chupao
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    // Settings dikhao
    document.getElementById('settings-screen').classList.add('active');
    // Bottom Nav hatao (optional, agar full screen feel deni hai)
    document.querySelector('.nav-wrapper').style.display = 'none';
}

// Settings Band karne ka function
function closeSettings() {
    // Settings chupao
    document.getElementById('settings-screen').classList.remove('active');
    // Wapas Profile screen dikhao
    document.getElementById('profile-screen').classList.add('active');
    // Bottom Nav wapas lao
    document.querySelector('.nav-wrapper').style.display = 'flex';
}

// Dark Mode Toggle Logic
function toggleDarkMode() {
    const isDark = document.getElementById('dark-mode-toggle').checked;
    
    if (isDark) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark'); // Save karo
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light'); // Save karo
    }
}

// App start hote hi check karo ki user ne pehle kya chuna tha
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('dark-mode-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if(toggle) toggle.checked = true;
    }
}

// Is function ko sabse upar call karwa do (Initialize)
loadTheme();



// Settings Page Kholne ka function
function openSettings() {
    document.getElementById('settings-screen').classList.add('active');
    // Bottom navigation ko chhupa do taaki full screen dikhe
    document.querySelector('.nav-wrapper').style.display = 'none';
    document.getElementById('fab-btn').style.display = 'none';
}

// Settings Band karne ka function
function closeSettings() {
    document.getElementById('settings-screen').classList.remove('active');
    // Bottom navigation wapas lao
    document.querySelector('.nav-wrapper').style.display = 'flex';
    document.getElementById('fab-btn').style.display = 'flex';
}









