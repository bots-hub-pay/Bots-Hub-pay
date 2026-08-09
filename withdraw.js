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

    document.getElementById('currentBalance').textContent = '₹' + (currentUser.balance || 0).toFixed(2);

    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('withdrawAmount').value = this.dataset.amount;
        });
    });

    document.getElementById('withdrawForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const method = document.getElementById('withdrawMethod').value;
        const account = document.getElementById('accountDetails').value.trim();
        const pin = document.getElementById('withdrawPin').value.trim();

        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        if (amount > (currentUser.balance || 0)) {
            showToast('❌ Insufficient balance', 'error');
            return;
        }
        if (!method) {
            showToast('Please select a withdraw method', 'error');
            return;
        }
        if (!account) {
            showToast('Please enter account details', 'error');
            return;
        }
        if (!pin || pin.length !== 4) {
            showToast('Please enter a valid 4-digit PIN', 'error');
            return;
        }

        if (currentUser.transactionPin && currentUser.transactionPin !== pin) {
            showToast('❌ Incorrect PIN', 'error');
            return;
        }

        const request = {
            id: Date.now().toString(),
            type: 'withdraw',
            userPhone: currentUser.phone,
            userName: currentUser.fullName || 'User',
            amount: amount,
            method: method,
            account: account,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        const ownerData = JSON.parse(localStorage.getItem('ownerData') || '{}');
        if (!ownerData.pendingApprovals) ownerData.pendingApprovals = [];
        ownerData.pendingApprovals.push(request);
        localStorage.setItem('ownerData', JSON.stringify(ownerData));

        if (!currentUser.pendingApprovals) currentUser.pendingApprovals = [];
        currentUser.pendingApprovals.push(request);
        updateUserInDatabase(currentUser);

        showToast('✅ Withdrawal request sent for approval!', 'success');
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