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

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.style.background = '#1a1a2e';
            document.querySelector('.page-card').style.background = '#16213e';
            document.querySelector('.page-card').style.color = '#fff';
            document.querySelectorAll('.settings-item-title').forEach(el => el.style.color = '#fff');
            document.querySelectorAll('.settings-item-desc').forEach(el => el.style.color = '#6b7280');
            document.querySelector('.page-header h1').style.color = '#fff';
        } else {
            document.body.style.background = '#f0f2f5';
            document.querySelector('.page-card').style.background = '#fff';
            document.querySelector('.page-card').style.color = '#1a1a2e';
            document.querySelectorAll('.settings-item-title').forEach(el => el.style.color = '#1a1a2e');
            document.querySelectorAll('.settings-item-desc').forEach(el => el.style.color = '#6b7280');
            document.querySelector('.page-header h1').style.color = '#1a1a2e';
        }
    });

    // Notification toggle
    document.getElementById('notificationToggle').addEventListener('change', function() {
        const status = this.checked ? 'enabled' : 'disabled';
        showToast(`🔔 Notifications ${status}!`, 'info');
    });

    // Change PIN
    document.getElementById('changePinBtn').addEventListener('click', function() {
        const current = prompt('Enter your current 4-digit PIN:');
        if (!current) return;
        if (currentUser.transactionPin && currentUser.transactionPin !== current) {
            showToast('❌ Incorrect current PIN!', 'error');
            return;
        }
        const newPin = prompt('Enter new 4-digit PIN:');
        if (!newPin || newPin.length !== 4 || !/^[0-9]{4}$/.test(newPin)) {
            showToast('Please enter a valid 4-digit PIN', 'error');
            return;
        }
        const confirm = prompt('Confirm new 4-digit PIN:');
        if (newPin !== confirm) {
            showToast('❌ PINs do not match!', 'error');
            return;
        }
        currentUser.transactionPin = newPin;
        updateUserInDatabase(currentUser);
        showToast('✅ PIN changed successfully!', 'success');
    });

    // Reset Data
    document.getElementById('resetDataBtn').addEventListener('click', function() {
        if (!confirm('⚠️ This will clear all your transactions, activities and reset balance to ₹0.\n\nAre you sure?')) return;
        if (!confirm('⚠️ Final warning: This cannot be undone!')) return;

        currentUser.balance = 0;
        currentUser.totalFundAdded = 0;
        currentUser.totalWithdrawn = 0;
        currentUser.totalSent = 0;
        currentUser.totalReceived = 0;
        currentUser.activities = [];
        currentUser.transactions = [];
        currentUser.pendingApprovals = [];

        updateUserInDatabase(currentUser);
        showToast('✅ Account data has been reset successfully!', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    });

    // Delete Account
    document.getElementById('deleteAccountBtn').addEventListener('click', function() {
        const confirm = window.confirm(
            '⚠️ WARNING: This action is irreversible!\n\n' +
            'Are you sure you want to permanently delete your account?\n' +
            'All your data will be lost.'
        );
        if (confirm) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const filteredUsers = users.filter(u => u.phone !== userPhone);
            localStorage.setItem('users', JSON.stringify(filteredUsers));
            sessionStorage.clear();
            showToast('Your account has been permanently deleted.', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        }
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