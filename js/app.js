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

// Initialize Firebase (Check karta hai taaki double load na ho)
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

        // 👇 Yahan Posts load honge (Emoji hata diya hai ✅)
        loadPosts(); 
        
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
            // Screen apne aap change hogi (onAuthStateChanged ki wajah se)
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

// Error Message Cleaner
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


// ==========================================
//  4. POSTS LOGIC (CREATE & LOAD)
// ==========================================

// --- SAVE POST (Jab Post button dabega) ---
function savePost() {
    const text = document.getElementById('post-text').value;
    const user = auth.currentUser;

    if (!text.trim()) return alert("Post cannot be empty!");

    // Button ko disable karo
    const postBtn = document.querySelector('#createPostModal .btn-primary');
    postBtn.disabled = true;
    postBtn.innerText = "Posting...";

    // Firestore Database mein data bhejo
    db.collection("posts").add({
        text: text,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0
    }).then(() => {
        console.log("Post Saved!");
        document.getElementById('post-text').value = ""; // Box khali karo
        
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

// --- LOAD POSTS (Screen par dikhane ke liye) ---
function loadPosts() {
    const container = document.getElementById('posts-container');
    
    // Real-time listener
    db.collection("posts")
        .orderBy("timestamp", "desc") // Latest post upar
        .onSnapshot((snapshot) => {
            
            if(snapshot.empty) {
                container.innerHTML = `<div class="text-center mt-5 text-muted"><p>No posts yet. Be the first to post!</p></div>`;
                return;
            }

            let html = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Time formatter
                let timeString = "Just now";
                if(data.timestamp) {
                    const date = data.timestamp.toDate();
                    timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                // Random DP generate (User ke naam se)
                const dpUrl = `https://ui-avatars.com/api/?name=${data.userName}&background=random&color=fff`;

                // HTML Card Template
                html += `
                <div class="app-card">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <div class="user-dp-small" style="background-image: url('${dpUrl}');"></div>
                        <div>
                            <h6 class="m-0 fw-bold">${data.userName}</h6>
                            <small class="text-muted">${timeString}</small>
                        </div>
                    </div>
                    <div class="mb-2 fs-6" style="white-space: pre-wrap;">${data.text}</div>
                    
                    <div class="d-flex justify-content-between border-top pt-3 mt-2">
                        <div class="action-btn"><i class="bi bi-hand-thumbs-up"></i> Like</div>
                        <div class="action-btn"><i class="bi bi-chat-square-text"></i> Comment</div>
                        <div class="action-btn"><i class="bi bi-share"></i> Share</div>
                    </div>
                </div>
                `;
            });

            container.innerHTML = html;
        });
}




// ==========================================
//  5. PROFILE EDIT LOGIC (Account Centre)
// ==========================================

// 1. Modal Kholna
function openEditProfile() {
    const user = auth.currentUser;
    if(!user) return;

    // Purana naam aur email box me bharo
    document.getElementById('edit-name').value = user.displayName || "";
    document.getElementById('edit-email').value = user.email || "";

    // Modal dikhao
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

    // Button loading...
    btn.innerText = "Saving...";
    btn.disabled = true;

    // Firebase Update
    user.updateProfile({
        displayName: newName
    }).then(() => {
        alert("Profile Updated! ✅");
        location.reload(); // Page refresh karo taki naya naam dikhe
    }).catch((error) => {
        console.error(error);
        alert("Error: " + error.message);
        btn.innerText = "Save Changes";
        btn.disabled = false;
    });
}






