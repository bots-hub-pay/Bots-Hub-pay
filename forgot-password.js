document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    let phoneNumber = '';
    let verificationCode = '';
    let timerInterval = null;
    let timeLeft = 30;

    const step1 = document.getElementById('forgotStep1');
    const step2 = document.getElementById('forgotStep2');
    const step3 = document.getElementById('forgotStep3');
    const stepDot1 = document.getElementById('stepDot1');
    const stepDot2 = document.getElementById('stepDot2');
    const stepDot3 = document.getElementById('stepDot3');
    const stepLine1 = document.getElementById('stepLine1');
    const stepLine2 = document.getElementById('stepLine2');
    const phoneInput = document.getElementById('resetPhoneInput');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const phoneDisplay = document.getElementById('phoneDisplay');
    const timerDisplay = document.getElementById('timerDisplay');
    const resendLink = document.getElementById('resendLink');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');

    function getUserByPhone(phone) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.phone === phone);
    }

    function generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    function updateStep(step) {
        step1.classList.remove('active');
        step2.classList.remove('active');
        step3.classList.remove('active');

        if (step === 1) {
            step1.classList.add('active');
            stepDot1.classList.add('active');
            stepDot1.classList.remove('completed');
            stepDot2.classList.remove('active', 'completed');
            stepDot3.classList.remove('active', 'completed');
            stepLine1.classList.remove('completed');
            stepLine2.classList.remove('completed');
        } else if (step === 2) {
            step2.classList.add('active');
            stepDot1.classList.remove('active');
            stepDot1.classList.add('completed');
            stepDot2.classList.add('active');
            stepDot2.classList.remove('completed');
            stepDot3.classList.remove('active', 'completed');
            stepLine1.classList.add('completed');
            stepLine2.classList.remove('completed');
            document.querySelector('.code-input').focus();
        } else if (step === 3) {
            step3.classList.add('active');
            stepDot1.classList.remove('active');
            stepDot1.classList.add('completed');
            stepDot2.classList.remove('active');
            stepDot2.classList.add('completed');
            stepDot3.classList.add('active');
            stepLine1.classList.add('completed');
            stepLine2.classList.add('completed');
        }
        currentStep = step;
    }

    sendCodeBtn.addEventListener('click', function() {
        phoneNumber = phoneInput.value.trim();
        if (!phoneNumber) {
            showToast('Please enter your phone number', 'error');
            return;
        }
        if (!/^[0-9]{10}$/.test(phoneNumber)) {
            showToast('Please enter a valid 10-digit phone number', 'error');
            return;
        }
        const user = getUserByPhone(phoneNumber);
        if (!user) {
            showToast('❌ No account found with this phone number', 'error');
            return;
        }

        verificationCode = generateCode();
        sessionStorage.setItem('resetPhone', phoneNumber);
        sessionStorage.setItem('resetCode', verificationCode);
        phoneDisplay.textContent = '+91 ' + phoneNumber.slice(0, 4) + '******';
        startTimer();
        console.log('📱 Verification Code:', verificationCode);
        showToast('📱 Verification code sent to ' + phoneNumber, 'success');
        updateStep(2);
    });

    document.querySelectorAll('.code-input').forEach((input, index, inputs) => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 1) {
                this.classList.add('filled');
                this.classList.remove('error');
                if (index < inputs.length - 1) inputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                inputs[index - 1].focus();
                inputs[index - 1].classList.remove('filled');
                inputs[index - 1].classList.remove('error');
            }
        });
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const numbers = paste.replace(/[^0-9]/g, '').slice(0, 6);
            numbers.split('').forEach((num, i) => {
                if (inputs[i]) {
                    inputs[i].value = num;
                    inputs[i].classList.add('filled');
                    inputs[i].classList.remove('error');
                }
            });
            if (numbers.length === 6) inputs[5].focus();
        });
    });

    verifyCodeBtn.addEventListener('click', function() {
        const inputs = document.querySelectorAll('.code-input');
        const enteredCode = Array.from(inputs).map(input => input.value).join('');
        if (enteredCode.length !== 6) {
            showToast('Please enter the complete 6-digit code', 'error');
            return;
        }
        const storedCode = sessionStorage.getItem('resetCode');
        if (enteredCode !== storedCode) {
            inputs.forEach(input => { input.classList.add('error'); setTimeout(() => input.classList.remove('error'), 500); });
            showToast('❌ Invalid verification code', 'error');
            return;
        }
        showToast('✅ Code verified!', 'success');
        updateStep(3);
    });

    resetPasswordBtn.addEventListener('click', function() {
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        if (!newPassword || newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('❌ Passwords do not match', 'error');
            return;
        }
        const phone = sessionStorage.getItem('resetPhone');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.phone === phone);
        if (userIndex === -1) {
            showToast('❌ User not found', 'error');
            return;
        }
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        sessionStorage.removeItem('resetPhone');
        sessionStorage.removeItem('resetCode');
        showToast('✅ Password reset successfully!', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    });

    function startTimer() {
        timeLeft = 30;
        timerDisplay.textContent = timeLeft;
        resendLink.style.display = 'none';
        timerDisplay.style.display = 'inline';
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(function() {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerDisplay.style.display = 'none';
                resendLink.style.display = 'inline';
            }
        }, 1000);
    }

    window.resendCode = function() {
        verificationCode = generateCode();
        sessionStorage.setItem('resetCode', verificationCode);
        startTimer();
        console.log('📱 New Verification Code:', verificationCode);
        showToast('📱 New code sent!', 'success');
        document.querySelectorAll('.code-input').forEach(el => { el.value = ''; el.classList.remove('filled'); el.classList.remove('error'); });
        document.querySelector('.code-input').focus();
    };

    function showToast(message, type) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
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
});