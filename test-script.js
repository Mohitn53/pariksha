// test-script.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://gsiytynzyccckzbzuxtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXl0eW56eWNjY2t6Ynp1eHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDQzNzQsImV4cCI6MjA2MDgyMDM3NH0.Ew5f9QmEX3EzrxhIqvvJ8o7pS0TNnCS0yegIoY-T40g';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to check table structure
async function checkTableStructure() {
    try {
        // Using system tables to get column info for tests table
        const { data, error } = await supabase
            .rpc('get_table_columns', { table_name: 'tests' });

        if (error) {
            console.error('Error fetching table structure:', error);
            throw error;
        }

        console.log('Table structure:', data);
        return data;
    } catch (error) {
        console.error('Failed to get table structure:', error);
        
        // Try a simple query as an alternative
        try {
            console.log('Trying alternative method to check table...');
            const { data, error } = await supabase
                .from('tests')
                .select('*')
                .limit(1);
                
            if (error) {
                console.error('Error with alternative query:', error);
                throw error;
            }
            
            if (data && data.length > 0) {
                console.log('Column names detected:', Object.keys(data[0]));
                return Object.keys(data[0]);
            } else {
                console.log('No data found, but table exists');
                return [];
            }
        } catch (altError) {
            console.error('Alternative method failed:', altError);
            throw altError;
        }
    }
}

// Generate a sample test for a user
async function generateSampleTest(userId) {
    try {
        if (!userId) {
            throw new Error('User ID is required to create a test');
        }

        console.log('Generating sample test for user:', userId);
        
        // Check table structure first
        await checkTableStructure();

        // First create the test
        const testData = {
            title: "Basic Mathematics Test",
            description: "Test your basic mathematics knowledge with this 10 question quiz",
            subject: "mathematics",
            difficulty: "medium", // Try this field name instead
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
            
            // If the error is related to column names, try with different column names
            if (testError.message && testError.message.includes('column')) {
                console.log('Trying with alternate column names...');
                
                // Try with 'difficulty_level' instead of 'difficulty'
                testData.difficulty_level = testData.difficulty;
                delete testData.difficulty;
                
                const { data: retryResult, error: retryError } = await supabase
                    .from('tests')
                    .insert([testData])
                    .select();
                    
                if (retryError) {
                    console.error('Retry also failed:', retryError);
                    throw retryError;
                }
                
                if (!retryResult || retryResult.length === 0) {
                    throw new Error('Retry succeeded but no data returned');
                }
                
                console.log('Retry succeeded with data:', retryResult);
                testResult = retryResult;
            } else {
                throw testError;
            }
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
                correct_option: "C",
                explanation: "5 + 7 = 12",
                test_id: testId
            },
            {
                question_text: "What is 8 × 9?",
                option_a: "63",
                option_b: "72",
                option_c: "81",
                option_d: "64",
                correct_option: "B",
                explanation: "8 × 9 = 72",
                test_id: testId
            },
            {
                question_text: "Solve for x: 2x + 5 = 15",
                option_a: "x = 5",
                option_b: "x = 7.5",
                option_c: "x = 10",
                option_d: "x = 3",
                correct_option: "A",
                explanation: "2x + 5 = 15\n2x = 10\nx = 5",
                test_id: testId
            },
            {
                question_text: "What is the square root of 144?",
                option_a: "12",
                option_b: "14",
                option_c: "10",
                option_d: "16",
                correct_option: "A",
                explanation: "√144 = 12 because 12² = 144",
                test_id: testId
            },
            {
                question_text: "What is the area of a rectangle with length 8 and width 5?",
                option_a: "13",
                option_b: "26",
                option_c: "40",
                option_d: "64",
                correct_option: "C",
                explanation: "Area = length × width = 8 × 5 = 40",
                test_id: testId
            },
            {
                question_text: "What is the value of π (pi) to two decimal places?",
                option_a: "3.14",
                option_b: "3.16",
                option_c: "3.12",
                option_d: "3.18",
                correct_option: "A",
                explanation: "π ≈ 3.14159... which rounds to 3.14",
                test_id: testId
            },
            {
                question_text: "If a triangle has sides of lengths 3, 4, and 5, what is its area?",
                option_a: "6 square units",
                option_b: "8 square units",
                option_c: "10 square units",
                option_d: "12 square units",
                correct_option: "A",
                explanation: "This is a 3-4-5 right triangle. Area = (base × height)/2 = (3 × 4)/2 = 6",
                test_id: testId
            },
            {
                question_text: "Simplify: (3 + 5) × 2 - 4",
                option_a: "12",
                option_b: "16",
                option_c: "8",
                option_d: "20",
                correct_option: "A",
                explanation: "(3 + 5) × 2 - 4 = 8 × 2 - 4 = 16 - 4 = 12",
                test_id: testId
            },
            {
                question_text: "What is 25% of 80?",
                option_a: "20",
                option_b: "25",
                option_c: "30",
                option_d: "40",
                correct_option: "A",
                explanation: "25% of 80 = 0.25 × 80 = 20",
                test_id: testId
            },
            {
                question_text: "If x = 3 and y = 4, what is the value of x² + y²?",
                option_a: "7",
                option_b: "25",
                option_c: "49",
                option_d: "12",
                correct_option: "B",
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

// Run the test with a sample user ID
const testUser = '123e4567-e89b-12d3-a456-426614174000';
generateSampleTest(testUser)
    .then(result => {
        console.log('Generation result:', result.success ? 'Success' : 'Failed');
        if (!result.success) {
            console.error('Error:', result.error);
        } else {
            console.log('Test created with ID:', result.data.testId);
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    }); 