from django.http import HttpResponse
from django.template import loader
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def api_landing_page(request):
    """
    API landing page that doesn't require authentication.
    """
    return Response({
        "message": "Welcome to the Life Care Plan Genius API",
        "version": "1.0.0",
        "endpoints": {
            "authentication": {
                "token": "/api/token/",
                "refresh": "/api/token/refresh/"
            },
            "registration": "/api/register/",
            "users": "/api/users/",
            "evaluees": "/api/evaluees/",
            "plans": "/api/plans/",
            "entries": "/api/entries/",
            "geographic_factors": "/api/geographic-factors/",
            "cpt_codes": "/api/cpt-codes/"
        },
        "documentation": "For more information, please refer to the API documentation.",
        "authentication_required": "Most endpoints require authentication. Please obtain a token using the /api/token/ endpoint."
    })

def html_landing_page(request):
    """
    HTML landing page that doesn't require authentication.
    """
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Life Care Plan Genius API</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
            }
            h1 {
                color: #2c3e50;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            h2 {
                color: #3498db;
                margin-top: 30px;
            }
            .endpoint {
                background-color: #f9f9f9;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
            }
            .endpoint-name {
                font-weight: bold;
                color: #2980b9;
            }
            .endpoint-url {
                font-family: monospace;
                background-color: #eee;
                padding: 2px 5px;
                border-radius: 3px;
            }
            .note {
                background-color: #ffffcc;
                padding: 10px;
                border-left: 4px solid #ffcc00;
                margin: 20px 0;
            }
            .auth-container {
                display: flex;
                justify-content: space-between;
                margin-top: 30px;
            }
            .auth-form {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
                width: 48%;
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input[type="text"],
            input[type="email"],
            input[type="password"] {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            button {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background-color: #2980b9;
            }
            .error-message {
                color: #e74c3c;
                margin-top: 10px;
                display: none;
            }
            .success-message {
                color: #27ae60;
                margin-top: 10px;
                display: none;
            }
        </style>
        <script>
            // Intercept all fetch requests to add the Authorization header
            if (window.fetch) {
                const originalFetch = window.fetch;
                window.fetch = function(url, options) {
                    options = options || {};
                    options.headers = options.headers || {};
                    
                    const token = localStorage.getItem('access_token');
                    if (token && !options.headers['Authorization']) {
                        options.headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    return originalFetch(url, options);
                };
            }
        </script>
    </head>
    <body>
        <h1>Life Care Plan Genius API</h1>
        
        <p>Welcome to the Life Care Plan Genius API. This API provides endpoints for managing life care plans, including cost calculations, data export, and more.</p>
        
        <div class="note">
            <strong>Note:</strong> Most endpoints require authentication. Please sign in or register to access the full functionality.
        </div>
        
        <div class="auth-container">
            <div class="auth-form">
                <h2>Sign In</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-username">Username</label>
                        <input type="text" id="login-username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" name="password" required>
                    </div>
                    <button type="submit">Sign In</button>
                    <div id="login-error" class="error-message"></div>
                    <div id="login-success" class="success-message">Login successful! Redirecting...</div>
                </form>
            </div>
            
            <div class="auth-form">
                <h2>Register</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="register-username">Username</label>
                        <input type="text" id="register-username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email">Email</label>
                        <input type="email" id="register-email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <input type="password" id="register-password" name="password" required>
                    </div>
                    <button type="submit">Register</button>
                    <div id="register-error" class="error-message"></div>
                    <div id="register-success" class="success-message">Registration successful! Please sign in.</div>
                </form>
            </div>
        </div>
        
        <h2>API Endpoints</h2>
        <div class="endpoint">
            <div class="endpoint-name">Authentication</div>
            <div class="endpoint-url">POST /api/token/</div>
            <p>Provide your username and password to obtain a JWT token.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">Refresh Token</div>
            <div class="endpoint-url">POST /api/token/refresh/</div>
            <p>Refresh your JWT token.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">Registration</div>
            <div class="endpoint-url">POST /api/register/</div>
            <p>Register a new user account.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">Users</div>
            <div class="endpoint-url">GET /api/users/</div>
            <p>List users and get user details.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">Evaluees</div>
            <div class="endpoint-url">GET /api/evaluees/</div>
            <p>Manage evaluees for life care plans.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">Life Care Plans</div>
            <div class="endpoint-url">GET /api/plans/</div>
            <p>Create, list, update, and delete life care plans.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">Care Plan Entries</div>
            <div class="endpoint-url">GET /api/entries/</div>
            <p>Manage entries within life care plans.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">Geographic Factors</div>
            <div class="endpoint-url">GET /api/geographic-factors/</div>
            <p>Access geographic adjustment factors.</p>
        </div>
        <div class="endpoint">
            <div class="endpoint-name">CPT Codes</div>
            <div class="endpoint-url">GET /api/cpt-codes/</div>
            <p>Look up and validate CPT codes.</p>
        </div>
        
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Check if user is already authenticated
                const accessToken = localStorage.getItem('access_token');
                if (accessToken) {
                    // Verify token validity by making a request to the user endpoint
                    fetch('/api/users/me/', {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    })
                    .then(response => {
                        if (response.ok) {
                            // Token is valid, redirect to main app
                            redirectToApp();
                        } else {
                            // Token is invalid, clear it
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                        }
                    })
                    .catch(error => {
                        console.error('Error verifying token:', error);
                    });
                }
                
                // Function to redirect to app with token
                function redirectToApp() {
                    // Create a form to POST to the plans page with the token
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = '/api/plans/';
                    form.style.display = 'none';
                    
                    // Add token as hidden field
                    const tokenField = document.createElement('input');
                    tokenField.type = 'hidden';
                    tokenField.name = 'token';
                    tokenField.value = localStorage.getItem('access_token');
                    form.appendChild(tokenField);
                    
                    // Add CSRF token if needed
                    const csrftoken = getCookie('csrftoken');
                    if (csrftoken) {
                        const csrfField = document.createElement('input');
                        csrfField.type = 'hidden';
                        csrfField.name = 'csrfmiddlewaretoken';
                        csrfField.value = csrftoken;
                        form.appendChild(csrfField);
                    }
                    
                    document.body.appendChild(form);
                    form.submit();
                }
                
                // Function to get cookies
                function getCookie(name) {
                    let cookieValue = null;
                    if (document.cookie && document.cookie !== '') {
                        const cookies = document.cookie.split(';');
                        for (let i = 0; i < cookies.length; i++) {
                            const cookie = cookies[i].trim();
                            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                                break;
                            }
                        }
                    }
                    return cookieValue;
                }
                
                // Login form submission
                document.getElementById('login-form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const username = document.getElementById('login-username').value;
                    const password = document.getElementById('login-password').value;
                    
                    fetch('/api/token/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Invalid credentials');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Store tokens in localStorage
                        localStorage.setItem('access_token', data.access);
                        localStorage.setItem('refresh_token', data.refresh);
                        
                        // Show success message
                        document.getElementById('login-error').style.display = 'none';
                        document.getElementById('login-success').style.display = 'block';
                        
                        // Redirect to main app after a short delay
                        setTimeout(() => {
                            redirectToApp();
                        }, 1500);
                    })
                    .catch(error => {
                        document.getElementById('login-error').textContent = error.message;
                        document.getElementById('login-error').style.display = 'block';
                        document.getElementById('login-success').style.display = 'none';
                    });
                });
                
                // Registration form submission
                document.getElementById('register-form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const username = document.getElementById('register-username').value;
                    const email = document.getElementById('register-email').value;
                    const password = document.getElementById('register-password').value;
                    
                    fetch('/api/register/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: username,
                            email: email,
                            password: password
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(data => {
                                throw new Error(data.error || 'Registration failed');
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Show success message
                        document.getElementById('register-error').style.display = 'none';
                        document.getElementById('register-success').style.display = 'block';
                        
                        // Clear the form
                        document.getElementById('register-form').reset();
                    })
                    .catch(error => {
                        document.getElementById('register-error').textContent = error.message;
                        document.getElementById('register-error').style.display = 'block';
                        document.getElementById('register-success').style.display = 'none';
                    });
                });
            });
        </script>
        
        <footer style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; color: #777;">
            <p>Life Care Plan Genius API v1.0.0</p>
        </footer>
    </body>
    </html>
    """
    return HttpResponse(html_content)
