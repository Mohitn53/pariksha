// Initialize Supabase client
const supabaseUrl = 'https://gsiytynzyccckzbzuxtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g';

// Global reference to Supabase client
let supabase;

// Flag to track initialization status
let supabaseInitialized = false;

// Initialize Supabase client immediately
try {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        supabaseInitialized = true;
        console.log('Supabase initialized immediately');
    } else {
        console.warn('Window or supabase not available for immediate initialization');
    }
} catch (err) {
    console.error('Error during immediate initialization:', err);
}

// Initialize Supabase client when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing Supabase client...');
    
    if (supabaseInitialized) {
        console.log('Supabase already initialized, skipping');
        return;
    }
    
    try {
        // Initialize the Supabase client using the global supabase object
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            supabaseInitialized = true;
            console.log('Supabase client initialized successfully');
            
            // Set up auth state change listener after initializing the client
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session);
                if (event === 'SIGNED_IN') {
                    console.log('User signed in');
                    const userData = {
                        id: session.user.id,
                        email: session.user.email,
                        fullName: session.user.user_metadata?.full_name
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                    sessionStorage.setItem('user', JSON.stringify(userData));
                    updateUIForLoggedInUser(userData);
                } else if (event === 'SIGNED_OUT') {
                    console.log('User signed out');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                    updateUIForLoggedOutUser();
                }
            });
        } else {
            console.error('window.supabase is undefined. Make sure the Supabase script is loaded before auth.js');
            return;
        }
        
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error retrieving session:', error);
            updateUIForLoggedOutUser();
            return;
        }
        
        if (session) {
            console.log('Found existing session:', session);
            const userData = {
                id: session.user.id,
                email: session.user.email,
                fullName: session.user.user_metadata?.full_name
            };
            
            // Store user data in both localStorage and sessionStorage
            localStorage.setItem('user', JSON.stringify(userData));
            sessionStorage.setItem('user', JSON.stringify(userData));
            
            // Update UI for logged in user
            updateUIForLoggedInUser(userData);
        } else {
            console.log('No existing session found');
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Error during initialization or session check:', error);
        updateUIForLoggedOutUser();
    }
    
    // Initialize UI based on stored user data
    initUI();
});

// Function to initialize the UI based on stored user data
function initUI() {
    console.log('Initializing UI based on stored user data');
    
    // Check if user data exists in storage
    const sessionData = sessionStorage.getItem('user');
    const localData = localStorage.getItem('user');
    const isLoggedInSession = sessionStorage.getItem('isLoggedIn') === 'true';
    const isLoggedInLocal = localStorage.getItem('isLoggedIn') === 'true';
    
    // If we have user data or login status, update the UI accordingly
    if (sessionData || localData || isLoggedInSession || isLoggedInLocal) {
        console.log('Found user data or login status, updating UI for logged in user');
        
        let userData;
        if (sessionData) {
            userData = JSON.parse(sessionData);
        } else if (localData) {
            userData = JSON.parse(localData);
            // Sync to session storage if only in local storage
            sessionStorage.setItem('user', localData);
        } else {
            // Create minimal user data if we only have isLoggedIn flag
            userData = { email: 'User' };
        }
        
        // Ensure login flags are set
        localStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('isLoggedIn', 'true');
        
        // Update the UI
        updateUIForLoggedInUser(userData);
    } else {
        console.log('No user data found, updating UI for logged out user');
        updateUIForLoggedOutUser();
    }
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
            console.error('Supabase connection error:', error);
            return false;
        }
        console.log('Supabase connection successful!');
        return true;
    } catch (error) {
        console.error('Error testing Supabase connection:', error);
        return false;
    }
}

// Test connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
        console.error('Failed to connect to Supabase. Please check your credentials.');
    }
});

// Sign up with email and password
async function signUp(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;
        
        // Store user data in both localStorage and sessionStorage for persistence
        const userData = {
            id: data.user.id,
            email: data.user.email,
            fullName: fullName
        };
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Add these flags to ensure all login status checks work
        localStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('hasUsername', 'true');
        sessionStorage.setItem('hasUsername', 'true');
        
        console.log('Sign up successful, redirecting...');
        
        // Redirect to home page after successful signup
        window.location.href = 'Pariksha Home Page.html';
        
        return { success: true, data };
    } catch (error) {
        console.error('Error signing up:', error.message);
        return { success: false, error: error.message };
    }
}

// Sign in with email and password
async function login(email, password) {
    try {
        console.log('Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        
        console.log('Login successful, updating data...');
        
        // Store user data in both localStorage and sessionStorage for persistence
        const userData = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name
        };
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Add these flags to ensure all login status checks work
        localStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('hasUsername', 'true');
        sessionStorage.setItem('hasUsername', 'true');
        
        // Update UI before redirect
        updateUIForLoggedInUser(userData);
        
        console.log('Redirecting to home page...');
        
        // Redirect to home page after successful login
        window.location.href = 'Pariksha Home Page.html';
        
        return { success: true, data };
    } catch (error) {
        console.error('Error signing in:', error.message);
        return { success: false, error: error.message };
    }
}

// Sign in with Google
async function googleLogin() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error signing in with Google:', error.message);
        return { success: false, error: error.message };
    }
}

// Sign out
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear all stored data
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('isLoggedIn');
        localStorage.removeItem('hasUsername');
        sessionStorage.removeItem('hasUsername');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('userEmail');
        
        // Update UI for logged out user
        updateUIForLoggedOutUser();
        
        // Redirect to home page
        window.location.href = 'Pariksha Home Page.html';
    } catch (error) {
        console.error('Error signing out:', error.message);
    }
}

// Set username
async function setUsername(username) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No user logged in');
        
        // Update user metadata
        const { error } = await supabase.auth.updateUser({
            data: { username: username }
        });

        if (error) throw error;
        
        // Update session storage
        const userData = JSON.parse(sessionStorage.getItem('user'));
        userData.username = username;
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true };
    } catch (error) {
        console.error('Error setting username:', error.message);
        return { success: false, error: error.message };
    }
}

// Check if username is available
async function checkUsernameAvailability(username) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        return { 
            available: !data,
            message: data ? 'Username already taken' : 'Username available'
        };
    } catch (error) {
        console.error('Error checking username:', error.message);
        return { available: false, error: error.message };
    }
}

// Get current user from storage
function getCurrentUser() {
    try {
        console.log('getCurrentUser called');
        
        // Check both session and local storage
        const sessionUser = sessionStorage.getItem('user');
        const localUser = localStorage.getItem('user');
        
        // Log what we found
        console.log('Session storage user data:', sessionUser ? 'Found' : 'Not found');
        console.log('Local storage user data:', localUser ? 'Found' : 'Not found');
        
        // Use session data first if available
        if (sessionUser) {
            try {
                const userData = JSON.parse(sessionUser);
                
                // Verify this is a valid user object
                if (!userData || !userData.id) {
                    console.warn('Invalid user data in session storage:', userData);
                    if (localUser) {
                        // Try local storage as backup
                        const localUserData = JSON.parse(localUser);
                        if (localUserData && localUserData.id) {
                            console.log('Using valid user data from local storage instead');
                            return localUserData;
                        }
                    }
                    return null;
                }
                
                console.log('Using user data from session storage, user ID:', userData.id);
                return userData;
            } catch (error) {
                console.error('Error parsing user data from session storage:', error);
                // If there's an error parsing, try local storage
            }
        }
        
        // Fallback to local storage
        if (localUser) {
            try {
                const userData = JSON.parse(localUser);
                
                // Verify this is a valid user object
                if (!userData || !userData.id) {
                    console.warn('Invalid user data in local storage:', userData);
                    return null;
                }
                
                console.log('Using user data from local storage, user ID:', userData.id);
                
                // Also save to session storage for future calls
                sessionStorage.setItem('user', localUser);
                
                return userData;
            } catch (error) {
                console.error('Error parsing user data from local storage:', error);
            }
        }
        
        // Check if auth is available to get from Supabase directly
        if (supabase && supabaseInitialized) {
            console.log('No user in storage, trying to get current user from Supabase');
            
            // Get async but don't wait for it now - log what we find
            (async () => {
                try {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (error) {
                        console.error('Error getting session from Supabase:', error);
                    } else if (session && session.user) {
                        console.log('Found session in Supabase, user ID:', session.user.id);
                        // We could update storage here but too late for this call
                    } else {
                        console.log('No current session in Supabase');
                    }
                } catch (e) {
                    console.error('Error checking Supabase session:', e);
                }
            })();
        } else {
            console.warn('Supabase not initialized, cannot check session directly');
        }
        
        console.log('No valid user data found in any storage');
        return null;
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return null;
    }
}

// Update UI based on auth state
function updateUIForLoggedInUser(user) {
    console.log('Updating UI for logged in user:', user);
    
    // Update profile menu
    const profileMenu = document.querySelector('.profile-dropdown ul');
    if (profileMenu) {
        console.log('Found profile menu, updating...');
        // Clear existing content
        profileMenu.innerHTML = '';
        
        // Add new menu items
        const menuItems = [
            { text: 'My Profile', href: 'My Profile.html' },
            { text: 'Dashboard', href: 'dashboard.html' },
            { text: 'Logout', onclick: 'logout()' }
        ];
        
        menuItems.forEach(item => {
            const li = document.createElement('li');
            if (item.onclick) {
                li.innerHTML = `<button onclick="${item.onclick}">${item.text}</button>`;
            } else {
                li.innerHTML = `<a href="${item.href}">${item.text}</a>`;
            }
            profileMenu.appendChild(li);
        });
        
        console.log('Profile menu updated with new items');
    } else {
        console.log('Profile menu not found!');
    }

    // Update navigation
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        if (link.textContent === 'Login' || link.textContent === 'Sign Up') {
            link.style.display = 'none';
        }
    });

    // Show user info in profile button
    const profileBtn = document.querySelector('#profile-btn');
    if (profileBtn) {
        console.log('Found profile button, updating with user email:', user.email);
        profileBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${user.email}`;
        profileBtn.style.backgroundColor = '#4CAF50'; // Green background for logged in state
        profileBtn.style.color = 'white';
        
        // Also try to update using classList to ensure styling is applied
        profileBtn.classList.add('logged-in');
    } else {
        console.error('Profile button not found! Make sure the HTML element with id="profile-btn" exists.');
    }
}

function updateUIForLoggedOutUser() {
    console.log('Updating UI for logged out user');
    
    // Reset profile menu
    const profileMenu = document.querySelector('.profile-dropdown ul');
    if (profileMenu) {
        console.log('Found profile menu, resetting...');
        // Clear existing content
        profileMenu.innerHTML = '';
        
        // Add login/signup items
        const menuItems = [
            { text: 'Login', href: 'Login Page.html' },
            { text: 'Sign Up', href: 'Signup page.html' }
        ];
        
        menuItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${item.href}">${item.text}</a>`;
            profileMenu.appendChild(li);
        });
        
        console.log('Profile menu reset to login/signup items');
    } else {
        console.log('Profile menu not found!');
    }

    // Update navigation
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        if (link.textContent === 'Login' || link.textContent === 'Sign Up') {
            link.style.display = 'block';
        }
    });

    // Reset profile button
    const profileBtn = document.querySelector('#profile-btn');
    if (profileBtn) {
        profileBtn.innerHTML = `<i class="fas fa-user-circle"></i>`;
        profileBtn.style.backgroundColor = ''; // Reset background
        profileBtn.style.color = ''; // Reset text color
    }
}

// Export functions for use in other files
window.signUp = signUp;
window.login = login;
window.googleLogin = googleLogin;
window.logout = logout;
window.setUsername = setUsername;
window.checkUsernameAvailability = checkUsernameAvailability;
window.getCurrentUser = getCurrentUser; 