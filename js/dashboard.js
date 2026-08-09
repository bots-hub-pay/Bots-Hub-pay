// Dashboard JavaScript - Bots Hub Pay (FULLY UPDATED)

const FULL_DOMAIN = 'https://bots-hub-pay.onrender.com';

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

    // Initialize user data
    if (!currentUser.balance) currentUser.balance = 0;
    if (!currentUser.totalFundAdded) currentUser.totalFundAdded = 0;
    if (!currentUser.totalWithdrawn) currentUser.totalWithdrawn = 0;
    if (!currentUser.totalSent) currentUser.totalSent = 0;
    if (!currentUser.totalReceived) currentUser.totalReceived = 0;
    if (!currentUser.activities) currentUser.activities = [];
    if (!currentUser.transactions) currentUser.transactions = [];
    if (!currentUser.pendingApprovals) currentUser.pendingApprovals = [];

    updateUserInDatabase(currentUser);
    displayUserInfo(currentUser);
    updateStats(currentUser);
    renderActivities(currentUser);
    updateBalance(currentUser);

    // ===== SIDEBAR FUNCTIONS =====
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebarBtn = document.getElementById('closeSidebar');

    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebarFunc() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebarFunc);
    sidebarOverlay.addEventListener('click', closeSidebarFunc);

    // ===== SINGLE NAVIGATION FUNCTION =====
    window.navigateTo = function(page) {
        if (window.innerWidth <= 768) {
            closeSidebarFunc();
        }
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        const sections = [
            'dashboardContent', 'profileSection', 'addFundSection', 
            'withdrawSection', 'payUserSection', 'apiKeysSection', 
            'transactionHistorySection', 'settingsSection'
        ];
        
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        
        const sectionMap = {
            'dashboard': 'dashboardContent',
            'profile': 'profileSection',
            'add-fund': 'addFundSection',
            'withdraw': 'withdrawSection',
            'pay-user': 'payUserSection',
            'api-keys': 'apiKeysSection',
            'transaction-history': 'transactionHistorySection',
            'settings': 'settingsSection'
        };
        
        const targetId = sectionMap[page];
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) {
                el.style.display = 'block';
                loadSectionData(page, currentUser);
            }
        }
        
        const titleMap = {
            'dashboard': 'Dashboard',
            'profile': 'Profile',
            'add-fund': 'Add Fund',
            'withdraw': 'Withdraw',
            'pay-user': 'Pay to User',
            'api-keys': 'API Keys',
            'transaction-history': 'Transaction History',
            'settings': 'Settings'
        };
        
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            titleEl.textContent = titleMap[page] || 'Dashboard';
        }
    };

    function loadSectionData(page, user) {
        switch(page) {
            case 'dashboard':
                updateStats(user);
                renderActivities(user);
                updateBalance(user);
                break;
            case 'profile':
                document.getElementById('editFullName').value = user.fullName || '';
                document.getElementById('editEmail').value = user.email || '';
                document.getElementById('editPhone').value = user.phone || '';
                document.getElementById('profileAvatarText').textContent = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';
                break;
            case 'add-fund':
            case 'withdraw':
            case 'pay-user':
                updateBalance(user);
                break;
        }
    }

    // ===== PROFILE MODAL =====
    const profileModal = document.getElementById('profileModal');
    const profileBtn = document.getElementById('profileBtn');
    const closeModal = document.getElementById('closeModal');

    window.openProfileModal = function() {
        document.getElementById('modalAvatar').textContent = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U';
        document.getElementById('modalName').textContent = currentUser.fullName || 'N/A';
        document.getElementById('modalPhone').textContent = currentUser.phone || 'N/A';
        document.getElementById('modalEmail').textContent = currentUser.email || 'N/A';
        document.getElementById('modalBalance').textContent = '₹' + (currentUser.balance || 0).toFixed(2);
        if (currentUser.createdAt) {
            const d = new Date(currentUser.createdAt);
            document.getElementById('modalMemberSince').textContent = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeProfileModal = function() {
        profileModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    profileBtn.addEventListener('click', openProfileModal);
    closeModal.addEventListener('click', closeProfileModal);
    profileModal.addEventListener('click', function(e) {
        if (e.target === this) closeProfileModal();
    });

    // ===== LOGOUT =====
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('welcomeShown');
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });

    // ===== CHECK NEW USER PIN =====
    const isNewUser = sessionStorage.getItem('isNewUser') === 'true';
    if (isNewUser && !currentUser.transactionPin) {
        setTimeout(() => {
            showPinSetupPopup(currentUser);
        }, 1000);
        sessionStorage.removeItem('isNewUser');
    }

    // ===== EDIT PROFILE FORM =====
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

        displayUserInfo(currentUser);
        showToast('✅ Profile updated successfully!', 'success');
        navigateTo('dashboard');
    });

    // ✅ WELCOME MESSAGE - Only Once
    const welcomeShown = sessionStorage.getItem('welcomeShown');
    
    if (!welcomeShown) {
        setTimeout(function() {
            showToast('👋 Welcome back, ' + (currentUser.fullName || 'User') + '!', 'success');
            sessionStorage.setItem('welcomeShown', 'true');
        }, 500);
    }

    // ✅ SYNC DATA FROM SERVER (NEW)
    setTimeout(() => {
        syncUserData(currentUser);
    }, 1500);
});

// ============================================
// ✅ FIXED: SYNC USER DATA FROM SERVER
// ============================================

async function syncUserData(user) {
    console.log('🔄 Syncing data from server...');
    
    if (!user) {
        console.log('❌ No user data');
        return;
    }
    
    // Check if user has API credentials
    if (!user.apiKey || !user.apiToken) {
        console.log('❌ No API credentials found, skipping sync');
        return;
    }
    
    try {
        // ✅ Sync balance from server
        const balanceResponse = await fetch(
            `${FULL_DOMAIN}/api/balance?apiKey=${user.apiKey}&apiToken=${user.apiToken}`
        );
        const balanceData = await balanceResponse.json();
        console.log('📊 Balance Response:', balanceData);
        
        if (balanceData.success) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const index = users.findIndex(u => u.phone === user.phone);
            
            if (index !== -1) {
                // Update balance
                users[index].balance = balanceData.data.balance;
                console.log('💰 Balance updated:', balanceData.data.balance);
                
                // ✅ Sync transactions from server
                try {
                    const txResponse = await fetch(`${FULL_DOMAIN}/api/transactions/${user.phone}`);
                    const txData = await txResponse.json();
                    console.log('📝 Transactions Response:', txData);
                    
                    if (txData.success && txData.transactions) {
                        users[index].transactions = txData.transactions;
                        console.log('✅ Transactions synced:', txData.transactions.length);
                    }
                } catch (txError) {
                    console.log('⚠️ Transactions sync failed:', txError.message);
                }
                
                localStorage.setItem('users', JSON.stringify(users));
                
                // Update UI
                const updatedUser = users[index];
                updateBalance(updatedUser);
                updateStats(updatedUser);
                renderActivities(updatedUser);
                
                console.log('✅ Data synced from server successfully!');
                console.log('💰 Balance:', balanceData.data.balance);
                console.log('📝 Total Transactions:', users[index].transactions?.length || 0);
            } else {
                console.log('❌ User not found in localStorage');
            }
        } else {
            console.log('❌ Balance sync failed:', balanceData.message);
        }
    } catch (error) {
        console.error('❌ Sync error:', error.message);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function updateUserInDatabase(user) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.phone === user.phone);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function displayUserInfo(user) {
    const initialsDisplay = document.getElementById('profileInitials');
    if (initialsDisplay) {
        const initials = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';
        initialsDisplay.textContent = initials;
    }
}

function updateStats(user) {
    const elements = {
        totalBalance: document.getElementById('totalBalance'),
        totalFundAdded: document.getElementById('totalFundAdded'),
        totalWithdrawn: document.getElementById('totalWithdrawn'),
        totalSent: document.getElementById('totalSent'),
        totalReceived: document.getElementById('totalReceived'),
        totalTransactions: document.getElementById('totalTransactions')
    };
    if (elements.totalBalance) elements.totalBalance.textContent = '₹' + (user.balance || 0).toFixed(2);
    if (elements.totalFundAdded) elements.totalFundAdded.textContent = '₹' + (user.totalFundAdded || 0).toFixed(2);
    if (elements.totalWithdrawn) elements.totalWithdrawn.textContent = '₹' + (user.totalWithdrawn || 0).toFixed(2);
    if (elements.totalSent) elements.totalSent.textContent = '₹' + (user.totalSent || 0).toFixed(2);
    if (elements.totalReceived) elements.totalReceived.textContent = '₹' + (user.totalReceived || 0).toFixed(2);
    
    // ✅ Update transaction count from synced transactions
    const txCount = (user.transactions || []).length;
    if (elements.totalTransactions) elements.totalTransactions.textContent = txCount;
}

function updateBalance(user) {
    const balanceElement = document.getElementById('userBalance');
    if (balanceElement) {
        balanceElement.textContent = '₹' + (user.balance || 0).toFixed(2);
    }
    // Update all section balances
    const sections = ['addFundBalance', 'withdrawBalance', 'payBalance'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '₹' + (user.balance || 0).toFixed(2);
    });
}

function renderActivities(user) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    let allTransactions = [];
    
    // ✅ Get transactions from synced data
    if (user.transactions) {
        allTransactions = allTransactions.concat(user.transactions.map(t => ({ ...t, status: 'approved' })));
    }
    
    if (user.pendingApprovals) {
        const pendingTxs = user.pendingApprovals
            .filter(a => a.status === 'pending')
            .map(a => ({
                type: a.type === 'add_fund' ? 'add' : a.type,
                amount: a.amount,
                description: a.type === 'add_fund' ? 'Add Fund (Pending)' :
                             a.type === 'withdraw' ? 'Withdraw (Pending)' :
                             'Pay to User (Pending)',
                time: a.timestamp,
                status: 'pending'
            }));
        allTransactions = allTransactions.concat(pendingTxs);
    }

    allTransactions.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentTransactions = allTransactions.slice(0, 5);

    if (recentTransactions.length === 0) {
        activityList.innerHTML = `<div class="empty-activity"><i class="fa-regular fa-clock"></i><p>No transactions yet.</p></div>`;
        return;
    }

    activityList.innerHTML = recentTransactions.map(t => {
        const time = new Date(t.time);
        const timeStr = time.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        let icon = 'fa-solid fa-circle', color = 'blue', sign = '', displayText = '';

        if (t.status === 'pending') {
            icon = 'fa-regular fa-clock';
            color = 'orange';
            sign = '⏳ ';
            displayText = t.description;
        } else {
            switch(t.type) {
                case 'add': icon = 'fa-solid fa-circle-plus'; color = 'green'; sign = '+₹'; displayText = 'Fund Added'; break;
                case 'withdraw': icon = 'fa-solid fa-arrow-right'; color = 'orange'; sign = '-₹'; displayText = 'Withdrawal'; break;
                case 'sent': icon = 'fa-solid fa-paper-plane'; color = 'purple'; sign = '-₹'; displayText = 'Payment Sent'; break;
                case 'received': icon = 'fa-solid fa-arrow-down'; color = 'blue'; sign = '+₹'; displayText = 'Payment Received'; break;
                default: displayText = t.description || 'Transaction';
            }
        }
        const amountText = t.amount ? `${sign}${t.amount.toFixed(2)}` : '';
        return `<div class="activity-item"><div class="activity-icon ${color}"><i class="${icon}"></i></div><div class="activity-details"><p class="activity-text">${displayText} ${amountText}</p><span class="activity-time">${timeStr}</span></div></div>`;
    }).join('');
}

function showPinSetupPopup(userData) {
    const overlay = document.getElementById('pinOverlay');
    const input = document.getElementById('pinInput');
    const error = document.getElementById('pinError');
    const saveBtn = document.getElementById('pinSaveBtn');
    const skipBtn = document.getElementById('pinSkipBtn');

    input.value = '';
    error.textContent = '';
    overlay.classList.add('active');

    saveBtn.onclick = function() {
        const pin = input.value.trim();
        if (pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
            error.textContent = '⚠️ Please enter a 4-digit PIN';
            return;
        }
        userData.transactionPin = pin;
        updateUserInDatabase(userData);
        overlay.classList.remove('active');
        showToast('✅ PIN set successfully!', 'success');
    };

    skipBtn.onclick = function() {
        overlay.classList.remove('active');
    };

    input.oninput = function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);
        error.textContent = '';
    };

    input.onkeydown = function(e) {
        if (e.key === 'Enter') saveBtn.click();
    };

    setTimeout(() => input.focus(), 200);
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

// Make functions globally available
window.navigateTo = window.navigateTo || function(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeItem) activeItem.classList.add('active');
};
window.openProfileModal = window.openProfileModal || function() {};
window.closeProfileModal = window.closeProfileModal || function() {};
window.syncUserData = syncUserData;
