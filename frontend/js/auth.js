const API_URL = 'http://localhost:5000/api';

console.log('auth.js loaded');

// Register Form Handler
if (document.getElementById('registerForm')) {
    console.log('Register form found');
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Register form submitted');
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const branch = document.getElementById('branch').value;
        const year = parseInt(document.getElementById('year').value);
        const skillsInput = document.getElementById('skills').value.trim();
        const interestsInput = document.getElementById('interests').value.trim();
        
        const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
        const interests = interestsInput ? interestsInput.split(',').map(s => s.trim()).filter(Boolean) : [];

        console.log('Form data:', { name, email, branch, year, skills, interests });

        try {
            console.log('Sending request to:', `${API_URL}/auth/register`);
            
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    password, 
                    branch, 
                    year, 
                    skills, 
                    interests 
                }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // Save token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showSuccess('Account created successfully! Redirecting...');
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showError(data.message || 'Registration failed');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
}

// Login Form Handler
if (document.getElementById('loginForm')) {
    console.log('Login form found');
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        console.log('Login data:', { email });

        try {
            console.log('Sending request to:', `${API_URL}/auth/login`);
            
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // Save token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showSuccess('Login successful! Redirecting...');
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showError(data.message || 'Login failed');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.classList.add('show');
    }
    
    if (successDiv) {
        successDiv.style.display = 'none';
    }
    
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.classList.remove('show');
        }
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}