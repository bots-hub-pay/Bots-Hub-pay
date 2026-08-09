// Top of file mein yeh line add karein
const API_URL = 'https://bots-hub-pay.onrender.com/api';
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    const userPhone = sessionStorage.getItem('userPhone');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    let currentUser = users.find(user => user.phone === userPhone);

    if (!currentUser) {
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('editFullName').value = currentUser.fullName || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('avatarText').textContent = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U';

    document.getElementById('editProfileForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const fullName = document.getElementById('editFullName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const newPassword = document.getElementById('editPassword').value.trim();

        if (!fullName) {
            showToast('Full name is required', 'error');
            return;
        }
        if (!email) {
            showToast('Email is required', 'error');
            return;
        }

        currentUser.fullName = fullName;
        currentUser.email = email;
        if (newPassword && newPassword.length >= 6) {
            currentUser.password = newPassword;
        } else if (newPassword && newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (!currentUser.activities) currentUser.activities = [];
        currentUser.activities.unshift({
            text: 'Updated profile information',
            icon: 'fa-solid fa-user',
            color: 'blue',
            time: new Date().toISOString()
        });

        updateUserInDatabase(currentUser);
        sessionStorage.setItem('userName', currentUser.fullName);

        showToast('✅ Profile updated successfully!', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    });
});

function updateUserInDatabase(user) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.phone === user.phone);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function showToast(message, type) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    const colors = {
        success: 'linear-gradient(135deg, #00c853, #00e676)',
        error: 'linear-gradient(135deg, #ff1744, #ff5252)',
        info: 'linear-gradient(135deg, #4169ff, #6a4bff)'
    };
    toast.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8);
        background: ${colors[type] || colors.info}; color: #fff;
        padding: 1.2rem 2rem; border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3); z-index: 10000;
        font-weight: 600; font-size: 1rem; opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        max-width: 90%; text-align: center; display: flex; align-items: center; gap: 0.8rem;
    `;
    const icon = type === 'success' ? 'fa-solid fa-check-circle' : 
                 type === 'error' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-info';
    toast.innerHTML = `<i class="${icon}" style="font-size:1.5rem;"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}