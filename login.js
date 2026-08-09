// Login JavaScript - Bots Hub Pay

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const phoneInput = document.getElementById('loginPhone');
    const passwordInput = document.getElementById('loginPassword');
    const rememberCheckbox = document.getElementById('rememberMe');
    const loginButton = document.getElementById('loginBtn');

    // Eye icon toggle
    const passwordBox = passwordInput.closest('.input-box');
    const eyeIcon = document.createElement('i');
    eyeIcon.className = 'fa-regular fa-eye';
    passwordBox.appendChild(eyeIcon);

    let isPasswordVisible = false;
    eyeIcon.addEventListener('click', function() {
        isPasswordVisible = !isPasswordVisible;
        passwordInput.type = isPasswordVisible ? 'text' : 'password';
        this.className = isPasswordVisible ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
        this.style.color = isPasswordVisible ? '#4169ff' : '#7c8297';
    });

    // Check if already logged in
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Saved credentials
    const savedPhone = localStorage.getItem('savedPhone');
    const savedPassword = localStorage.getItem('savedPassword');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';

    if (savedPhone && rememberMe) {
        phoneInput.value = savedPhone;
        passwordInput.value = savedPassword;
        rememberCheckbox.checked = true;
    }

    const OWNER_PHONE = '8824146248';
    const OWNER_PASSWORD = 'owner8824146248';

    function getUserByPhone(phone) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.phone === phone);
    }

    function updateLastLogin(phone) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(user => user.phone === phone);
        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date().toISOString();
            users[userIndex].loginCount = (users[userIndex].loginCount || 0) + 1;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const phone = phoneInput.value.trim();
        const password = passwordInput.value.trim();
        const remember = rememberCheckbox.checked;

        if (!phone) {
            showError(phoneInput, 'Phone number is required');
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/[^0-9]/g, ''))) {
            showError(phoneInput, 'Please enter a valid 10-digit phone number');
            return;
        }

        if (!password) {
            showError(passwordInput, 'Password is required');
            return;
        }

        if (password.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            return;
        }

        clearErrors();

        // Owner Login
        if (phone === OWNER_PHONE && password === OWNER_PASSWORD) {
            sessionStorage.setItem('isOwnerLoggedIn', 'true');
            sessionStorage.setItem('ownerPhone', phone);
            sessionStorage.setItem('ownerPassword', password);
            loginButton.innerHTML = '<i class="fa-solid fa-check"></i> Welcome Owner! 👑';
            loginButton.style.background = 'linear-gradient(90deg, #ffd700, #ff9100)';
            setTimeout(function() {
                window.location.href = 'owner-dashboard.html';
            }, 1000);
            return;
        }

        loginButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
        loginButton.disabled = true;

        setTimeout(function() {
            const user = getUserByPhone(phone);

            if (!user) {
                showError(phoneInput, '❌ No account found. Please register first.');
                loginButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
                loginButton.disabled = false;
                return;
            }

            if (user.password !== password) {
                showError(passwordInput, '❌ Incorrect password. Please try again.');
                loginButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
                loginButton.disabled = false;
                return;
            }

            if (user.isActive === false) {
                showError(phoneInput, '⛔ Account is deactivated. Contact support.');
                loginButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
                loginButton.disabled = false;
                return;
            }

            updateLastLogin(phone);

            if (remember) {
                localStorage.setItem('savedPhone', phone);
                localStorage.setItem('savedPassword', password);
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('savedPhone');
                localStorage.removeItem('savedPassword');
                localStorage.removeItem('rememberMe');
            }

            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userPhone', phone);
            sessionStorage.setItem('userName', user.fullName || 'User');
            sessionStorage.setItem('userEmail', user.email || '');

            loginButton.innerHTML = '<i class="fa-solid fa-check"></i> Welcome back, ' + (user.fullName || 'User') + '!';
            loginButton.style.background = 'linear-gradient(90deg, #00c853, #00e676)';

            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1500);

        }, 1500);
    });

    function showError(input, message) {
        clearErrors();
        const box = input.closest('.input-box');
        box.style.borderColor = '#ff1744';
        box.style.boxShadow = '0 0 0 3px rgba(255, 23, 68, 0.1)';
        box.classList.add('shake');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
        const group = input.closest('.input-group');
        group.appendChild(errorDiv);
        setTimeout(() => {
            box.classList.remove('shake');
        }, 500);
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.input-box').forEach(box => {
            box.style.borderColor = '#e5e9f0';
            box.style.boxShadow = 'none';
            box.classList.remove('shake');
        });
        loginButton.style.background = '';
        loginButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
        loginButton.disabled = false;
    }

    phoneInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
    });

    const forgotLink = document.querySelector('.options a');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot-password.html';
        });
    }
});