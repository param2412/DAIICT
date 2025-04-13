document.addEventListener('DOMContentLoaded', function() {
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email.trim()) {
                showFormError('email', 'Email is required');
                return;
            }
            
            if (!validateEmail(email)) {
                showFormError('email', 'Please enter a valid email address');
                return;
            }
            
            if (!password.trim()) {
                showFormError('password', 'Password is required');
                return;
            }
            
            // Clear any previous errors
            clearFormErrors();
            
            // Submit the form
            this.submit();
        });
    }
    
    // Handle registration form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const password2 = document.getElementById('password2').value;
            
            if (!username.trim()) {
                showFormError('username', 'Username is required');
                return;
            }
            
            if (username.length < 3) {
                showFormError('username', 'Username must be at least 3 characters long');
                return;
            }
            
            if (!email.trim()) {
                showFormError('email', 'Email is required');
                return;
            }
            
            if (!validateEmail(email)) {
                showFormError('email', 'Please enter a valid email address');
                return;
            }
            
            if (!password.trim()) {
                showFormError('password', 'Password is required');
                return;
            }
            
            if (password.length < 8) {
                showFormError('password', 'Password must be at least 8 characters long');
                return;
            }
            
            if (password !== password2) {
                showFormError('password2', 'Passwords do not match');
                return;
            }
            
            // Clear any previous errors
            clearFormErrors();
            
            // Submit the form
            this.submit();
        });
    }
    
    // Handle profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const currentPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (!username.trim()) {
                showFormError('username', 'Username is required');
                return;
            }
            
            if (username.length < 3) {
                showFormError('username', 'Username must be at least 3 characters long');
                return;
            }
            
            if (!email.trim()) {
                showFormError('email', 'Email is required');
                return;
            }
            
            if (!validateEmail(email)) {
                showFormError('email', 'Please enter a valid email address');
                return;
            }
            
            // Only validate password fields if the user is trying to change their password
            if (newPassword.trim()) {
                if (!currentPassword.trim()) {
                    showFormError('current_password', 'Current password is required to set a new password');
                    return;
                }
                
                if (newPassword.length < 8) {
                    showFormError('new_password', 'New password must be at least 8 characters long');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    showFormError('confirm_password', 'Passwords do not match');
                    return;
                }
            }
            
            // Clear any previous errors
            clearFormErrors();
            
            // Submit the form
            this.submit();
        });
    }
    
    // Helper functions
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    function showFormError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Add invalid class to the field
        field.classList.add('is-invalid');
        
        // Find or create the feedback element
        let feedback = field.nextElementSibling;
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            field.parentNode.insertBefore(feedback, field.nextSibling);
        }
        
        // Set the error message
        feedback.textContent = message;
    }
    
    function clearFormErrors() {
        document.querySelectorAll('.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        document.querySelectorAll('.invalid-feedback').forEach(feedback => {
            feedback.textContent = '';
        });
    }
});
