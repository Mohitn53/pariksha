-- Fix schema discrepancy in test_results table and user_statistics view

-- Check if the incorrect_answers column exists; if not, add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'test_results' 
                  AND column_name = 'incorrect_answers') THEN
        ALTER TABLE test_results ADD COLUMN incorrect_answers INTEGER;
        
        -- Update existing records to calculate incorrect_answers
        UPDATE test_results 
        SET incorrect_answers = 
            CASE 
                WHEN total_questions IS NOT NULL AND correct_answers IS NOT NULL 
                THEN total_questions - correct_answers 
                ELSE 0 
            END
        WHERE incorrect_answers IS NULL;
        
        -- Make the column NOT NULL after filling it
        ALTER TABLE test_results ALTER COLUMN incorrect_answers SET NOT NULL;
    END IF;
END$$;

-- Check if the total_questions column exists; if not, add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'test_results' 
                  AND column_name = 'total_questions') THEN
        ALTER TABLE test_results ADD COLUMN total_questions INTEGER;
        
        -- For existing records, assume total_questions = correct_answers + incorrect_answers
        UPDATE test_results 
        SET total_questions = COALESCE(correct_answers, 0) + COALESCE(incorrect_answers, 0) 
        WHERE total_questions IS NULL;
        
        -- Make the column NOT NULL after filling it
        ALTER TABLE test_results ALTER COLUMN total_questions SET NOT NULL;
    END IF;
END$$;

-- Check if the correct_answers column exists; if not, add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'test_results' 
                  AND column_name = 'correct_answers') THEN
        ALTER TABLE test_results ADD COLUMN correct_answers INTEGER;
        
        -- For existing records, try to calculate from score
        UPDATE test_results 
        SET correct_answers = ROUND(score * total_questions / 100) 
        WHERE correct_answers IS NULL AND total_questions IS NOT NULL;
        
        -- Make the column NOT NULL after filling it
        ALTER TABLE test_results ALTER COLUMN correct_answers SET NOT NULL;
    END IF;
END$$;

-- Recreate the user_statistics view to use correct columns
DROP VIEW IF EXISTS user_statistics;

CREATE VIEW user_statistics AS
SELECT 
  u.id AS user_id,
  p.username,
  COUNT(tr.id) AS total_tests_taken,
  AVG(tr.score) AS average_score,
  SUM(COALESCE(tr.correct_answers, 0)) AS total_correct_answers,
  SUM(COALESCE(tr.incorrect_answers, 0)) AS total_incorrect_answers,
  SUM(COALESCE(tr.total_questions, 0)) AS total_questions_attempted
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN test_results tr ON u.id = tr.user_id
GROUP BY u.id, p.username; 