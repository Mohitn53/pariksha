// Main JavaScript file for PARIKSHA

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme switcher
    initThemeSwitcher();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize FAQ accordion
    initFaqAccordion();
    
    // Initialize page-specific functionality
    const currentPage = getCurrentPage();
    switch(currentPage) {
        case 'give-test':
            initGiveTestPage();
            break;
        case 'create-test':
            initCreateTestPage();
            break;
        case 'generate-test':
            initGenerateTestPage();
            break;
        case 'resources':
            initResourcesPage();
            break;
        default:
            // Home page or other pages
            break;
    }
});

// Theme switcher functionality
function initThemeSwitcher() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleBtn?.querySelector('i');
    
    // Check for saved theme preference or respect OS preference
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    // Apply theme based on saved preference or OS preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
    
    // Toggle theme when button is clicked
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            // Toggle the theme
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update the icon
            if (themeIcon) {
                if (newTheme === 'dark') {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                } else {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                }
            }
        });
    }
    
    // Listen for OS theme changes
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) { // Only auto switch if user hasn't manually set a preference
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            
            // Update the icon
            if (themeIcon) {
                if (theme === 'dark') {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                } else {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                }
            }
        }
    });

    // Update profile dropdown based on login status
    updateProfileDropdown();
}

function updateProfileDropdown() {
    const profileDropdown = document.querySelector('.profile-dropdown ul');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (!profileDropdown) return;

    if (isLoggedIn) {
        // Get user info
        const user = JSON.parse(sessionStorage.getItem('user')) || {};
        const username = user.username || 'User';
        
        profileDropdown.innerHTML = `
            <li><p class="username-display">@${username}</p></li>
            <li><a href="dashboard.html">My Profile</a></li>
            <li><a href="#" onclick="handleLogout(event)">Log out</a></li>
        `;
    } else {
        profileDropdown.innerHTML = `
            <li><a href="Login Page.html">Login</a></li>
            <li><a href="Signup page.html">Sign up</a></li>
        `;
    }
}

function handleLogout(event) {
    event.preventDefault();
    
    // Clear all stored data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('hasUsername');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('hasUsername');
    sessionStorage.removeItem('user');
    
    // Redirect to login page
    window.location.replace('Login Page.html');
}

// Get the current page from URL
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().split('.')[0];
    return page === 'index' || page === '' ? 'home' : page;
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add('mobile-menu-btn');
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    
    if (header && nav) {
        header.insertBefore(mobileMenuBtn, nav);
        
        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            
            if (mobileMenuBtn.classList.contains('active')) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

// Give Test Page functionality
function initGiveTestPage() {
    const searchInput = document.querySelector('.search-box input');
    const filterSelects = document.querySelectorAll('.filter-options select');
    const testCards = document.querySelectorAll('.test-card');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterTests);
    }
    
    if (filterSelects.length > 0) {
        filterSelects.forEach(select => {
            select.addEventListener('change', filterTests);
        });
    }
    
    function filterTests() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const subjectFilter = getFilterValue('subject');
        const difficultyFilter = getFilterValue('difficulty');
        
        if (testCards.length > 0) {
            testCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const subject = card.dataset.subject;
                const difficulty = card.dataset.difficulty;
                
                const matchesSearch = title.includes(searchTerm);
                const matchesSubject = subjectFilter === 'all' || subject === subjectFilter;
                const matchesDifficulty = difficultyFilter === 'all' || difficulty === difficultyFilter;
                
                if (matchesSearch && matchesSubject && matchesDifficulty) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
    
    function getFilterValue(filterName) {
        const select = document.querySelector(`.filter-options select[name="${filterName}"]`);
        return select ? select.value : 'all';
    }
    
    // Initialize the start test functionality
    const startTestButtons = document.querySelectorAll('.btn-start-test');
    if (startTestButtons.length > 0) {
        startTestButtons.forEach(button => {
            button.addEventListener('click', function() {
                const testId = this.dataset.testId;
                // Here you would start the test with the given ID
                // For now, we'll just redirect to a test page (which we'll create)
                window.location.href = `test-page.html?id=${testId}`;
            });
        });
    }
}

// Create Test Page functionality
function initCreateTestPage() {
    const addQuestionBtn = document.getElementById('add-question');
    const questionsContainer = document.getElementById('questions-container');
    let questionCount = document.querySelectorAll('.question-block').length || 0;
    
    if (addQuestionBtn && questionsContainer) {
        addQuestionBtn.addEventListener('click', addNewQuestion);
        
        // Initialize existing questions
        const existingQuestions = document.querySelectorAll('.question-block');
        if (existingQuestions.length > 0) {
            existingQuestions.forEach(question => {
                initQuestionBlock(question);
            });
        } else {
            // Add first question if none exists
            addNewQuestion();
        }
    }
    
    function addNewQuestion() {
        questionCount++;
        
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');
        questionBlock.dataset.questionId = questionCount;
        
        questionBlock.innerHTML = `
            <div class="question-header">
                <div class="question-number">Question ${questionCount}</div>
                <button type="button" class="btn-remove" data-action="remove-question">
                    <i class="fas fa-trash-alt"></i> Remove
                </button>
            </div>
            <div class="form-group">
                <label for="question-${questionCount}">Question Text</label>
                <textarea class="form-control" id="question-${questionCount}" name="question-${questionCount}" rows="3" required></textarea>
            </div>
            <div class="option-group" data-question-id="${questionCount}">
                <label>Options</label>
                <div class="option-row">
                    <div class="option-letter">A</div>
                    <div class="option-input">
                        <input type="text" class="form-control" name="option-${questionCount}-1" required>
                    </div>
                    <div class="option-correct">
                        <input type="radio" name="correct-${questionCount}" value="1" required>
                    </div>
                </div>
                <div class="option-row">
                    <div class="option-letter">B</div>
                    <div class="option-input">
                        <input type="text" class="form-control" name="option-${questionCount}-2" required>
                    </div>
                    <div class="option-correct">
                        <input type="radio" name="correct-${questionCount}" value="2" required>
                    </div>
                </div>
            </div>
            <button type="button" class="btn-add" data-action="add-option" data-question-id="${questionCount}">
                <i class="fas fa-plus"></i> Add Option
            </button>
        `;
        
        questionsContainer.appendChild(questionBlock);
        initQuestionBlock(questionBlock);
    }
    
    function initQuestionBlock(questionBlock) {
        const removeBtn = questionBlock.querySelector('[data-action="remove-question"]');
        const addOptionBtn = questionBlock.querySelector('[data-action="add-option"]');
        
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                questionBlock.remove();
                renumberQuestions();
            });
        }
        
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', function() {
                addNewOption(this.dataset.questionId);
            });
        }
    }
    
    function addNewOption(questionId) {
        const optionGroup = document.querySelector(`.option-group[data-question-id="${questionId}"]`);
        const optionRows = optionGroup.querySelectorAll('.option-row');
        const newOptionIndex = optionRows.length + 1;
        
        if (newOptionIndex > 6) {
            alert('Maximum 6 options allowed per question');
            return;
        }
        
        const optionRow = document.createElement('div');
        optionRow.classList.add('option-row');
        
        const letterIndex = String.fromCharCode(64 + newOptionIndex); // A=65, B=66, etc.
        
        optionRow.innerHTML = `
            <div class="option-letter">${letterIndex}</div>
            <div class="option-input">
                <input type="text" class="form-control" name="option-${questionId}-${newOptionIndex}" required>
            </div>
            <div class="option-correct">
                <input type="radio" name="correct-${questionId}" value="${newOptionIndex}" required>
            </div>
        `;
        
        optionGroup.appendChild(optionRow);
    }
    
    function renumberQuestions() {
        const questionBlocks = document.querySelectorAll('.question-block');
        questionBlocks.forEach((block, index) => {
            const number = index + 1;
            block.querySelector('.question-number').textContent = `Question ${number}`;
        });
    }
    
    // Form submission
    const createTestForm = document.getElementById('create-test-form');
    if (createTestForm) {
        createTestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Here you would send the form data to the server
            // For demonstration, we'll just show an alert
            alert('Test created successfully!');
            createTestForm.reset();
            
            // Remove all questions except the first one
            const questionBlocks = document.querySelectorAll('.question-block');
            for (let i = 1; i < questionBlocks.length; i++) {
                questionBlocks[i].remove();
            }
            
            // Reset the first question
            if (questionBlocks.length > 0) {
                const firstQuestion = questionBlocks[0];
                const textareas = firstQuestion.querySelectorAll('textarea');
                const inputs = firstQuestion.querySelectorAll('input[type="text"]');
                const radios = firstQuestion.querySelectorAll('input[type="radio"]');
                
                textareas.forEach(textarea => textarea.value = '');
                inputs.forEach(input => input.value = '');
                radios.forEach(radio => radio.checked = false);
            }
        });
    }
}

// Generate Test Page functionality
function initGenerateTestPage() {
    const previewSection = document.querySelector('.preview-section');
    const generateForm = document.querySelector('.generate-form form');
    
    if (generateForm && previewSection) {
        const formInputs = generateForm.querySelectorAll('input, select');
        
        // Listen to form changes to update preview
        formInputs.forEach(input => {
            input.addEventListener('change', updatePreview);
        });
        
        // Generate button functionality
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                generateTest();
            });
        }
    }
    
    function updatePreview() {
        const subject = document.getElementById('subject').value;
        const questionCount = document.getElementById('question-count').value;
        const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'mixed';
        
        if (subject && questionCount) {
            const previewContent = document.querySelector('.preview-content');
            if (previewContent) {
                previewContent.innerHTML = `
                    <div class="preview-header">
                        <h3>Test Preview</h3>
                    </div>
                    <div class="preview-details">
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Number of Questions:</strong> ${questionCount}</p>
                        <p><strong>Difficulty:</strong> ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
                        <p><strong>Estimated Time:</strong> ${calculateEstimatedTime(questionCount, difficulty)} minutes</p>
                    </div>
                `;
            }
        }
    }
    
    function calculateEstimatedTime(questionCount, difficulty) {
        // Simple formula to estimate test duration based on question count and difficulty
        const baseTimePerQuestion = {
            'easy': 1,
            'medium': 1.5,
            'hard': 2,
            'mixed': 1.5
        };
        
        return Math.round(questionCount * baseTimePerQuestion[difficulty]);
    }
    
    function generateTest() {
        // Here you would generate the test based on form inputs
        // For demonstration, we'll just show an alert and redirect
        alert('Test generated successfully!');
        // Redirect to the test page
        // window.location.href = 'test-page.html?generated=true';
    }
}

// Resources Page functionality
function initResourcesPage() {
    const searchInput = document.querySelector('.search-box input');
    const filterSelect = document.querySelector('.filter-options select');
    const resourceCards = document.querySelectorAll('.resource-card');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterResources);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', filterResources);
    }
    
    function filterResources() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const categoryFilter = filterSelect ? filterSelect.value : 'all';
        
        if (resourceCards.length > 0) {
            resourceCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const category = card.dataset.category;
                
                const matchesSearch = title.includes(searchTerm);
                const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
                
                if (matchesSearch && matchesCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
}

// Additional utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAlert(message, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert', `alert-${type}`);
    alertBox.textContent = message;
    
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
        alertBox.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => {
            alertBox.remove();
        }, 300);
    }, 3000);
}

// Add CSS for mobile menu and alerts
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--primary-color);
            cursor: pointer;
        }
        
        .alert {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        
        .alert.show {
            transform: translateX(0);
        }
        
        .alert-info {
            background-color: var(--primary-color);
        }
        
        .alert-success {
            background-color: var(--success-color);
        }
        
        .alert-warning {
            background-color: var(--warning-color);
            color: #333;
        }
        
        .alert-danger {
            background-color: var(--danger-color);
        }
        
        @media (max-width: 768px) {
            .mobile-menu-btn {
                display: block;
            }
            
            nav {
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background-color: white;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }
            
            nav.active {
                max-height: 300px;
            }
            
            nav ul {
                flex-direction: column;
                padding: 20px;
            }
            
            nav ul li {
                margin: 10px 0;
            }
        }
    `;
    
    document.head.appendChild(style);
});

// Dropdown menu functionality for mobile
document.addEventListener('DOMContentLoaded', function() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    // Handle click on dropdown toggles
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if we're on mobile view (based on CSS breakpoint)
            if (window.innerWidth <= 768) {
                const parent = this.parentElement;
                
                // Close all other open dropdowns
                document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                    if (dropdown !== parent) {
                        dropdown.classList.remove('active');
                    }
                });
                
                // Toggle active class on parent dropdown
                parent.classList.toggle('active');
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown') && window.innerWidth <= 768) {
            document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
    
    // Close dropdowns on window resize (e.g., when switching from mobile to desktop)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
});

// Profile dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (profileBtn && profileDropdown) {
        // Toggle dropdown on mobile when clicking the profile button
        profileBtn.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.profile-menu') && window.innerWidth <= 768) {
                if (profileDropdown.style.display === 'block') {
                    profileDropdown.style.display = 'none';
                }
            }
        });
        
        // Reset dropdown on window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                profileDropdown.style.display = '';
            }
        });
    }
});

// Team Carousel
document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevButton = document.querySelector('.carousel-control.prev');
    const nextButton = document.querySelector('.carousel-control.next');
    
    if (!track || slides.length === 0) return;
    
    let currentIndex = 0;
    let slideWidth = slides[0].getBoundingClientRect().width;
    let autoSlideInterval;
    const autoSlideDelay = 5000; // 5 seconds
    
    // Initialize slides position
    function initSlides() {
        slideWidth = slides[0].getBoundingClientRect().width;
        track.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
    }
    
    // Move to specific slide
    function moveToSlide(index) {
        if (index < 0) {
            index = slides.length - 1;
        } else if (index >= slides.length) {
            index = 0;
        }
        
        currentIndex = index;
        track.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === currentIndex);
        });
        
        // Reset auto slide timer
        resetAutoSlide();
    }
    
    // Next slide
    function nextSlide() {
        moveToSlide(currentIndex + 1);
    }
    
    // Previous slide
    function prevSlide() {
        moveToSlide(currentIndex - 1);
    }
    
    // Start auto sliding
    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, autoSlideDelay);
    }
    
    // Reset auto slide timer
    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }
    
    // Event listeners
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);
    
    // Indicator buttons
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => moveToSlide(index));
    });
    
    // Handle window resize
    window.addEventListener('resize', initSlides);
    
    // Touch events for mobile swiping
    let startX, endX;
    const minSwipeDistance = 50;
    
    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    track.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        const distance = endX - startX;
        
        if (Math.abs(distance) > minSwipeDistance) {
            if (distance > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
    });
    
    // Pause auto slide on hover
    track.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });
    
    track.addEventListener('mouseleave', () => {
        startAutoSlide();
    });
    
    // Initialize
    initSlides();
    startAutoSlide();
});

// FAQ Accordion functionality
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => {
                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }
} 