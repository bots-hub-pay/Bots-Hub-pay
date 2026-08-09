// API Keys JavaScript - Bots Hub Pay (COMPLETE FIXED)

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

    loadApiKeys();
    setupEventListeners(currentUser);
});

function loadApiKeys() {
    const userPhone = sessionStorage.getItem('userPhone');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(user => user.phone === userPhone);
    
    if (!currentUser) return;

    const hasKey = currentUser.apiKey && currentUser.apiToken;
    const badge = document.getElementById('apiStatusBadge');
    const keyStatus = document.getElementById('keyStatus');
    const tokenStatus = document.getElementById('tokenStatus');
    const credentialStatus = document.getElementById('credentialStatus');
    const apiKeyValue = document.getElementById('apiKeyValue');
    const apiTokenValue = document.getElementById('apiTokenValue');
    const apiUrlDisplay = document.getElementById('apiUrlDisplay');
    const exampleUrl = document.getElementById('exampleUrl');
    const baseUrlDisplay = document.getElementById('baseUrlDisplay');

    baseUrlDisplay.textContent = FULL_DOMAIN;

    if (hasKey) {
        badge.className = 'status-badge active';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> Active';
        keyStatus.textContent = '✅ Generated';
        tokenStatus.textContent = '✅ Generated';
        credentialStatus.textContent = '🔓 Active';
        credentialStatus.className = 'credential-status active';
        apiKeyValue.textContent = currentUser.apiKey;
        apiTokenValue.textContent = currentUser.apiToken;

        const fullUrl = `${FULL_DOMAIN}/APIs/api?token=${currentUser.apiToken}&key=${currentUser.apiKey}&paytoNumber={number}&amount={amount}&comment={comment}`;
        apiUrlDisplay.textContent = fullUrl;
        
        const example = fullUrl
            .replace('{number}', '9876543210')
            .replace('{amount}', '100')
            .replace('{comment}', 'Payment');
        exampleUrl.textContent = example;
        
        document.getElementById('requestsToday').textContent = Math.floor(Math.random() * 100);
    } else {
        badge.className = 'status-badge inactive';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> Inactive';
        keyStatus.textContent = 'Not Generated';
        tokenStatus.textContent = 'Not Generated';
        credentialStatus.textContent = '🔒 Not Generated';
        credentialStatus.className = 'credential-status';
        apiKeyValue.textContent = 'No key generated yet';
        apiTokenValue.textContent = 'No token generated yet';
        apiUrlDisplay.textContent = 'Generate API key to get URL';
        exampleUrl.textContent = 'Generate API key to see example';
        document.getElementById('requestsToday').textContent = '0';
    }
}

function setupEventListeners(currentUser) {
    
    // ✅ FIXED: Generate API Key with Balance Sync
    document.getElementById('generateKeyBtn').addEventListener('click', async function() {
        if (currentUser.apiKey) {
            if (!confirm('⚠️ You already have an API key. Generating a new one will revoke the old key.\n\nContinue?')) {
                return;
            }
        }

        showToast('⏳ Generating API key...', 'info');

        try {
            const response = await fetch(`${FULL_DOMAIN}/api/generate-key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    phone: currentUser.phone,
                    fullName: currentUser.fullName || 'User',
                    email: currentUser.email || '',
                    balance: currentUser.balance || 0
                })
            });
            
            const data = await response.json();
            console.log('Server Response:', data);
            
            if (data.success) {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const index = users.findIndex(u => u.phone === currentUser.phone);
                if (index !== -1) {
                    users[index].apiKey = data.data.apiKey;
                    users[index].apiToken = data.data.apiToken;
                    users[index].balance = data.data.balance;
                    localStorage.setItem('users', JSON.stringify(users));
                    currentUser = users[index];
                }
                
                loadApiKeys();
                showToast(`✅ API key generated!`, 'success');
            } else {
                showToast('❌ ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('❌ Failed to generate API key. Please try again.', 'error');
        }
    });

    // ✅ FIXED: Test API with Balance Check
    document.getElementById('testApiBtn').addEventListener('click', async function() {
        if (!currentUser.apiKey || !currentUser.apiToken) {
            showToast('Please generate an API key first', 'error');
            return;
        }

        showToast('⏳ Checking balance...', 'info');

        try {
            // ✅ First check balance on server
            const balanceResponse = await fetch(
                `${FULL_DOMAIN}/api/balance?apiKey=${currentUser.apiKey}&apiToken=${currentUser.apiToken}`
            );
            const balanceData = await balanceResponse.json();
            
            if (!balanceData.success) {
                showToast('❌ Invalid API credentials. Please regenerate key.', 'error');
                return;
            }

            const serverBalance = balanceData.data.balance;
            console.log('💰 Server Balance:', serverBalance);

            if (serverBalance < 1) {
                showToast(`❌ Insufficient balance: ₹${serverBalance}. Please add funds first.`, 'error');
                return;
            }

            const testAmount = prompt(`Enter test amount (Balance: ₹${serverBalance}):`, Math.min(10, serverBalance).toString());
            if (!testAmount || isNaN(testAmount) || parseFloat(testAmount) <= 0) {
                showToast('Invalid amount', 'error');
                return;
            }

            if (parseFloat(testAmount) > serverBalance) {
                showToast(`❌ Amount exceeds balance: ₹${serverBalance}`, 'error');
                return;
            }

            const testPhone = prompt('Enter recipient phone number:', '9876543210');
            if (!testPhone || testPhone.length !== 10) {
                showToast('Please enter a valid 10-digit phone number', 'error');
                return;
            }

            const testComment = prompt('Enter comment (optional):', 'API Test Payment');
            showToast('🔍 Processing test payment...', 'info');

            // ✅ Make API call
            const apiUrl = `${FULL_DOMAIN}/APIs/api?token=${currentUser.apiToken}&key=${currentUser.apiKey}&paytoNumber=${testPhone}&amount=${testAmount}&comment=${encodeURIComponent(testComment || 'Test')}`;

            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.success) {
                showToast(`✅ Payment Successful!`, 'success');
                // ✅ Update local balance
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const index = users.findIndex(u => u.phone === currentUser.phone);
                if (index !== -1) {
                    // Get updated balance from server
                    const newBalance = await fetch(
                        `${FULL_DOMAIN}/api/balance?apiKey=${currentUser.apiKey}&apiToken=${currentUser.apiToken}`
                    );
                    const newBalanceData = await newBalance.json();
                    if (newBalanceData.success) {
                        users[index].balance = newBalanceData.data.balance;
                        localStorage.setItem('users', JSON.stringify(users));
                        currentUser = users[index];
                    }
                }
            } else {
                showToast('❌ ' + data.message, 'error');
            }
        } catch (error) {
            console.error('API Error:', error);
            showToast('❌ API call failed. Please check server connection.', 'error');
        }
    });

    // Copy API URL
    document.getElementById('copyApiBtn').addEventListener('click', function() {
        if (!currentUser.apiKey || !currentUser.apiToken) {
            showToast('Please generate an API key first', 'error');
            return;
        }
        const url = `${FULL_DOMAIN}/APIs/api?token=${currentUser.apiToken}&key=${currentUser.apiKey}&paytoNumber={number}&amount={amount}&comment={comment}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast('✅ API URL copied!', 'success');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            showToast('✅ API URL copied!', 'success');
        });
    });

    // Revoke API Key
    document.getElementById('revokeKeyBtn').addEventListener('click', async function() {
        if (!currentUser.apiKey) {
            showToast('No API key to revoke', 'error');
            return;
        }
        if (confirm('⚠️ Revoke your API key? This will invalidate all integrations.')) {
            currentUser.apiKey = null;
            currentUser.apiToken = null;
            updateUserInDatabase(currentUser);
            loadApiKeys();
            showToast('❌ API key revoked', 'error');
        }
    });
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
        return users[index];
    }
    return user;
}

function copyField(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const text = element.textContent;
    if (!text || text === 'No key generated yet' || text === 'No token generated yet' || text === 'Loading...') {
        showToast('Nothing to copy. Please generate API key first.', 'error');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Copied to clipboard!', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('✅ Copied to clipboard!', 'success');
    });
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
