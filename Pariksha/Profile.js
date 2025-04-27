document.addEventListener('DOMContentLoaded', function() {
    // Make all inputs and selects readonly by default
    document.querySelectorAll('.profile-form input, .profile-form select').forEach(element => {
        element.readOnly = true;
        if (element.tagName.toLowerCase() === 'select') {
            element.disabled = true;
        }
    });

    // File input change handler
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById('profile-image').src = event.target.result;
                    document.querySelector('.profile-mini').src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Sidebar functionality
    const menuIcon = document.querySelector('.menu-icon');
    const sidebar = document.querySelector('.sidebar');
    let isSidebarCollapsed = false;

    // Check for saved sidebar state
    const sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState === 'collapsed') {
        sidebar.classList.add('collapsed');
        isSidebarCollapsed = true;
    }

    if (menuIcon && sidebar) {
        menuIcon.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            isSidebarCollapsed = !isSidebarCollapsed;
            localStorage.setItem('sidebarState', isSidebarCollapsed ? 'collapsed' : 'expanded');
            menuIcon.setAttribute('p', isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar');
        });

        // Update tooltip on hover based on sidebar state
        menuIcon.addEventListener('mouseover', () => {
            menuIcon.setAttribute('p', isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar');
        });
    }

    // Add dropdown functionality
    document.querySelectorAll('.dropdown-header').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (content) {
                content.classList.toggle('show');
            }
        });
    });

    // Dark Mode Implementation
    const darkModeToggle = document.getElementById("darkModeToggle");

    // Function to apply dark mode
    function applyDarkMode(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        if (darkModeToggle) {
            darkModeToggle.checked = theme === "dark";
        }
    }

    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem("theme") || 
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    applyDarkMode(savedTheme);

    // Toggle theme when the switch is clicked
    if (darkModeToggle) {
        darkModeToggle.addEventListener("change", function () {
            const theme = this.checked ? "dark" : "light";
            applyDarkMode(theme);
            localStorage.setItem("theme", theme);
        });
    }

    // Add click handlers for navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
});

// Profile management functions
const profile = {
    // Get user profile data
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching profile:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user profile
    async updateProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user stats
    async getUserStats(userId) {
        try {
            // Get test results
            const { data: testResults, error: testError } = await supabase
                .from('test_results')
                .select(`
                    id,
                    score,
                    time_taken,
                    created_at,
                    tests (
                        title
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (testError) throw testError;

            // Calculate stats
            const stats = {
                testsTaken: testResults.length,
                averageScore: 0,
                rank: '-',
                recentTests: []
            };

            if (testResults.length > 0) {
                const totalScore = testResults.reduce((sum, result) => sum + result.score, 0);
                stats.averageScore = Math.round((totalScore / testResults.length) * 100) / 100;

                // Get recent tests
                stats.recentTests = testResults.slice(0, 5).map(result => ({
                    id: result.id,
                    title: result.tests.title,
                    score: result.score,
                    date: new Date(result.created_at).toLocaleDateString()
                }));
            }

            // Get rank (TODO: Implement ranking system)
            // For now, using placeholder
            stats.rank = '-';

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user's created tests
    async getUserCreatedTests(userId) {
        try {
            const { data, error } = await supabase
                .from('tests')
                .select('*')
                .eq('created_by', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching created tests:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user's bookmarked questions
    async getUserBookmarks(userId) {
        try {
            const { data, error } = await supabase
                .from('bookmarks')
                .select(`
                    id,
                    created_at,
                    questions (
                        id,
                        question_text,
                        tests (
                            title
                        )
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
            return { success: false, error: error.message };
        }
    }
};

// Update profile page with real data
async function updateProfilePage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'Login Page.html';
        return;
    }

    try {
        // Get profile data
        const profileResult = await profile.getUserProfile(user.id);
        if (!profileResult.success) throw new Error(profileResult.error);

        // Get user stats
        const statsResult = await profile.getUserStats(user.id);
        if (!statsResult.success) throw new Error(statsResult.error);

        // Update UI with profile data
        document.getElementById('user-name').textContent = profileResult.data.full_name || 'User';
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-username').textContent = profileResult.data.username || 'No username set';

        // Update stats
        document.getElementById('tests-taken').textContent = statsResult.data.testsTaken;
        document.getElementById('avg-score').textContent = `${statsResult.data.averageScore}%`;
        document.getElementById('rank').textContent = statsResult.data.rank;

        // Update recent tests
        const recentTestsList = document.getElementById('recent-tests-list');
        if (recentTestsList) {
        if (statsResult.data.recentTests.length > 0) {
            recentTestsList.innerHTML = statsResult.data.recentTests.map(test => `
                <li class="test-item">
                    <div class="test-info">
                        <h4>${test.title}</h4>
                        <p>Completed on ${test.date}</p>
                    </div>
                    <div class="test-score">${test.score}%</div>
                </li>
            `).join('');
        } else {
            recentTestsList.innerHTML = `
                <li class="test-item">
                    <div class="test-info">
                        <h4>No tests taken yet</h4>
                        <p>Start your first test now!</p>
                    </div>
                </li>
            `;
            }
        } else {
            console.log('Note: recent-tests-list element not found in the DOM, skipping update');
        }

    } catch (error) {
        console.error('Error updating profile page:', error);
        alert('Error loading profile data. Please try again later.');
    }
}

// Edit profile function
async function editProfile() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'Login Page.html';
        return;
    }

    // Get current profile data
    const profileResult = await profile.getUserProfile(user.id);
    if (!profileResult.success) {
        alert('Error loading profile data');
        return;
    }

    // Show edit form
    const newUsername = prompt('Enter new username:', profileResult.data.username);
    if (!newUsername) return;

    // Update profile
    const updateResult = await profile.updateProfile(user.id, {
        username: newUsername
    });

    if (updateResult.success) {
        alert('Profile updated successfully!');
        updateProfilePage(); // Refresh the page
    } else {
        alert('Error updating profile: ' + updateResult.error);
    }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    updateProfilePage();
});