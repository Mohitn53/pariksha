// test-utils.js - Utilities for handling test operations

// Function to save test results to the database
async function saveTestResult(testResult) {
    try {
        console.log('saveTestResult called with data:', JSON.stringify(testResult, null, 2));
        
        // Validate input
        if (!testResult) {
            const errorMsg = 'Error: No test result provided';
            console.error(errorMsg);
            alert(errorMsg);
            return { success: false, error: errorMsg };
        }

        // Check for required fields - make testId optional
        const requiredFields = ['answers', 'timeTaken']; // testId is now optional
        const missingFields = requiredFields.filter(field => !testResult[field]);
        if (missingFields.length > 0) {
            const errorMsg = `Error: Missing required fields for test results: ${missingFields.join(', ')}`;
            console.error(errorMsg);
            alert(errorMsg);
            return { success: false, error: errorMsg };
        }

        // Calculate scores
        let totalQuestions = testResult.questions ? testResult.questions.length : testResult.totalQuestions;
        const answers = testResult.answers || [];

        // Log when test_id is missing to help with debugging
        if (!testResult.testId) {
            console.log('No testId provided - this will be treated as a standalone test result');
        }
        
        // Save to session storage first as a backup
        console.log('Saving test results to sessionStorage');
        sessionStorage.setItem('testResults', JSON.stringify(testResult));
        
        // Check if user is logged in
        const currentUser = getCurrentUser();
        console.log('Current user:', currentUser ? JSON.stringify(currentUser) : 'Not logged in');
        
        if (!currentUser) {
            const errorMsg = 'User not logged in - results saved to sessionStorage only';
            console.warn(errorMsg);
            alert('Results saved locally only. Please log in to save results to your account.');
            sessionStorage.setItem('localSavedOnly', 'true');
            return { success: true, warning: errorMsg, data: testResult, localSaved: true };
        }
        
        // Add a UUID generation function
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        
        // Ensure we have a Supabase client
        if (!supabase) {
            console.log('Creating new Supabase client');
            
            // Check if we're in a browser environment first
            if (typeof window !== 'undefined' && window.supabase) {
                supabase = window.supabase;
            } else if (typeof createClient === 'function') {
                const supabaseUrl = 'https://gsiytynzyccckzbzuxtc.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g';
                supabase = createClient(supabaseUrl, supabaseKey);
            } else {
                const error = 'Unable to create Supabase client - no client function available';
                console.error(error);
                alert('Error saving to database. Results saved locally only.');
                sessionStorage.setItem('localSavedOnly', 'true');
                return { success: true, error, localSaved: true, data: testResult };
            }
        }
        
        // Get user authentication token if available
        let authToken = null;
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session) {
                authToken = session.access_token;
                console.log('Found auth token for database access');
            } else {
                console.log('No auth session found, proceeding with anonymous access');
            }
        } catch (authError) {
            console.warn('Error getting auth session:', authError);
        }
        
        // Create a simplified database-compatible record
        const dbRecord = {
            user_id: currentUser.id,
            score: testResult.score,
            time_taken: testResult.timeTaken,
            correct_answers: testResult.correctAnswers || 0,
            incorrect_answers: testResult.incorrectAnswers || 0,
            total_questions: totalQuestions,
            total_possible_score: 100,
            attempted_questions: answers.filter(a => a !== null && a !== undefined).length,
            is_passed: testResult.score >= 60,
            start_time: testResult.startTime ? new Date(testResult.startTime).toISOString() : new Date(Date.now() - testResult.timeTaken * 1000).toISOString(),
            end_time: testResult.endTime ? new Date(testResult.endTime).toISOString() : new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        
        // Check if the provided test_id exists and use it only if it does
        let testIdExists = false;
        if (testResult.testId && isValidUUID(testResult.testId)) {
            try {
                // Check if the test_id exists in the tests table
                const { data: testExists, error: testCheckError } = await supabase
                    .from('tests')
                    .select('id')
                    .eq('id', testResult.testId)
                    .maybeSingle();
                
                if (!testCheckError && testExists) {
                    console.log('Test ID exists in database, using it:', testResult.testId);
                    dbRecord.test_id = testResult.testId;
                    testIdExists = true;
                } else {
                    console.log('Test ID not found in database, will not include it in the record');
                }
            } catch (testCheckError) {
                console.warn('Error checking if test exists:', testCheckError);
            }
        }
        
        // If trying to save a test result without a valid test_id that exists in the database,
        // we need to handle it differently
        if (!testIdExists) {
            console.log('No valid test_id found in database, saving as standalone result');
            
            // Save a copy of the test data for local reference
            const localRecord = {
                ...testResult,
                id: generateUUID(),
                saveTime: new Date().toISOString(),
                saveStatus: 'local_only_no_valid_test_id'
            };
            
            console.log('Saving to local storage with detailed test info');
            sessionStorage.setItem('testResults', JSON.stringify(localRecord));
            sessionStorage.setItem('localSavedOnly', 'true');
            
            // If we're in development and want to mock a successful save
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return { 
                    success: true,
                    localSaved: true,
                    data: localRecord,
                    info: 'Saved locally as test_id not valid for database'
                };
            }
            
            // Try saving to the database without a test_id reference
            try {
                // Create a special endpoint or request method for standalone results
                // or use another table that doesn't have the constraint
                
                // For now, just return the local save as success
                return { 
                    success: true,
                    localSaved: true,
                    data: localRecord,
                    info: 'Test results saved locally only (no valid test_id for database)'
                };
            } catch (standaloneError) {
                console.error('Error saving standalone result:', standaloneError);
                return { 
                    success: true,
                    error: 'Could not save to database: ' + standaloneError.message,
                    localSaved: true,
                    data: localRecord
                };
            }
        }
                
        console.log('Database record for saving:', dbRecord);
                
        // Try saving to database
        try {
            // Build fetch headers with proper authentication
            const headers = {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g',
                'Prefer': 'return=representation'
            };
            
            // Add auth token if available
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            } else {
                // Use anonymous key as fallback
                headers['Authorization'] = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g`;
            }
            
            // Make the API request
            const response = await fetch('https://gsiytynzyccckzbzuxtc.supabase.co/rest/v1/test_results', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(dbRecord)
            });
            
            if (!response.ok) {
                const responseText = await response.text();
                console.error('Database save error:', response.status, responseText);
                throw new Error(`Database error: ${response.status} - ${responseText}`);
            }
            
            const data = await response.json();
            console.log('Test result saved to database:', data);
            
            if (data && data.length > 0) {
                sessionStorage.setItem('testResultId', data[0].id);
                console.log('Test result ID saved to session storage:', data[0].id);
                return { success: true, data: data[0] };
            } else {
                throw new Error('No data returned from database');
            }
        } 
        catch (dbError) {
            console.error('Error saving to database:', dbError);
            
            // Save locally as fallback
            sessionStorage.setItem('localSavedOnly', 'true');
            
            // Create a complete record for local storage
            const localRecord = {
                ...testResult,
                id: generateUUID(),
                saveTime: new Date().toISOString(),
                saveError: dbError.message || 'Unknown database error'
            };
            
            console.log('Saving to local storage as fallback');
            sessionStorage.setItem('testResults', JSON.stringify(localRecord));
            
            alert('Could not save results to database. Results have been saved locally only.');
            
            return { 
                success: true, // Return success since we did save locally
                error: 'Database saving failed: ' + dbError.message,
                localSaved: true,
                data: localRecord
            };
        }
    } 
    catch (error) {
        const errorMsg = `Critical error in saveTestResult: ${error.message}`;
        console.error(errorMsg, error);
        alert(`Error saving test results: ${error.message}`);
        
        // Save locally at least
        sessionStorage.setItem('localSavedOnly', 'true');
        return { success: false, error: errorMsg, localSaved: true };
    }
}

// Helper function to prepare test result data for database
function prepareTestResultData(testResult, currentUser, totalQuestions, answers) {
    // Create the base result object with all needed fields
    const result = {
        user_id: currentUser.id,
        test_id: (testResult.testId && isValidUUID(testResult.testId)) ? 
            testResult.testId : generateUUID(),
        score: testResult.score,
        time_taken: testResult.timeTaken,
        correct_answers: testResult.correctAnswers || 0,
        incorrect_answers: (testResult.incorrectAnswers !== undefined) ? 
            testResult.incorrectAnswers : 
            (totalQuestions - (testResult.correctAnswers || 0)),
        total_questions: totalQuestions,
        attempted_questions: answers.filter(a => a !== null && a !== undefined).length,
        is_passed: testResult.score >= 60,
        start_time: testResult.startTime ? new Date(testResult.startTime).toISOString() : new Date(Date.now() - testResult.timeTaken * 1000).toISOString(),
        end_time: testResult.endTime ? new Date(testResult.endTime).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString()
    };

    return result;
}

// Add a UUID generation function that can be used globally
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to get user's test history
async function getUserTestHistory(userId) {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get test results for the user
        const { data, error } = await supabase
            .from('test_results')
            .select(`
                id,
                score,
                total_questions,
                correct_answers,
                incorrect_answers,
                time_taken,
                created_at,
                tests (
                    id,
                    title,
                    subject,
                    description
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return { success: true, data };

    } catch (error) {
        console.error('Error fetching test history:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to get a specific test result
async function getTestResultDetails(resultId) {
    try {
        if (!resultId) {
            throw new Error('Result ID is required');
        }

        console.log('Fetching test result details for ID:', resultId);

        // First check if the result ID exists in the database
        try {
            const { data: existsCheck, error: existsError } = await supabase
                .from('test_results')
                .select('id')
                .eq('id', resultId)
                .maybeSingle();

            if (existsError) {
                console.error('Error checking if result exists:', existsError);
            } else if (!existsCheck) {
                console.warn('Test result ID not found in database:', resultId);
                return { success: false, error: 'Test result not found in database' };
            } else {
                console.log('Test result exists in database:', resultId);
            }
        } catch (existsCheckError) {
            console.error('Error during existence check:', existsCheckError);
        }

        // Construct select query based on expected columns
        // This is done to avoid errors if some columns don't exist
        const selectQuery = `
            id,
            score,
            total_questions,
            correct_answers,
            incorrect_answers,
            time_taken,
            user_id,
            test_id,
            created_at`;
            
        // Fields that might not exist in older schema versions
        const optionalFields = [
            'attempted_questions',
            'start_time',
            'end_time',
            'is_passed',
            'total_possible_score'
        ];

        // Get detailed test result with careful error handling
        try {
            // Try to get the basic test result data first without any joins
            const { data: basicData, error: basicError } = await supabase
                .from('test_results')
                .select(selectQuery)
                .eq('id', resultId)
                .maybeSingle();
                    
            if (basicError) {
                console.error('Basic query failed:', basicError);
                throw basicError;
            }
            
            if (!basicData) {
                console.warn('No data found for test result ID:', resultId);
                return { success: false, error: 'Test result data not found' };
            }
            
            console.log('Retrieved basic test result data:', basicData);
            
            // If we successfully got the basic data, try to get the test data if it exists
            if (basicData.test_id) {
                try {
                    const { data: testData, error: testError } = await supabase
                        .from('tests')
                        .select(`
                            id,
                            title,
                            subject,
                            description,
                            time_limit,
                            difficulty,
                            instructions,
                            created_by,
                            questions (
                                id,
                                question_text,
                                option_a,
                                option_b,
                                option_c,
                                option_d,
                                correct_answer,
                                marks
                            )
                        `)
                        .eq('id', basicData.test_id)
                        .maybeSingle();
                        
                    if (!testError && testData) {
                        console.log('Retrieved test data for test result:', testData);
                        basicData.tests = testData;
                    } else {
                        console.warn('Could not retrieve test data for test ID:', basicData.test_id);
                    }
                } catch (testQueryError) {
                    console.error('Error querying test data:', testQueryError);
                }
            } else {
                console.log('Test result has no test_id, skipping test data fetch');
            }
            
            // Add optional fields if they exist
            try {
                const { data: fullData, error: fullError } = await supabase
                    .from('test_results')
                    .select(`${optionalFields.join(',')}`)
                    .eq('id', resultId)
                    .maybeSingle();
                    
                if (!fullError && fullData) {
                    console.log('Retrieved optional fields for test result:', fullData);
                    // Merge the optional fields into the basic data
                    Object.assign(basicData, fullData);
                }
            } catch (optionalFieldsError) {
                console.warn('Error getting optional fields:', optionalFieldsError);
            }

            // Process the data to include additional information if needed
            if (basicData) {
                // Convert string timestamps to Date objects if needed
                if (basicData.start_time && typeof basicData.start_time === 'string') {
                    basicData.start_time = new Date(basicData.start_time);
                }
                if (basicData.end_time && typeof basicData.end_time === 'string') {
                    basicData.end_time = new Date(basicData.end_time);
                }
                if (basicData.created_at && typeof basicData.created_at === 'string') {
                    basicData.created_at = new Date(basicData.created_at);
                }
                
                // Initialize answers array if it doesn't exist
                basicData.answers = [];
            }

            return { success: true, data: basicData };
            
        } catch (queryError) {
            console.error('Error querying test result:', queryError);
            throw queryError;
        }
    } catch (error) {
        console.error('Error fetching test result details:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to get user performance analytics
async function getUserPerformanceAnalytics(userId) {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get all test results for the user
        const { data, error } = await supabase
            .from('test_results')
            .select(`
                id,
                score,
                total_questions,
                correct_answers,
                incorrect_answers,
                time_taken,
                created_at,
                tests (
                    subject
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        // Calculate analytics
        const analytics = {
            totalTestsTaken: data.length,
            averageScore: 0,
            subjectPerformance: {},
            progressOverTime: [],
            averageTimePerQuestion: 0
        };

        if (data.length > 0) {
            // Calculate average score
            const totalScore = data.reduce((sum, result) => sum + result.score, 0);
            analytics.averageScore = Math.round((totalScore / data.length) * 10) / 10;

            // Calculate average time per question
            const totalQuestions = data.reduce((sum, result) => sum + result.total_questions, 0);
            const totalTime = data.reduce((sum, result) => sum + result.time_taken, 0);
            analytics.averageTimePerQuestion = totalQuestions > 0 ? 
                Math.round((totalTime / totalQuestions) * 10) / 10 : 0;

            // Group by subject
            const subjectScores = {};
            const subjectCounts = {};
            
            data.forEach(result => {
                const subject = result.tests?.subject || 'Unknown';
                if (!subjectScores[subject]) {
                    subjectScores[subject] = 0;
                    subjectCounts[subject] = 0;
                }
                subjectScores[subject] += result.score;
                subjectCounts[subject]++;
            });
            
            // Calculate average score by subject
            Object.keys(subjectScores).forEach(subject => {
                analytics.subjectPerformance[subject] = {
                    averageScore: Math.round((subjectScores[subject] / subjectCounts[subject]) * 10) / 10,
                    testsTaken: subjectCounts[subject]
                };
            });
            
            // Progress over time (last 10 tests)
            analytics.progressOverTime = data.slice(-10).map(result => ({
                date: new Date(result.created_at).toLocaleDateString(),
                score: result.score,
                subject: result.tests?.subject || 'Unknown'
            }));
        }

        return { success: true, data: analytics };

    } catch (error) {
        console.error('Error fetching user analytics:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to get test details and its questions from database
async function getTestDetails(testId) {
    try {
        if (!testId) {
            throw new Error('Test ID is required');
        }

        console.log('Fetching test details for ID:', testId);

        // Check if we have a valid Supabase client
        if (typeof supabase === 'undefined') {
            console.error('Supabase client not initialized in test-utils');
            
            // Try to initialize supabase directly if it's not available
            if (typeof window !== 'undefined' && window.supabase) {
                console.log('Attempting to initialize Supabase directly in test-utils');
                const supabaseUrl = 'https://gsiytynzyccckzbzuxtc.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g';
                supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            } else {
                throw new Error('Supabase client not initialized and cannot be initialized');
            }
        }

        // Get test details with its questions
        const { data, error } = await supabase
            .from('tests')
            .select(`
                id,
                title,
                description,
                subject,
                difficulty,
                time_limit,
                created_by,
                is_public,
                created_at,
                questions (
                    id,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_answer,
                    question_number
                )
            `)
            .eq('id', testId)
            .single();

        if (error) {
            console.error('Error fetching test details:', error);
            throw error;
        }

        if (!data) {
            throw new Error('Test not found');
        }

        console.log('Retrieved test details:', data);

        // Format the data to match the expected structure in test-page.html
        const formattedTest = {
            id: data.id,
            title: data.title,
            description: data.description,
            subject: data.subject,
            difficulty: data.difficulty,
            timeLimit: data.time_limit,
            questions: data.questions.map(q => {
                try {
                    return {
                        question: q.question_text,
                        optionA: q.option_a,
                        optionB: q.option_b,
                        optionC: q.option_c,
                        optionD: q.option_d,
                        correct: q.correct_answer || q.correct_option || 'A' // Handle either column name
                    };
                } catch (error) {
                    console.error('Error formatting question:', error, q);
                    // Return a default question if there's an error
                    return {
                        question: q.question_text || 'Question not available',
                        optionA: q.option_a || 'Option A',
                        optionB: q.option_b || 'Option B',
                        optionC: q.option_c || 'Option C',
                        optionD: q.option_d || 'Option D',
                        correct: 'A'
                    };
                }
            })
        };

        return { success: true, data: formattedTest };

    } catch (error) {
        console.error('Error fetching test details:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to get a random test from the database
async function getRandomTest() {
    try {
        console.log('Fetching a random test from the database');

        // Check if we have a valid Supabase client
        if (typeof supabase === 'undefined') {
            console.error('Supabase client not initialized in test-utils');
            
            // Try to initialize supabase directly if it's not available
            if (typeof window !== 'undefined' && window.supabase) {
                console.log('Attempting to initialize Supabase directly in test-utils');
                const supabaseUrl = 'https://gsiytynzyccckzbzuxtc.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g';
                supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            } else {
                throw new Error('Supabase client not initialized and cannot be initialized');
            }
        }

        // Get a random public test with questions
        const { data, error } = await supabase
            .from('tests')
            .select(`
                id,
                title,
                description,
                subject,
                difficulty_level,
                time_limit,
                created_by,
                is_public,
                created_at,
                questions (
                    id,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d,
                    correct_answer
                )
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching random test:', error);
            throw error;
        }

        if (!data) {
            throw new Error('No tests found');
        }

        console.log('Retrieved random test:', data);

        // Format the data to match the expected structure in test-page.html
        const formattedTest = {
            id: data.id,
            title: data.title,
            description: data.description,
            subject: data.subject,
            difficulty: data.difficulty_level,
            timeLimit: data.time_limit,
            questions: data.questions.map(q => {
                try {
                    return {
                        question: q.question_text,
                        optionA: q.option_a,
                        optionB: q.option_b,
                        optionC: q.option_c,
                        optionD: q.option_d,
                        correct: q.correct_answer || q.correct_option || 'A' // Handle either column name
                    };
                } catch (error) {
                    console.error('Error formatting question:', error, q);
                    // Return a default question if there's an error
                    return {
                        question: q.question_text || 'Question not available',
                        optionA: q.option_a || 'Option A',
                        optionB: q.option_b || 'Option B',
                        optionC: q.option_c || 'Option C',
                        optionD: q.option_d || 'Option D',
                        correct: 'A'
                    };
                }
            })
        };

        return { success: true, data: formattedTest };

    } catch (error) {
        console.error('Error fetching random test:', error.message);
        return { success: false, error: error.message };
    }
}

// Function to generate and save a sample test with 10 questions
async function generateSampleTest(userId) {
    try {
        if (!userId) {
            throw new Error('User ID is required to create a test');
        }

        console.log('Generating sample test for user:', userId);

        // Check if we have a valid Supabase client
        if (typeof supabase === 'undefined') {
            console.error('Supabase client not initialized in test-utils');
            
            // Try to initialize supabase directly if it's not available
            if (typeof window !== 'undefined' && window.supabase) {
                console.log('Attempting to initialize Supabase directly in test-utils');
                const supabaseUrl = 'https://gsiytynzyccckzbzuxtc.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g';
                supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            } else {
                throw new Error('Supabase client not initialized and cannot be initialized');
            }
        }

        // First create the test
        const testData = {
            title: "Basic Mathematics Test",
            description: "Test your basic mathematics knowledge with this 10 question quiz",
            subject: "mathematics",
            difficulty_level: "medium",
            time_limit: 30, // 30 minutes
            created_by: userId,
            is_public: true
        };

        console.log('Creating test with data:', testData);

        // Insert the test
        const { data: testResult, error: testError } = await supabase
            .from('tests')
            .insert([testData])
            .select();

        if (testError) {
            console.error('Error creating test:', testError);
            throw testError;
        }

        if (!testResult || testResult.length === 0) {
            throw new Error('Failed to create test');
        }

        const testId = testResult[0].id;
        console.log('Test created with ID:', testId);

        // Sample 10 math questions with answers
        const questions = [
            {
                question_text: "What is 5 + 7?",
                option_a: "10",
                option_b: "11",
                option_c: "12",
                option_d: "13",
                correct_answer: "C",
                explanation: "5 + 7 = 12",
                test_id: testId
            },
            {
                question_text: "What is 8 × 9?",
                option_a: "63",
                option_b: "72",
                option_c: "81",
                option_d: "64",
                correct_answer: "B",
                explanation: "8 × 9 = 72",
                test_id: testId
            },
            {
                question_text: "Solve for x: 2x + 5 = 15",
                option_a: "x = 5",
                option_b: "x = 7.5",
                option_c: "x = 10",
                option_d: "x = 3",
                correct_answer: "A",
                explanation: "2x + 5 = 15\n2x = 10\nx = 5",
                test_id: testId
            },
            {
                question_text: "What is the square root of 144?",
                option_a: "12",
                option_b: "14",
                option_c: "10",
                option_d: "16",
                correct_answer: "A",
                explanation: "√144 = 12 because 12² = 144",
                test_id: testId
            },
            {
                question_text: "What is the area of a rectangle with length 8 and width 5?",
                option_a: "13",
                option_b: "26",
                option_c: "40",
                option_d: "64",
                correct_answer: "C",
                explanation: "Area = length × width = 8 × 5 = 40",
                test_id: testId
            },
            {
                question_text: "What is the value of π (pi) to two decimal places?",
                option_a: "3.14",
                option_b: "3.16",
                option_c: "3.12",
                option_d: "3.18",
                correct_answer: "A",
                explanation: "π ≈ 3.14159... which rounds to 3.14",
                test_id: testId
            },
            {
                question_text: "If a triangle has sides of lengths 3, 4, and 5, what is its area?",
                option_a: "6 square units",
                option_b: "8 square units",
                option_c: "10 square units",
                option_d: "12 square units",
                correct_answer: "A",
                explanation: "This is a 3-4-5 right triangle. Area = (base × height)/2 = (3 × 4)/2 = 6",
                test_id: testId
            },
            {
                question_text: "Simplify: (3 + 5) × 2 - 4",
                option_a: "12",
                option_b: "16",
                option_c: "8",
                option_d: "20",
                correct_answer: "A",
                explanation: "(3 + 5) × 2 - 4 = 8 × 2 - 4 = 16 - 4 = 12",
                test_id: testId
            },
            {
                question_text: "What is 25% of 80?",
                option_a: "20",
                option_b: "25",
                option_c: "30",
                option_d: "40",
                correct_answer: "A",
                explanation: "25% of 80 = 0.25 × 80 = 20",
                test_id: testId
            },
            {
                question_text: "If x = 3 and y = 4, what is the value of x² + y²?",
                option_a: "7",
                option_b: "25",
                option_c: "49",
                option_d: "12",
                correct_answer: "B",
                explanation: "x² + y² = 3² + 4² = 9 + 16 = 25",
                test_id: testId
            }
        ];

        console.log('Inserting 10 questions for test ID:', testId);

        // Insert all questions
        const { data: questionResults, error: questionError } = await supabase
            .from('questions')
            .insert(questions)
            .select();

        if (questionError) {
            console.error('Error creating questions:', questionError);
            throw questionError;
        }

        console.log('Successfully created 10 questions:', questionResults);

        return { 
            success: true, 
            data: {
                testId: testId,
                testData: testResult[0],
                questions: questionResults
            }
        };

    } catch (error) {
        console.error('Error generating sample test:', error.message);
        return { success: false, error: error.message };
    }
}

// Add a UUID validation helper function before the saveTestResult function
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return typeof uuid === 'string' && uuidRegex.test(uuid);
} 