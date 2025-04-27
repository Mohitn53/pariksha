document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in on auth pages
    const currentPage = window.location.pathname;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    const hasUsername = localStorage.getItem('hasUsername') === 'true' || sessionStorage.getItem('hasUsername') === 'true';

    // Redirect from auth pages if logged in
    if ((currentPage.includes('Login Page.html') || currentPage.includes('Signup page.html')) && isLoggedIn) {
        window.location.replace('Pariksha Home Page.html');
        return;
    }

    // Redirect from create-username if username is already set
    if (currentPage.includes('create-username.html') && hasUsername) {
        window.location.replace('Pariksha Home Page.html');
        return;
    }

    // Signup form handling
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');

        // Function to validate passwords match
        function validatePasswords() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (password !== confirmPassword) {
                confirmPasswordInput.setCustomValidity("Passwords do not match");
                return false;
            } else {
                confirmPasswordInput.setCustomValidity("");
                return true;
            }
        }

        // Add event listeners for real-time validation
        passwordInput.addEventListener('input', validatePasswords);
        confirmPasswordInput.addEventListener('input', validatePasswords);

        // Signup form submission handler
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            if (!validatePasswords()) {
                return;
            }

            // Get all form data
            const fullName = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;

            // Create user object
            const user = {
                fullName: fullName,
                email: email,
                password: password // In a real application, this should be handled securely
            };

            // Store user data in session storage
            sessionStorage.setItem('user', JSON.stringify(user));

            // Redirect to create username page and prevent going back
            window.location.replace('create-username.html');
        });
    }

    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Get login form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember').checked;

            // Here you would typically make an API call to verify credentials
            // For demo purposes, we'll simulate a successful login
            
            // Store login state if remember me is checked
            if (rememberMe) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('hasUsername', 'true'); // Assume existing users have username
            } else {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('hasUsername', 'true'); // Assume existing users have username
            }

            // Redirect to home page and prevent going back
            window.location.replace('Pariksha Home Page.html');
        });
    }

    // Username form handling
    const usernameForm = document.getElementById('username-form');
    if (usernameForm) {
        usernameForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const username = document.getElementById('username').value;
            
            // Get user info from session storage
            const userJson = sessionStorage.getItem('user');
            if (!userJson) {
                window.location.replace('signup.html');
                return;
            }
            
            const user = JSON.parse(userJson);
            user.username = username;
            
            // Save updated user info and set login state
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('hasUsername', 'true');
            
            // Redirect to home page and prevent going back
            window.location.replace('Pariksha Home Page.html');
        });
    }
});

// Prevent going back to auth pages using browser back button
window.addEventListener('popstate', function(event) {
    const currentPage = window.location.pathname;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    const hasUsername = localStorage.getItem('hasUsername') === 'true' || sessionStorage.getItem('hasUsername') === 'true';

    if (isLoggedIn && (currentPage.includes('Login Page.html') || currentPage.includes('Signup page.html'))) {
        window.history.forward();
    }

    if (hasUsername && currentPage.includes('create-username.html')) {
        window.history.forward();
    }
}); 