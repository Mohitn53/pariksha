document.addEventListener('DOMContentLoaded', function() {
    // Navigation functionality
    initializeNavigation();
    
    // Initialize pie chart
    initializePieChart();
    
    // Initialize filters
    initializeFilters();
});

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.results-nav a');
    const sections = document.querySelectorAll('section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.style.display = 'none');
            
            // Show target section
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).style.display = targetId === 'status' ? 'grid' : 'block';
        });
    });
}

function initializePieChart() {
    const percentileChart = document.querySelector('.percentile-chart');
    if (!percentileChart) return;

    // Question statistics
    const stats = {
        correct: 17,
        incorrect: 3,
        unanswered: 22
    };
    
    const total = stats.correct + stats.incorrect + stats.unanswered;
    
    // Calculate percentages
    const correctPercent = (stats.correct / total) * 100;
    const incorrectPercent = (stats.incorrect / total) * 100;
    const unansweredPercent = (stats.unanswered / total) * 100;

    // Create hover areas and tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    percentileChart.appendChild(tooltip);

    // Create hover areas for each section
    const sections = [
        { type: 'correct', count: stats.correct, percent: correctPercent, color: '#2ed573' },
        { type: 'incorrect', count: stats.incorrect, percent: incorrectPercent, color: '#ff4757' },
        { type: 'unanswered', count: stats.unanswered, percent: unansweredPercent, color: '#ffa502' }
    ];

    sections.forEach((section) => {
        const hoverArea = document.createElement('div');
        hoverArea.className = `chart-hover-area ${section.type}`;
        percentileChart.appendChild(hoverArea);

        // Set CSS variables for clip-path
        if (section.type === 'correct') {
            percentileChart.style.setProperty('--correct-percent', `${section.percent}%`);
        } else if (section.type === 'incorrect') {
            percentileChart.style.setProperty('--total-answered-percent', `${correctPercent + section.percent}%`);
        } else {
            percentileChart.style.setProperty('--unanswered-percent', `${section.percent}%`);
        }

        // Add hover event listeners
        hoverArea.addEventListener('mousemove', (e) => {
            const rect = percentileChart.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            tooltip.innerHTML = `
                <strong>${section.type.charAt(0).toUpperCase() + section.type.slice(1)}</strong><br>
                Count: ${section.count}<br>
                Percentage: ${section.percent.toFixed(1)}%
            `;
            tooltip.style.opacity = '1';
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y - 30}px`;
        });

        hoverArea.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
    
    // Create conic gradient
    percentileChart.style.background = `conic-gradient(
        #2ed573 0% ${correctPercent}%,
        #ff4757 ${correctPercent}% ${correctPercent + incorrectPercent}%,
        #ffa502 ${correctPercent + incorrectPercent}% 100%
    )`;
}

function initializeFilters() {
    // Time filter for leaderboard
    const timeFilter = document.querySelector('select[name="time-filter"]');
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            // Here you would typically fetch and update leaderboard data
            console.log('Time filter changed to:', this.value);
        });
    }

    // Status filter for answers
    const statusFilter = document.querySelector('select[name="status-filter"]');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const questions = document.querySelectorAll('.question-item');
            const selectedValue = this.value;

            questions.forEach(question => {
                if (selectedValue === 'all') {
                    question.style.display = 'block';
                    return;
                }

                const isCorrect = question.querySelector('.status-correct') !== null;
                if (selectedValue === 'correct' && isCorrect) {
                    question.style.display = 'block';
                } else if (selectedValue === 'incorrect' && !isCorrect) {
                    question.style.display = 'block';
                } else {
                    question.style.display = 'none';
                }
            });
        });
    }

    // View rank button
    const viewRankBtn = document.querySelector('.view-rank');
    if (viewRankBtn) {
        viewRankBtn.addEventListener('click', function() {
            // Navigate to leaderboard section
            const leaderboardLink = document.querySelector('a[href="#leaderboard"]');
            if (leaderboardLink) {
                leaderboardLink.click();
            }
        });
    }
} 