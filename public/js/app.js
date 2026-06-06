let currentUser = null;
let isSignUpMode = false;

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    checkLoginStatus();
});

function setupEventListeners() {
    console.log('Setting up event listeners');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);
        });
    });

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            isSignUpMode = false;
            updateAuthMode();
            document.getElementById('loginModal').style.display = 'block';
        });
    }

    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    document.getElementById('loginForm').addEventListener('submit', handleAuth);
    
    // Toggle auth mode
    const authToggleBtn = document.getElementById('authToggleBtn');
    if (authToggleBtn) {
        authToggleBtn.addEventListener('click', () => {
            isSignUpMode = !isSignUpMode;
            updateAuthMode();
        });
    }
    
    const welfareBtn = document.getElementById('submitWelfareBtn');
    if (welfareBtn) {
        welfareBtn.addEventListener('click', () => {
            document.getElementById('welfareModal').style.display = 'block';
        });
    }
    
    const welfareForm = document.getElementById('welfareForm');
    if (welfareForm) {
        welfareForm.addEventListener('submit', handleWelfareSubmit);
    }
    
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    document.getElementById('uploadType').addEventListener('change', handleUploadTypeChange);
    
    // Add Bus Schedule button
    const addBusBtn = document.getElementById('addBusBtn');
    if (addBusBtn) {
        addBusBtn.addEventListener('click', () => {
            showSection('upload');
            document.getElementById('uploadType').value = 'bus';
            handleUploadTypeChange();
        });
    }
    
    // Inbox Widget
    const inboxWidget = document.getElementById('inboxWidget');
    if (inboxWidget) {
        inboxWidget.addEventListener('click', () => {
            showSection('inbox');
        });
    }

    // Change Password Form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    // Reset Password Form
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    const navItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
}

function checkLoginStatus() {
    fetch('/api/check-login')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                currentUser = data.user;
                updateUserSection();
            }
        })
        .catch(err => console.error('Error checking login status:', err));
}

function updateAuthMode() {
    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('authToggleText');
    const toggleBtn = document.getElementById('authToggleBtn');
    const confirmGroup = document.getElementById('confirmPasswordGroup');
    
    if (isSignUpMode) {
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleBtn.textContent = 'Login';
        confirmGroup.style.display = 'block';
    } else {
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = 'Sign Up';
        confirmGroup.style.display = 'none';
    }
}

function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = isSignUpMode ? document.getElementById('confirmPassword').value : null;

    const url = isSignUpMode ? '/api/signup' : '/api/login';
    const body = isSignUpMode 
        ? JSON.stringify({ username, password, confirmPassword })
        : JSON.stringify({ username, password });

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('loginForm').reset();
            updateUserSection();
            loadData();
        } else {
            alert(data.message || 'Invalid credentials');
        }
    })
    .catch(err => console.error('Error in auth:', err));
}

function updateUserSection() {
    const userSection = document.getElementById('userSection');
    userSection.innerHTML = `
        <div id="userInfo">Welcome, ${currentUser.username} (${currentUser.role})</div>
        <button class="secondary-btn" id="changePasswordBtn">Change Password</button>
        ${currentUser.role === 'admin' ? '<button class="secondary-btn" id="resetPasswordBtn">Reset User Password</button>' : ''}
        <button class="secondary-btn" id="logoutBtn">Logout</button>
    `;
    
    // Add listeners to new buttons
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        document.getElementById('changePasswordModal').style.display = 'block';
    });
    
    if (currentUser.role === 'admin') {
        document.getElementById('resetPasswordBtn').addEventListener('click', () => {
            document.getElementById('resetPasswordModal').style.display = 'block';
        });
    }

    if (currentUser.role === 'admin') {
        document.getElementById('uploadNav').style.display = 'block';
        document.getElementById('addBusBtn').style.display = 'inline-block';
        document.getElementById('inboxNav').style.display = 'block';
        document.getElementById('inboxWidget').style.display = 'flex';
    } else {
        document.getElementById('uploadNav').style.display = 'none';
        document.getElementById('addBusBtn').style.display = 'none';
        document.getElementById('inboxNav').style.display = 'none';
        document.getElementById('inboxWidget').style.display = 'none';
        if (document.querySelector('.content-section.active')?.id === 'inbox') {
            showSection('announcements');
        }
    }
}

function handleLogout() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => {
            currentUser = null;
            isSignUpMode = false;
            document.getElementById('userSection').innerHTML = '<button id="loginBtn">Login</button>';
            document.getElementById('loginBtn').addEventListener('click', () => {
                isSignUpMode = false;
                updateAuthMode();
                document.getElementById('loginModal').style.display = 'block';
            });
            document.getElementById('uploadNav').style.display = 'none';
            document.getElementById('addBusBtn').style.display = 'none';
            document.getElementById('inboxNav').style.display = 'none';
            document.getElementById('inboxWidget').style.display = 'none';
            if (document.querySelector('.content-section.active')?.id === 'inbox') {
                showSection('announcements');
            }
            loadData();
        });
}

function handleWelfareSubmit(e) {
    console.log('Welfare form submitted');
    e.preventDefault();
    const title = document.getElementById('welfareTitle').value;
    const description = document.getElementById('welfareDescription').value;

    fetch('/api/welfare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
    })
    .then(res => {
        console.log('Response status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            document.getElementById('welfareModal').style.display = 'none';
            document.getElementById('welfareForm').reset();
            loadData();
        } else {
            alert('Failed to submit concern');
        }
    })
    .catch(err => {
        console.error('Error submitting welfare concern:', err);
        alert('Error submitting concern: ' + err);
    });
}

function handleUploadTypeChange() {
    const type = document.getElementById('uploadType').value;
    document.getElementById('eventDateGroup').style.display = type === 'event' ? 'block' : 'none';
    document.getElementById('busTimeGroup').style.display = type === 'bus' ? 'block' : 'none';
    document.getElementById('busRouteGroup').style.display = type === 'bus' ? 'block' : 'none';
}

function handleUpload(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', document.getElementById('uploadType').value);
    formData.append('title', document.getElementById('uploadTitle').value);
    formData.append('description', document.getElementById('uploadDescription').value);
    formData.append('image', document.getElementById('uploadImage').files[0]);
    
    if (document.getElementById('uploadType').value === 'event') {
        formData.append('date', document.getElementById('eventDate').value);
    }
    if (document.getElementById('uploadType').value === 'bus') {
        formData.append('time', document.getElementById('busTime').value);
        formData.append('route', document.getElementById('busRoute').value);
    }

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('uploadForm').reset();
            loadData();
            showSection('announcements');
        }
    })
    .catch(err => console.error('Error uploading:', err));
}

function handleChangePassword(e) {
    e.preventDefault();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, confirmNewPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            document.getElementById('changePasswordModal').style.display = 'none';
            document.getElementById('changePasswordForm').reset();
        } else {
            alert(data.message || 'Failed to change password');
        }
    })
    .catch(err => {
        console.error('Error changing password:', err);
        alert('Error changing password');
    });
}

function handleResetPassword(e) {
    e.preventDefault();
    const resetUsername = document.getElementById('resetUsername').value;
    const newResetPassword = document.getElementById('newResetPassword').value;

    fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetUsername, newResetPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            document.getElementById('resetPasswordModal').style.display = 'none';
            document.getElementById('resetPasswordForm').reset();
        } else {
            alert(data.message || 'Failed to reset password');
        }
    })
    .catch(err => {
        console.error('Error resetting password:', err);
        alert('Error resetting password');
    });
}

function loadData() {
    Promise.all([
        fetch('/api/announcements').then(res => res.json()),
        fetch('/api/events').then(res => res.json()),
        fetch('/api/buses').then(res => res.json()),
        fetch('/api/welfare').then(res => res.json()),
        fetch('/api/inbox').then(res => res.json())
    ]).then(([announcements, events, buses, welfare, inbox]) => {
        renderAnnouncements(announcements);
        renderEvents(events);
        renderBuses(buses);
        renderWelfare(welfare);
        renderInbox(inbox);
        updateInboxCount(inbox.length);
    }).catch(err => console.error('Error loading data:', err));
}

function updateInboxCount(count) {
    document.getElementById('inboxCount').textContent = count;
}

function handleDelete(type, id) {
    if (confirm('Are you sure you want to delete this?')) {
        fetch(`/api/${type}/${id}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadData();
            }
        })
        .catch(err => console.error('Error deleting:', err));
    }
}

function renderAnnouncements(announcements) {
    const container = document.getElementById('announcementsContainer');
    container.innerHTML = announcements.map(a => `
        <div class="card announcement-card">
            <div class="card-header">
                <h3>${a.title}</h3>
                ${currentUser && currentUser.role === 'admin' 
                    ? `<button class="delete-btn" onclick="handleDelete('announcements', ${a.id})">Delete</button>`
                    : ''}
            </div>
            <div class="date">${new Date(a.date).toLocaleDateString()}</div>
            <p>${a.description}</p>
            ${a.image ? `<img src="uploads/${a.image}">` : ''}
        </div>
    `).join('');
}

function renderEvents(events) {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = events.map(e => `
        <div class="card event-card">
            <div class="card-header">
                <h3>${e.title}</h3>
                ${currentUser && currentUser.role === 'admin' 
                    ? `<button class="delete-btn" onclick="handleDelete('events', ${e.id})">Delete</button>`
                    : ''}
            </div>
            <div class="date">Date: ${new Date(e.date).toLocaleDateString()}</div>
            <p>${e.description}</p>
            ${e.image ? `<img src="uploads/${e.image}">` : ''}
        </div>
    `).join('');
}

function renderBuses(buses) {
    const container = document.getElementById('busScheduleContainer');
    container.innerHTML = buses.map(b => `
        <div class="card bus-card">
            <div class="card-header">
                <h3>${b.title}</h3>
                ${currentUser && currentUser.role === 'admin' 
                    ? `<button class="delete-btn" onclick="handleDelete('buses', ${b.id})">Delete</button>`
                    : ''}
            </div>
            <div class="date">Added: ${new Date(b.date).toLocaleDateString()}</div>
            <p>${b.description}</p>
            <div class="bus-info">
                <span>🕐 ${b.time}</span>
                <span>🛣️ ${b.route}</span>
            </div>
            ${b.image ? `<img src="uploads/${b.image}">` : ''}
        </div>
    `).join('');
}

function renderWelfare(welfare) {
    const container = document.getElementById('welfareContainer');
    container.innerHTML = welfare.map(w => `
        <div class="card welfare-card">
            <div class="card-header">
                <h3>${w.title}</h3>
                ${currentUser && currentUser.role === 'admin' 
                    ? `<button class="delete-btn" onclick="handleDelete('welfare', ${w.id})">Delete</button>`
                    : ''}
            </div>
            <div class="date">Submitted: ${new Date(w.date).toLocaleDateString()}</div>
            <p>${w.description}</p>
            ${w.image ? `<img src="uploads/${w.image}">` : ''}
        </div>
    `).join('');
}

function renderInbox(inbox) {
    const container = document.getElementById('inboxContainer');
    container.innerHTML = inbox.map(i => `
        <div class="card inbox-card">
            <div class="card-header">
                <h3>${i.title}</h3>
                ${currentUser && currentUser.role === 'admin' 
                    ? `<button class="delete-btn" onclick="handleDelete('inbox', ${i.id})">Delete</button>`
                    : ''}
            </div>
            <div class="date">${new Date(i.date).toLocaleDateString()}</div>
            <p>${i.message}</p>
            ${i.image ? `<img src="uploads/${i.image}">` : ''}
        </div>
    `).join('');
}
