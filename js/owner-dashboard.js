// Owner Dashboard JavaScript - Bots Hub Pay (FIXED)

const FULL_DOMAIN = 'https://bots-hub-pay.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    const OWNER_PHONE = '8824146248';
    const OWNER_PASSWORD = 'owner8824146248';
    
    const isOwnerLoggedIn = sessionStorage.getItem('isOwnerLoggedIn');
    if (!isOwnerLoggedIn) {
        const phone = sessionStorage.getItem('ownerPhone');
        const password = sessionStorage.getItem('ownerPassword');
        if (phone === OWNER_PHONE && password === OWNER_PASSWORD) {
            sessionStorage.setItem('isOwnerLoggedIn', 'true');
        } else {
            window.location.href = 'index.html';
            return;
        }
    }

    loadDashboardData();
    setInterval(loadDashboardData, 30000);

    // Clear All Data
    document.getElementById('clearAllBtn').addEventListener('click', function() {
        if (confirm('⚠️ WARNING: This will permanently delete ALL user data!\n\nAre you sure?')) {
            if (confirm('⚠️ FINAL WARNING: This action is irreversible!')) {
                localStorage.removeItem('users');
                localStorage.removeItem('ownerData');
                showToast('✅ All data cleared successfully!', 'success');
                loadDashboardData();
            }
        }
    });

    // Clear One User
    document.getElementById('clearUserBtn').addEventListener('click', function() {
        const phone = document.getElementById('clearUserPhone').value.trim();
        if (!phone) {
            showToast('Please enter a phone number', 'error');
            return;
        }
        if (phone === OWNER_PHONE) {
            showToast('❌ Cannot delete owner account!', 'error');
            return;
        }
        if (confirm(`⚠️ Are you sure you want to delete user with phone: ${phone}?`)) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const filtered = users.filter(u => u.phone !== phone);
            if (filtered.length === users.length) {
                showToast('❌ User not found', 'error');
                return;
            }
            localStorage.setItem('users', JSON.stringify(filtered));
            const ownerData = JSON.parse(localStorage.getItem('ownerData') || '{}');
            if (ownerData.pendingApprovals) {
                ownerData.pendingApprovals = ownerData.pendingApprovals.filter(a => a.userPhone !== phone);
                localStorage.setItem('ownerData', JSON.stringify(ownerData));
            }
            showToast(`✅ User ${phone} deleted successfully!`, 'success');
            document.getElementById('clearUserPhone').value = '';
            loadDashboardData();
        }
    });
});

function loadDashboardData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const ownerData = JSON.parse(localStorage.getItem('ownerData') || '{}');
    const pendingApprovals = ownerData.pendingApprovals || [];

    document.getElementById('totalUsers').textContent = users.length;
    
    let totalFunds = 0, totalTransactions = 0;
    users.forEach(user => {
        totalFunds += (user.totalFundAdded || 0);
        totalTransactions += (user.transactions || []).length;
    });
    document.getElementById('totalFunds').textContent = '₹' + totalFunds.toFixed(2);
    document.getElementById('totalTransactions').textContent = totalTransactions;
    document.getElementById('pendingApprovals').textContent = pendingApprovals.filter(a => a.status === 'pending').length;
    document.getElementById('pendingCount').textContent = pendingApprovals.filter(a => a.status === 'pending').length + ' pending';

    renderApprovals(pendingApprovals);
}

function renderApprovals(approvals) {
    const container = document.getElementById('approvalsList');
    const pending = approvals.filter(a => a.status === 'pending');
    
    if (pending.length === 0) {
        container.innerHTML = `<div class="no-approvals"><i class="fa-regular fa-circle-check"></i><p>No pending approvals</p></div>`;
        return;
    }
    
    container.innerHTML = pending.map(approval => {
        const time = new Date(approval.timestamp);
        const timeStr = time.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        let typeText = '', details = '', icon = '', amount = approval.amount || 0;
        
        switch(approval.type) {
            case 'add_fund':
                typeText = '💰 Add Fund';
                icon = 'fa-solid fa-circle-plus';
                details = `
                    <span style="font-weight:600;">Amount:</span> ₹${amount.toFixed(2)} 
                    <span style="font-weight:600;">Method:</span> ${approval.method || 'UPI'} 
                    <span style="font-weight:600;">UTR:</span> ${approval.utr || 'N/A'}
                    <span style="font-weight:600;">Ref:</span> ${approval.reference || 'N/A'}
                `;
                break;
            case 'withdraw':
                typeText = '🏦 Withdraw';
                icon = 'fa-solid fa-arrow-right';
                details = `
                    <span style="font-weight:600;">Amount:</span> ₹${amount.toFixed(2)} 
                    <span style="font-weight:600;">Method:</span> ${approval.method} 
                    <span style="font-weight:600;">Account:</span> ${approval.account}
                `;
                break;
            case 'pay_user':
                typeText = '💸 Pay to User';
                icon = 'fa-solid fa-paper-plane';
                details = `
                    <span style="font-weight:600;">Amount:</span> ₹${amount.toFixed(2)} 
                    <span style="font-weight:600;">To:</span> ${approval.recipientName} (${approval.recipientPhone})
                    ${approval.note ? ' | Note: ' + approval.note : ''}
                `;
                break;
        }
        
        return `
            <div class="approval-item" id="approval-${approval.id}">
                <div class="approval-info">
                    <div class="type" style="font-size:1rem;margin-bottom:0.3rem;">
                        <i class="${icon}"></i> ${typeText} 
                        <span class="pending-badge">Pending</span>
                    </div>
                    <div class="details" style="font-size:0.85rem;color:#6b7280;line-height:1.8;">
                        ${details} 
                        <br>
                        <span style="font-weight:600;">From:</span> ${approval.userName} (${approval.userPhone}) 
                        <span style="font-weight:600;">Time:</span> ${timeStr}
                    </div>
                </div>
                <div class="approval-actions">
                    <button class="approve-btn" onclick="approveRequest('${approval.id}')">
                        <i class="fa-solid fa-check"></i> Approve
                    </button>
                    <button class="reject-btn" onclick="rejectRequest('${approval.id}')">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ✅ FIXED: Approve Request with Server Sync
window.approveRequest = async function(requestId) {
    if (!confirm('✅ Approve this request?')) return;
    
    const ownerData = JSON.parse(localStorage.getItem('ownerData') || '{}');
    const approvals = ownerData.pendingApprovals || [];
    const approval = approvals.find(a => a.id === requestId);
    if (!approval) { showToast('Request not found', 'error'); return; }
    
    approval.status = 'approved';
    localStorage.setItem('ownerData', JSON.stringify(ownerData));
    
    await processTransaction(approval);
    
    showToast('✅ Request approved successfully!', 'success');
    loadDashboardData();
};

window.rejectRequest = function(requestId) {
    if (!confirm('❌ Reject this request?')) return;
    const ownerData = JSON.parse(localStorage.getItem('ownerData') || '{}');
    const approvals = ownerData.pendingApprovals || [];
    const approval = approvals.find(a => a.id === requestId);
    if (!approval) { showToast('Request not found', 'error'); return; }
    approval.status = 'rejected';
    localStorage.setItem('ownerData', JSON.stringify(ownerData));
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.phone === approval.userPhone);
    if (user && user.pendingApprovals) {
        user.pendingApprovals = user.pendingApprovals.filter(a => a.id !== requestId);
        const userIndex = users.findIndex(u => u.phone === approval.userPhone);
        if (userIndex !== -1) { users[userIndex] = user; localStorage.setItem('users', JSON.stringify(users)); }
    }
    showToast('❌ Request rejected!', 'error');
    loadDashboardData();
};

// ✅ FIXED: Process Transaction with Server Sync
async function processTransaction(approval) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.phone === approval.userPhone);
    if (!user) { showToast('User not found', 'error'); return; }
    if (user.pendingApprovals) {
        user.pendingApprovals = user.pendingApprovals.filter(a => a.id !== approval.id);
    }
    
    // ✅ Sync user with server before processing
    try {
        const syncResponse = await fetch(`${FULL_DOMAIN}/api/generate-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: user.phone,
                fullName: user.fullName || 'User',
                email: user.email || '',
                balance: user.balance || 0
            })
        });
        const syncData = await syncResponse.json();
        if (syncData.success) {
            user.apiKey = syncData.data.apiKey;
            user.apiToken = syncData.data.apiToken;
            console.log('✅ User synced to server');
        }
    } catch (error) {
        console.error('Sync Error:', error);
    }
    
    switch(approval.type) {
        case 'add_fund':
            user.balance = (user.balance || 0) + approval.amount;
            user.totalFundAdded = (user.totalFundAdded || 0) + approval.amount;
            
            if (!user.transactions) user.transactions = [];
            user.transactions.unshift({
                type: 'add',
                amount: approval.amount,
                description: `Fund Added via ${approval.method} (UTR: ${approval.utr || 'N/A'})`,
                reference: approval.reference || 'N/A',
                status: 'approved',
                time: new Date().toISOString()
            });
            
            if (!user.activities) user.activities = [];
            user.activities.unshift({
                text: `✅ Added ₹${approval.amount.toFixed(2)} (Approved by Owner)`,
                icon: 'fa-solid fa-circle-plus',
                color: 'green',
                time: new Date().toISOString()
            });
            break;
            
        case 'withdraw':
            user.balance = (user.balance || 0) - approval.amount;
            user.totalWithdrawn = (user.totalWithdrawn || 0) + approval.amount;
            
            if (!user.transactions) user.transactions = [];
            user.transactions.unshift({
                type: 'withdraw',
                amount: approval.amount,
                description: `Withdrew to ${approval.account} (${approval.method})`,
                status: 'approved',
                time: new Date().toISOString()
            });
            
            if (!user.activities) user.activities = [];
            user.activities.unshift({
                text: `✅ Withdrew ₹${approval.amount.toFixed(2)} (Approved by Owner)`,
                icon: 'fa-solid fa-arrow-right',
                color: 'orange',
                time: new Date().toISOString()
            });
            break;
            
        case 'pay_user':
            const recipient = users.find(u => u.phone === approval.recipientPhone);
            if (!recipient) { showToast('Recipient not found', 'error'); return; }
            
            user.balance = (user.balance || 0) - approval.amount;
            user.totalSent = (user.totalSent || 0) + approval.amount;
            
            if (!user.transactions) user.transactions = [];
            user.transactions.unshift({
                type: 'sent',
                amount: approval.amount,
                description: `Sent to ${recipient.fullName || approval.recipientPhone}`,
                status: 'approved',
                time: new Date().toISOString()
            });
            
            if (!user.activities) user.activities = [];
            user.activities.unshift({
                text: `✅ Sent ₹${approval.amount.toFixed(2)} to ${recipient.fullName || approval.recipientPhone} (Approved)`,
                icon: 'fa-solid fa-paper-plane',
                color: 'purple',
                time: new Date().toISOString()
            });
            
            recipient.balance = (recipient.balance || 0) + approval.amount;
            recipient.totalReceived = (recipient.totalReceived || 0) + approval.amount;
            
            if (!recipient.transactions) recipient.transactions = [];
            recipient.transactions.unshift({
                type: 'received',
                amount: approval.amount,
                description: `Received from ${user.fullName || approval.userPhone}`,
                status: 'approved',
                time: new Date().toISOString()
            });
            
            if (!recipient.activities) recipient.activities = [];
            recipient.activities.unshift({
                text: `✅ Received ₹${approval.amount.toFixed(2)} from ${user.fullName || approval.userPhone} (Approved)`,
                icon: 'fa-solid fa-arrow-down',
                color: 'green',
                time: new Date().toISOString()
            });
            
            const recipientIndex = users.findIndex(u => u.phone === approval.recipientPhone);
            if (recipientIndex !== -1) { users[recipientIndex] = recipient; }
            break;
    }
    
    const userIndex = users.findIndex(u => u.phone === approval.userPhone);
    if (userIndex !== -1) { users[userIndex] = user; }
    localStorage.setItem('users', JSON.stringify(users));
}

function logoutOwner() {
    sessionStorage.removeItem('isOwnerLoggedIn');
    sessionStorage.removeItem('ownerPhone');
    sessionStorage.removeItem('ownerPassword');
    showToast('Logged out', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
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
