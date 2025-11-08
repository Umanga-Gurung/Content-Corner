document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form elements
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    // Get error elements
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Reset errors
    clearErrors();

    let isValid = true;

    // Email validation
    if (!email.value.trim()) {
        showError(email, emailError, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        showError(email, emailError, 'Please enter a valid email address');
        isValid = false;
    }

    // Password validation
    if (!password.value.trim()) {
        showError(password, passwordError, 'Password is required');
        isValid = false;
    } else if (password.value.length < 6) {
        showError(password, passwordError, 'Password must be at least 8 characters');
        isValid = false;
    }

    if (isValid) {
        const data = {
            login: email.value.trim(),
            password: password.value
        };

        fetch('https://content-corner-8vf4.onrender.com/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(data.token);
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('userId', data.user_id);
                    showSuccessModal('Login successful!', 'You have logged in successfully.');

                } else {

                    throw new Error(data.message || 'Login Failed !');;
                }
            })
            .catch(error => {
                showSuccessModal('Error', error.message);
            });
    }
});

// Modal functionality
function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle.textContent !== 'Error') {
        window.location.replace('homepage.html');
    }
}

// Event listeners for modal
document.getElementById('closeModalBtn').addEventListener('click', hideModal);
document.getElementById('modalOkBtn').addEventListener('click', hideModal);
document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModal();
    }
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
}

function clearErrors() {
    const inputs = document.querySelectorAll('.login-form input');
    const errors = document.querySelectorAll('.error');

    inputs.forEach(input => input.classList.remove('error'));
    errors.forEach(error => error.textContent = '');
}

document.getElementById('email').addEventListener('input', function() {
    clearFieldError(this, document.getElementById('emailError'));
});
document.getElementById('password').addEventListener('input', function() {
    clearFieldError(this, document.getElementById('passwordError'));
});

function clearFieldError(input, errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
}