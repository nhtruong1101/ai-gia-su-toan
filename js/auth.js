let currentUser = null;
const DOMAIN = "@aigiasutoan.local"; // Fake domain để dùng username cho Firebase Auth

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in using Firebase Auth State
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            const dbUser = await DB.getUser(user.uid);
            if (dbUser) {
                currentUser = dbUser;
                switchView();
            } else {
                // Có thể là admin mặc định tạo tay trên console
                currentUser = { uid: user.uid, username: user.email.replace(DOMAIN, ''), role: 'admin' };
                switchView();
            }
        } else {
            // No user is signed in
            currentUser = null;
            showView('authView');
        }
    });

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabId = btn.getAttribute('data-tab');
            document.getElementById('loginForm').classList.toggle('active', tabId === 'login');
            document.getElementById('loginForm').classList.toggle('hidden', tabId !== 'login');
            
            document.getElementById('registerForm').classList.toggle('active', tabId === 'register');
            document.getElementById('registerForm').classList.toggle('hidden', tabId !== 'register');
            
            clearErrors();
        });
    });

    // Login Form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUsername').value.trim();
        const pass = document.getElementById('loginPassword').value.trim();
        const email = user + DOMAIN;
        
        try {
            document.querySelector('#loginForm button[type="submit"]').disabled = true;
            await firebase.auth().signInWithEmailAndPassword(email, pass);
            // onAuthStateChanged sẽ tự chuyển view
            document.getElementById('loginForm').reset();
        } catch (error) {
            showError('loginError', 'Tên đăng nhập hoặc mật khẩu không đúng');
        } finally {
            document.querySelector('#loginForm button[type="submit"]').disabled = false;
        }
    });

    // Register Form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('regUsername').value.trim();
        const pass = document.getElementById('regPassword').value.trim();
        const passConfirm = document.getElementById('regPasswordConfirm').value.trim();
        const email = user + DOMAIN;
        
        if (pass !== passConfirm) {
            showError('regError', 'Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            document.querySelector('#registerForm button[type="submit"]').disabled = true;
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, pass);
            // Lưu thêm thông tin vào Firestore
            await DB.saveUserToFirestore(userCredential.user.uid, user, 'user');
            
            alert('Đăng ký thành công!');
            // onAuthStateChanged sẽ tự động đăng nhập và chuyển view
            document.getElementById('registerForm').reset();
        } catch (error) {
            let msg = 'Đã có lỗi xảy ra';
            if (error.code === 'auth/email-already-in-use') msg = 'Tên đăng nhập đã tồn tại';
            if (error.code === 'auth/weak-password') msg = 'Mật khẩu phải có ít nhất 6 ký tự';
            showError('regError', msg);
        } finally {
            document.querySelector('#registerForm button[type="submit"]').disabled = false;
        }
    });

    // Logout
    document.getElementById('logoutBtnUser').addEventListener('click', logout);
    document.getElementById('logoutBtnAdmin').addEventListener('click', logout);
});

async function logout() {
    await firebase.auth().signOut();
}

function switchView() {
    if (!currentUser) {
        showView('authView');
        return;
    }

    if (currentUser.role === 'admin') {
        showView('adminView');
        if (typeof loadAdminData === 'function') loadAdminData();
    } else {
        showView('userView');
        document.getElementById('currentUserDisplay').textContent = currentUser.username;
        if (typeof updateUsageDisplay === 'function') updateUsageDisplay();
    }
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'hidden'));
    document.querySelectorAll('.view').forEach(v => {
        if(v.id === viewId) v.classList.add('active');
        else v.classList.add('hidden');
    });
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

function clearErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('regError').textContent = '';
}
