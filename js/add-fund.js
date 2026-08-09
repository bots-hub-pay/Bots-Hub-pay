// Add Fund JavaScript - Bots Hub Pay (FIXED)

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

    initAddFund(currentUser);
    checkOwnerStatus(currentUser);
    loadUPIData();
});

let currentStep = 1;
let selectedAmount = 0;
let referenceId = '';

function initAddFund(user) {
    updateBalanceDisplay(user);
    generateReference();
    updateProgress();
    setupEventListeners(user);
}

function setupEventListeners(user) {
    // Quick amount buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('fundAmount').value = this.dataset.amount;
        });
    });
    
    // Step 1: Next
    document.getElementById('step1Next').addEventListener('click', function() {
        const amount = parseInt(document.getElementById('fundAmount').value);
        if (!amount || amount < 1) {
            showToast('Please enter a valid amount.', 'error');
            return;
        }
        selectedAmount = amount;
        goToStep(2);
    });
    
    // Step 2: Back
    document.getElementById('step2Back').addEventListener('click', function() {
        goToStep(1);
    });
    
    // Step 2: Next
    document.getElementById('step2Next').addEventListener('click', function() {
        goToStep(3);
    });
    
    // Step 3: Back
    document.getElementById('step3Back').addEventListener('click', function() {
        goToStep(2);
    });
    
    // Step 3: Submit
    document.getElementById('submitFundBtn').addEventListener('click', function() {
        submitFundRequest(user);
    });
    
    // QR Upload
    document.getElementById('qrUpload').addEventListener('change', function(e) {
        uploadQR(e);
    });

    // UTR Input
    document.getElementById('utrId').addEventListener('input', function() {
        this.value = this.value.toUpperCase();
        document.getElementById('summaryUtr').textContent = this.value || '-';
    });

    // PIN Input
    document.getElementById('fundPin').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);
    });

    // Enter key support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (currentStep === 1) {
                document.getElementById('step1Next').click();
            } else if (currentStep === 2) {
                document.getElementById('step2Next').click();
            } else if (currentStep === 3) {
                document.getElementById('submitFundBtn').click();
            }
        }
    });
}

function updateBalanceDisplay(user) {
    const balance = user?.balance || 0;
    document.getElementById('currentBalance').textContent = '₹' + balance.toFixed(2);
}

function generateReference() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let ref = 'BH';
    for (let i = 0; i < 8; i++) {
        ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    referenceId = ref;
    document.getElementById('referenceId').textContent = ref;
}

function goToStep(step) {
    currentStep = step;
    
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    
    document.getElementById('step' + step).style.display = 'block';
    
    if (step === 2) {
        document.getElementById('displayAmount').textContent = '₹' + selectedAmount;
        generateQRCode();
    }
    
    if (step === 3) {
        document.getElementById('summaryAmount').textContent = '₹' + selectedAmount;
        document.getElementById('summaryUtr').textContent = document.getElementById('utrId').value || '-';
        document.getElementById('summaryRef').textContent = referenceId;
    }
    
    updateProgress();
}

function updateProgress() {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById('progress' + i);
        const line = document.getElementById('progressLine' + i);
        
        step.classList.remove('active', 'completed');
        
        if (i < currentStep) {
            step.classList.add('completed');
        } else if (i === currentStep) {
            step.classList.add('active');
        }
        
        if (line) {
            line.classList.toggle('active', i < currentStep);
        }
    }
}

function generateQRCode() {
    const upiId = document.getElementById('upiId').textContent;
    const upiUrl = `upi://pay?pa=${upiId}&pn=Bots%20Hub%20Pay&am=${selectedAmount}&tn=Payment%20${referenceId}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=4169ff&margin=10`;
    
    const qrImage = document.getElementById('qrImage');
    const placeholder = document.getElementById('qrPlaceholder');
    
    qrImage.src = qrUrl;
    qrImage.onload = function() {
        qrImage.style.display = 'block';
        placeholder.style.display = 'none';
    };
    qrImage.onerror = function() {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = '<i class="fa-solid fa-qrcode" style="font-size:3rem;color:#4169ff;"></i><span>QR Code unavailable</span>';
    };
}

// ✅ FIXED: Submit Fund Request with Server Sync
async function submitFundRequest(user) {
    const utrId = document.getElementById('utrId').value.trim();
    const pin = document.getElementById('fundPin').value;
    
    if (!utrId) {
        showToast('Please enter UTR / Transaction ID', 'error');
        return;
    }
    if (utrId.length < 5) {
        showToast('Please enter a valid UTR number', 'error');
        return;
    }
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        showToast('Please enter a valid 4-digit PIN', 'error');
        return;
    }

    if (user.transactionPin && user.transactionPin !== pin) {
        showToast('❌ Incorrect PIN. Please try again.', 'error');
        return;
    }
    if (!user.transactionPin) {
        user.transactionPin = pin;
        updateUserInDatabase(user);
    }

    // ✅ Sync user with server before submitting
    try {
        showToast('⏳ Syncing with server...', 'info');
        
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
        console.log('Sync Response:', syncData);
        
        if (syncData.success) {
            user.apiKey = syncData.data.apiKey;
            user.apiToken = syncData.data.apiToken;
            user.balance = syncData.data.balance;
            updateUserInDatabase(user);
            console.log('✅ User synced with server');
        }
    } catch (error) {
        console.error('Sync Error:', error);
    }

    // ✅ Create pending approval request
    const request = {
        id: Date.now().toString(),
        type: 'add_fund',
        userPhone: user.phone,
        userName: user.fullName || 'User',
        amount: selectedAmount,
        method: 'UPI / Bank Transfer',
        utr: utrId,
        reference: referenceId,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    const ownerData = JSON.parse(localStorage.getItem('ownerData') || '{}');
    if (!ownerData.pendingApprovals) ownerData.pendingApprovals = [];
    ownerData.pendingApprovals.push(request);
    localStorage.setItem('ownerData', JSON.stringify(ownerData));

    if (!user.pendingApprovals) user.pendingApprovals = [];
    user.pendingApprovals.push(request);
    updateUserInDatabase(user);

    showToast('✅ Fund request sent for verification!', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
}

// ============================================
// OWNER CONTROLS FUNCTIONS
// ============================================

function checkOwnerStatus(user) {
    const ownerPhone = '8824146248';
    if (user && user.phone === ownerPhone) {
        document.getElementById('ownerControls').classList.add('show');
    }
}

function loadUPIData() {
    const upiData = JSON.parse(localStorage.getItem('upiData')) || {
        upiId: 'botshub@pay',
        payeeName: 'Bots Hub Pay',
        qrImage: null
    };
    
    document.getElementById('upiId').textContent = upiData.upiId || 'botshub@pay';
    document.getElementById('payeeName').textContent = upiData.payeeName || 'Bots Hub Pay';
    document.getElementById('upiInput').value = upiData.upiId || 'botshub@pay';
    document.getElementById('payeeNameInput').value = upiData.payeeName || 'Bots Hub Pay';
    
    if (upiData.qrImage) {
        document.getElementById('qrImage').src = upiData.qrImage;
        document.getElementById('qrImage').style.display = 'block';
        document.getElementById('qrPlaceholder').style.display = 'none';
    }
}

function updateUPI() {
    const upi = document.getElementById('upiInput').value.trim();
    if (!upi) {
        showToast('Please enter a valid UPI ID.', 'error');
        return;
    }
    
    const upiData = JSON.parse(localStorage.getItem('upiData')) || {};
    upiData.upiId = upi;
    localStorage.setItem('upiData', JSON.stringify(upiData));
    
    document.getElementById('upiId').textContent = upi;
    showToast('✅ UPI ID updated successfully!', 'success');
}

function updatePayeeName() {
    const name = document.getElementById('payeeNameInput').value.trim();
    if (!name) {
        showToast('Please enter a valid payee name.', 'error');
        return;
    }
    
    const upiData = JSON.parse(localStorage.getItem('upiData')) || {};
    upiData.payeeName = name;
    localStorage.setItem('upiData', JSON.stringify(upiData));
    
    document.getElementById('payeeName').textContent = name;
    showToast('✅ Payee name updated successfully!', 'success');
}

function uploadQR(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageData = event.target.result;
        const upiData = JSON.parse(localStorage.getItem('upiData')) || {};
        upiData.qrImage = imageData;
        localStorage.setItem('upiData', JSON.stringify(upiData));
        
        document.getElementById('qrImage').src = imageData;
        document.getElementById('qrImage').style.display = 'block';
        document.getElementById('qrPlaceholder').style.display = 'none';
        showToast('✅ QR Code uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

function resetQR() {
    if (!confirm('Reset QR Code to default?')) return;
    
    const upiData = JSON.parse(localStorage.getItem('upiData')) || {};
    upiData.qrImage = null;
    localStorage.setItem('upiData', JSON.stringify(upiData));
    
    document.getElementById('qrImage').style.display = 'none';
    document.getElementById('qrPlaceholder').style.display = 'flex';
    showToast('✅ QR Code reset to default.', 'info');
}

function copyUPIId() {
    copyText('upiId');
}

function openUPIApp() {
    const upiId = document.getElementById('upiId').textContent;
    const amount = selectedAmount || 0;
    const upiUrl = `upi://pay?pa=${upiId}&pn=Bots%20Hub%20Pay&am=${amount}&tn=Payment%20${referenceId}&cu=INR`;
    window.open(upiUrl, '_blank');
}

function downloadQR() {
    const qrImage = document.getElementById('qrImage');
    if (qrImage.style.display === 'none') {
        showToast('Please generate QR code first.', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = `QR_${referenceId}.png`;
    link.href = qrImage.src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ QR Code downloaded!', 'success');
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

function copyText(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const text = element.textContent;
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

// Make functions globally available for onclick
window.copyText = copyText;
window.copyUPIId = copyUPIId;
window.openUPIApp = openUPIApp;
window.downloadQR = downloadQR;
window.updateUPI = updateUPI;
window.updatePayeeName = updatePayeeName;
window.resetQR = resetQR;
