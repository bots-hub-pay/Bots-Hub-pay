// Register JavaScript - Bots Hub Pay (FIXED with PIN)

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const fullNameInput = document.getElementById('regFullName');
    const phoneInput = document.getElementById('regPhone');
    const emailInput = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');
    const confirmPasswordInput = document.getElementById('regConfirmPassword');
    const pinInput = document.getElementById('regPin');
    const confirmPinInput = document.getElementById('regConfirmPin');

    // Eye icons for password fields
    const passwordBox = passwordInput.closest('.input-box');
    const confirmBox = confirmPasswordInput.closest('.input-box');

    const eyeIcon1 = createEyeIcon();
    passwordBox.appendChild(eyeIcon1);
    togglePasswordVisibility(eyeIcon1, passwordInput);

    const eyeIcon2 = createEyeIcon();
    confirmBox.appendChild(eyeIcon2);
    togglePasswordVisibility(eyeIcon2, confirmPasswordInput);

    // Eye icons for PIN fields
    const pinBox = pinInput.closest('.input-box');
    const confirmPinBox = confirmPinInput.closest('.input-box');

    const eyeIcon3 = createEyeIcon();
    pinBox.appendChild(eyeIcon3);
    togglePasswordVisibility(eyeIcon3, pinInput);

    const eyeIcon4 = createEyeIcon();
    confirmPinBox.appendChild(eyeIcon4);
    togglePasswordVisibility(eyeIcon4, confirmPinInput);

    function createEyeIcon() {
        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-eye';
        return icon;
    }

    function togglePasswordVisibility(eyeIcon, inputField) {
        let isVisible = false;
        eyeIcon.addEventListener('click', function() {
            isVisible = !isVisible;
            inputField.type = isVisible ? 'text' : 'password';
            this.className = isVisible ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
            this.style.color = isVisible ? '#4169ff' : '#7c8297';
        });
    }

    // Input validations
    fullNameInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    });

    phoneInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
    });

    // PIN Input - Only numbers, max 4 digits
    pinInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 4) {
            this.value = this.value.slice(0, 4);
        }
    });

    confirmPinInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 4) {
            this.value = this.value.slice(0, 4);
        }
    });

    // Password strength indicator
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strengthIndicator = document.getElementById('password-strength');

        if (!strengthIndicator) {
            strengthIndicator = document.createElement('div');
            strengthIndicator.id = 'password-strength';
            const group = this.closest('.input-group');
            group.appendChild(strengthIndicator);
        }

        const strength = getPasswordStrength(password);

        if (password.length === 0) {
            strengthIndicator.innerHTML = '';
            return;
        }

        strengthIndicator.innerHTML = `<i class="fa-solid fa-${strength.icon}"></i> ${strength.label}`;
        strengthIndicator.style.color = strength.color;
    });

    function getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) {
            return { label: 'Weak', icon: 'triangle-exclamation', color: '#ff1744' };
        } else if (score <= 4) {
            return { label: 'Medium', icon: 'circle-exclamation', color: '#ff9100' };
        } else {
            return { label: 'Strong', icon: 'check-circle', color: '#00c853' };
        }
    }

    // Confirm password match
    confirmPasswordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const confirm = this.value;

        let confirmIndicator = document.getElementById('confirm-match');
        if (!confirmIndicator) {
            confirmIndicator = document.createElement('div');
            confirmIndicator.id = 'confirm-match';
            const group = this.closest('.input-group');
            group.appendChild(confirmIndicator);
        }

        if (confirm.length === 0) {
            confirmIndicator.innerHTML = '';
            this.closest('.input-box').style.borderColor = '#e5e9f0';
            return;
        }

        if (password === confirm) {
            confirmIndicator.innerHTML = `<i class="fa-solid fa-check-circle"></i> Passwords match`;
            confirmIndicator.style.color = '#00c853';
            this.closest('.input-box').style.borderColor = '#00c853';
        } else {
            confirmIndicator.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Passwords do not match`;
            confirmIndicator.style.color = '#ff1744';
            this.closest('.input-box').style.borderColor = '#ff1744';
        }
    });

    passwordInput.addEventListener('input', function() {
        const confirm = confirmPasswordInput.value;
        if (confirm.length > 0) {
            confirmPasswordInput.dispatchEvent(new Event('input'));
        }
    });

    // ✅ PIN match check
    confirmPinInput.addEventListener('input', function() {
        const pin = pinInput.value;
        const confirm = this.value;

        let confirmIndicator = document.getElementById('pin-match');
        if (!confirmIndicator) {
            confirmIndicator = document.createElement('div');
            confirmIndicator.id = 'pin-match';
            const group = this.closest('.input-group');
            group.appendChild(confirmIndicator);
        }

        if (confirm.length === 0) {
            confirmIndicator.innerHTML = '';
            this.closest('.input-box').style.borderColor = '#e5e9f0';
            return;
        }

        if (pin === confirm) {
            confirmIndicator.innerHTML = `<i class="fa-solid fa-check-circle"></i> PIN matches`;
            confirmIndicator.style.color = '#00c853';
            this.closest('.input-box').style.borderColor = '#00c853';
        } else {
            confirmIndicator.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> PINs do not match`;
            confirmIndicator.style.color = '#ff1744';
            this.closest('.input-box').style.borderColor = '#ff1744';
        }
    });

    pinInput.addEventListener('input', function() {
        const confirm = confirmPinInput.value;
        if (confirm.length > 0) {
            confirmPinInput.dispatchEvent(new Event('input'));
        }
    });

    function userExists(phone, email) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.phone === phone || user.email === email);
    }

    function showSpinner() {
        const overlay = document.createElement('div');
        overlay.id = 'spinnerOverlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 99999;
            display: flex; justify-content: center; align-items: center; flex-direction: column;
            backdrop-filter: blur(5px); animation: fadeIn 0.3s ease;
        `;
        overlay.innerHTML = `
            <div style="background:#fff; padding:2rem 3rem; border-radius:20px; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.3); animation:scaleIn 0.3s ease;">
                <div class="spinner" style="width:60px; height:60px; border:4px solid #e5e9f0; border-top:4px solid #4169ff; border-radius:50%; margin:0 auto 1rem; animation:spin 0.8s linear infinite;"></div>
                <p style="color:#1a1a2e; font-weight:600; font-size:1.1rem;">Creating your account...</p>
                <p style="color:#6b7280; font-size:0.85rem; margin-top:0.3rem;">Please wait</p>
            </div>
        `;
        document.body.appendChild(overlay);
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    function hideSpinner() {
        const overlay = document.getElementById('spinnerOverlay');
        if (overlay) {
            overlay.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => { overlay.remove(); }, 300);
        }
    }

    function showSuccessPopup(message) {
        const existing = document.querySelector('.success-popup');
        if (existing) existing.remove();
        const popup = document.createElement('div');
        popup.className = 'success-popup';
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8);
            background: linear-gradient(135deg, #00c853, #00e676); color: #fff;
            padding: 2rem 3rem; border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,200,83,0.4); z-index: 100001;
            font-weight: 600; font-size: 1.3rem; opacity: 0;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
            min-width: 200px;
        `;
        popup.innerHTML = `<i class="fa-solid fa-check-circle" style="font-size:3rem;"></i> ${message}`;
        document.body.appendChild(popup);
        void popup.offsetWidth;
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => { popup.remove(); }, 400);
        }, 1000);
    }

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        clearErrors();

        const fullName = fullNameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const pin = pinInput.value.trim();
        const confirmPin = confirmPinInput.value.trim();

        if (!fullName) { showError(fullNameInput, 'Full name is required'); return; }
        if (fullName.length < 3) { showError(fullNameInput, 'Name must be at least 3 characters'); return; }
        if (!phone) { showError(phoneInput, 'Phone number is required'); return; }
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) { showError(phoneInput, 'Please enter a valid 10-digit phone number'); return; }
        if (!email) { showError(emailInput, 'Email is required'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { showError(emailInput, 'Please enter a valid email address'); return; }
        if (!password) { showError(passwordInput, 'Password is required'); return; }
        if (password.length < 6) { showError(passwordInput, 'Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { showError(confirmPasswordInput, 'Passwords do not match'); return; }
        
        // ✅ PIN validation
        if (!pin) { showError(pinInput, 'Transaction PIN is required'); return; }
        if (pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) { showError(pinInput, 'PIN must be exactly 4 digits'); return; }
        if (pin !== confirmPin) { showError(confirmPinInput, 'PINs do not match'); return; }
        
        if (userExists(phone, email)) { showError(phoneInput, '❌ User with this phone or email already exists.'); return; }

        showSpinner();

        setTimeout(function() {
            const userData = {
                fullName: fullName,
                phone: phone,
                email: email,
                password: password,
                transactionPin: pin, // ✅ Save PIN
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLogin: null,
                loginCount: 0,
                balance: 0,
                totalFundAdded: 0,
                totalWithdrawn: 0,
                totalSent: 0,
                totalReceived: 0,
                activities: [],
                transactions: [],
                pendingApprovals: [],
                apiKey: null,
                apiToken: null
            };
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            users.push(userData);
            localStorage.setItem('users', JSON.stringify(users));

            // ✅ Also save to server database via API
            fetch('https://bots-hub-pay.onrender.com/api/generate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone,
                    fullName: fullName,
                    email: email,
                    balance: 0
                })
            }).catch(err => console.log('Server sync:', err));

            hideSpinner();
            showSuccessPopup('🎉 Account Created Successfully!');

            setTimeout(function() {
                window.location.href = 'index.html';
            }, 1500);

        }, 1500);
    });

    function showError(input, message) {
        const box = input.closest('.input-box');
        box.style.borderColor = '#ff1744';
        box.style.boxShadow = '0 0 0 3px rgba(255, 23, 68, 0.1)';
        box.classList.add('shake');
        const existingError = input.closest('.input-group').querySelector('.error-message');
        if (existingError) existingError.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
        const group = input.closest('.input-group');
        group.appendChild(errorDiv);
        setTimeout(() => { box.classList.remove('shake'); }, 500);
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.input-box').forEach(box => {
            box.style.borderColor = '#e5e9f0';
            box.style.boxShadow = 'none';
            box.classList.remove('shake');
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            registerForm.dispatchEvent(new Event('submit'));
        }
    });
});
