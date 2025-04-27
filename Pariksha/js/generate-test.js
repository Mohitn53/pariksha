document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const loadingState = document.querySelector('.loading-state');
    const previewSection = document.querySelector('.preview-section');

    // Drag and Drop Functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // File Input Change
    fileInput.addEventListener('change', function(e) {
        handleFiles(this.files);
    });

    // Click on Drop Zone
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                if (file.size <= 10 * 1024 * 1024) { // 10MB limit
                    // Show file name in drop zone
                    dropZone.innerHTML = `
                        <i class="fas fa-file-pdf"></i>
                        <p>${file.name}</p>
                        <p class="file-info">Click to change file</p>
                    `;
                } else {
                    alert('File size exceeds 10MB limit');
                }
            } else {
                alert('Please upload a PDF file');
            }
        }
    }

    // Generate Button Click
    generateBtn.addEventListener('click', async function() {
        const file = fileInput.files[0];
        const url = urlInput.value.trim();
        
        if (!file && !url) {
            alert('Please upload a PDF file or enter an article URL');
            return;
        }

        // Get configuration values
        const config = {
            questionCount: document.getElementById('questionCount').value,
            difficulty: document.getElementById('difficulty').value,
            questionType: document.getElementById('questionType').value,
            timeLimit: document.getElementById('timeLimit').value
        };

        // Show loading state
        loadingState.style.display = 'block';
        generateBtn.disabled = true;

        try {
            // Simulate API call (replace with actual API call)
            await simulateGenerateQuestions(file, url, config);

            // Show preview section with generated questions
            showPreview(generateSampleQuestions(config.questionCount));
        } catch (error) {
            alert('Error generating questions: ' + error.message);
        } finally {
            loadingState.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    // Preview Actions
    const editBtn = document.querySelector('.edit-btn');
    const saveBtn = document.querySelector('.save-btn');

    editBtn.addEventListener('click', function() {
        // Enable editing of questions
        const questions = document.querySelectorAll('.question-item');
        questions.forEach(question => {
            question.contentEditable = true;
            question.classList.add('editing');
        });
    });

    saveBtn.addEventListener('click', function() {
        // Save the test
        const questions = document.querySelectorAll('.question-item');
        questions.forEach(question => {
            question.contentEditable = false;
            question.classList.remove('editing');
        });
        alert('Test saved successfully!');
    });

    // Helper Functions
    async function simulateGenerateQuestions(file, url, config) {
        // Simulate API processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    }

    function showPreview(questions) {
        const questionsPreview = document.querySelector('.questions-preview');
        questionsPreview.innerHTML = questions.map((question, index) => `
            <div class="question-item">
                <div class="question-header">
                    <span class="question-number">Question ${index + 1}</span>
                </div>
                <div class="question-text">${question.text}</div>
                <div class="options-list">
                    ${question.options.map((option, i) => `
                        <div class="option-item">
                            <div class="option-marker">${String.fromCharCode(65 + i)}</div>
                            <span>${option}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        previewSection.style.display = 'block';
    }

    function generateSampleQuestions(count) {
        // Sample questions for preview (replace with actual generated questions)
        const questions = [];
        for (let i = 0; i < count; i++) {
            questions.push({
                text: `Sample generated question ${i + 1}?`,
                options: [
                    'Sample option 1',
                    'Sample option 2',
                    'Sample option 3',
                    'Sample option 4'
                ]
            });
        }
        return questions;
    }
}); 