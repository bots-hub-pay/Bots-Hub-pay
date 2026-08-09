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

    const recipientPhoneInput = document.getElementById('recipientPhone');
    const recipientNameDisplay = document.getElementById('recipientNameDisplay');

    recipientPhoneInput.addEventListener('input', function() {
        const phone = this.value.trim();
        if (phone.length === 10) {
            const user = users.find(u => u.phone === phone);
            if (user && user.phone !== userPhone) {
                recipientNameDisplay.innerHTML = `<i class="fa-solid fa-check-circle" style="color:#00c853;"></i> ${user.fullName || 'User'}`;
                recipientNameDisplay.style.display = 'block';
                recipientNameDisplay.style.color = '#00c853';
            } else if (user && user.phone === userPhone) {
                recipientNameDisplay.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#ff9100;"></i> This is your own number`;
                recipientNameDisplay.style.display = 'block';
                recipientNameDisplay.style.color = '#ff9100';
            } else {
                recipientNameDisplay.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:#ff1744;"></i> User not found`;
                recipientNameDisplay.style.display = 'block';
                recipientNameDisplay.style.color = '#ff1744';
            }
        } else {
            recipientNameDisplay.style.display = 'none';
        }
    });

    document.getElementById('payUserForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const recipientPhone = document.getElementById('recipientPhone').value.trim();
        const amount = parseFloat(document.getElementById('payAmount').value);
        const note = document.getElementById('payNote').value.trim();
        const pin = document.getElementById('payPin').value.trim();

        if (!recipientPhone) {
            showToast('Please enter recipient phone number', 'error');
            return;
        }
        if (recipientPhone === userPhone) {
            showToast('❌ Cannot send money to yourself', 'error');
            return;
        }
        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        if (amount > (currentUser.balance || 0)) {
            showToast('❌ Insufficient balance', 'error');
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

        const recipient = users.find(u => u.phone === recipientPhone);
        if (!recipient) {
            showToast('❌ User not found', 'error');
            return;
        }

        // Process payment
        currentUser.balance = (currentUser.balance || 0) - amount;
        currentUser.totalSent = (currentUser.totalSent || 0) + amount;

        recipient.balance = (recipient.balance || 0) + amount;
        recipient.totalReceived = (recipient.totalReceived || 0) + amount;

        const tx = {
            type: 'sent',
            amount: amount,
            description: `Sent to ${recipient.fullName || recipientPhone}${note ? ' - ' + note : ''}`,
            time: new Date().toISOString()
        };
        if (!currentUser.transactions) currentUser.transactions = [];
        currentUser.transactions.unshift(tx);

        const rxTx = {
            type: 'received',
            amount: amount,
            description: `Received from ${currentUser.fullName || currentUser.phone}${note ? ' - ' + note : ''}`,
            time: new Date().toISOString()
        };
        if (!recipient.transactions) recipient.transactions = [];
        recipient.transactions.unshift(rxTx);

        updateUserInDatabase(currentUser);
        updateUserInDatabase(recipient);

        showToast(`✅ ₹${amount.toFixed(2)} sent to ${recipient.fullName || recipientPhone} successfully!`, 'success');
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