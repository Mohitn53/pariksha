// Sample performance data - Replace with actual API call
const performanceData = {
    overall: {
        averageScore: 85,
        totalTime: '48h 30m',
        testsTaken: 42,
        ranking: 8
    },
    subjects: {
        mathematics: {
            score: 92,
            tests: 15,
            time: '12h',
            rank: 3,
            topics: {
                algebra: 95,
                geometry: 88,
                calculus: 90
            }
        },
        physics: {
            score: 85,
            tests: 12,
            time: '10h',
            rank: 5,
            topics: {
                mechanics: 87,
                thermodynamics: 82,
                electromagnetism: 85
            }
        },
        chemistry: {
            score: 78,
            tests: 10,
            time: '8h',
            rank: 12,
            topics: {
                organic: 75,
                inorganic: 80,
                physical: 78
            }
        }
    },
    weeklyPerformance: [
        { week: 1, score: 70 },
        { week: 2, score: 85 },
        { week: 3, score: 75 },
        { week: 4, score: 90 },
        { week: 5, score: 82 },
        { week: 6, score: 88 }
    ]
};

// Update overall stats
function updateOverallStats() {
    document.querySelector('.stat-value:nth-child(1)').textContent = `${performanceData.overall.averageScore}%`;
    document.querySelector('.stat-value:nth-child(2)').textContent = performanceData.overall.totalTime;
    document.querySelector('.stat-value:nth-child(3)').textContent = performanceData.overall.testsTaken;
    document.querySelector('.stat-value:nth-child(4)').textContent = `#${performanceData.overall.ranking}`;
}

// Update subject stats
function updateSubjectStats() {
    Object.entries(performanceData.subjects).forEach(([subject, data]) => {
        const subjectCard = document.querySelector(`[data-subject="${subject}"]`);
        if (subjectCard) {
            subjectCard.querySelector('.score').textContent = `${data.score}%`;
            subjectCard.querySelector('.progress-bar').style.width = `${data.score}%`;
            
            // Update stats
            const stats = subjectCard.querySelectorAll('[data-stat]');
            stats.forEach(stat => {
                const type = stat.getAttribute('data-stat');
                stat.textContent = data[type];
            });

            // Update topics
            Object.entries(data.topics).forEach(([topic, score]) => {
                const topicElement = subjectCard.querySelector(`[data-topic="${topic}"]`);
                if (topicElement) {
                    topicElement.querySelector('.progress').style.width = `${score}%`;
                    topicElement.querySelector('span:last-child').textContent = `${score}%`;
                }
            });
        }
    });
}

// Render performance graph
function renderPerformanceGraph() {
    const graphContainer = document.getElementById('performanceGraph');
    const svgPath = document.querySelector('.graph-line svg path');
    
    // Clear existing points
    graphContainer.innerHTML = '';
    
    // Calculate path
    const pathData = performanceData.weeklyPerformance.map((point, index) => {
        const x = 10 + (index * 15);
        const y = 100 - point.score;
        return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
    }).join(' ');
    
    // Update path
    svgPath.setAttribute('d', pathData);
    
    // Add points
    performanceData.weeklyPerformance.forEach((point, index) => {
        const x = 10 + (index * 15);
        const y = 100 - point.score;
        
        const pointElement = document.createElement('div');
        pointElement.className = 'graph-point';
        pointElement.style.setProperty('--x', `${x}%`);
        pointElement.style.setProperty('--y', `${y}%`);
        
        const tooltip = document.createElement('div');
        tooltip.className = 'graph-tooltip';
        tooltip.textContent = `Week ${point.week}: ${point.score}%`;
        
        // Position tooltip above or below the point based on position
        if (y < 50) {
            tooltip.style.top = 'auto';
            tooltip.style.bottom = '100%';
            tooltip.style.marginBottom = '8px';
        } else {
            tooltip.style.top = '100%';
            tooltip.style.marginTop = '8px';
        }
        
        pointElement.appendChild(tooltip);
        graphContainer.appendChild(pointElement);
    });
}

// Update time filter
document.getElementById('timeRange').addEventListener('change', function(e) {
    // Here you would typically fetch new data based on the selected time range
    // For now, we'll just re-render with existing data
    updateOverallStats();
    updateSubjectStats();
    renderPerformanceGraph();
});

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    updateOverallStats();
    updateSubjectStats();
    renderPerformanceGraph();
}); 