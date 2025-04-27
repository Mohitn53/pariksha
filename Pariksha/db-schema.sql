-- Create database schema for Pariksha application

-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table to store user profile info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profile reading (everyone can read)
CREATE POLICY "Profiles are viewable by everyone." 
  ON profiles FOR SELECT USING (true);

-- Create policy for profile update (only own profile)
CREATE POLICY "Users can update their own profile." 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create policy for profile insertion (only authenticated users can insert)
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create tests table to store test metadata
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  difficulty_level TEXT,
  time_limit INTEGER DEFAULT 60, -- Time limit in minutes
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on tests
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Create policy for reading tests (public or user's own tests)
CREATE POLICY "Tests are viewable by creator or if public"
  ON tests FOR SELECT USING (is_public OR auth.uid() = created_by);

-- Create policy for updating tests (only owner can update)
CREATE POLICY "Users can update own tests"
  ON tests FOR UPDATE USING (auth.uid() = created_by);

-- Create policy for inserting tests (authenticated users only)
CREATE POLICY "Users can insert tests"
  ON tests FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create policy for deleting tests (only owner can delete)
CREATE POLICY "Users can delete own tests"
  ON tests FOR DELETE USING (auth.uid() = created_by);

-- Create questions table to store test questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policy for reading questions (same policy as test visibility)
CREATE POLICY "Questions are viewable if the test is viewable"
  ON questions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = questions.test_id
      AND (tests.is_public OR tests.created_by = auth.uid())
    )
  );

-- Create policy for updating questions (only owner of the test can update)
CREATE POLICY "Users can update questions of own tests"
  ON questions FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = questions.test_id
      AND tests.created_by = auth.uid()
    )
  );

-- Create policy for inserting questions (authenticated users only, only to own tests)
CREATE POLICY "Users can insert questions to own tests"
  ON questions FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = questions.test_id
      AND tests.created_by = auth.uid()
    )
  );

-- Create test_results table to store user test results
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- Time taken in seconds
  answers_json JSONB, -- Store user answers as JSON
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on test_results
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Create policy for reading test results (only owner can see their results)
CREATE POLICY "Users can read own test results"
  ON test_results FOR SELECT USING (auth.uid() = user_id);

-- Create policy for inserting test results (authenticated users only, only own results)
CREATE POLICY "Users can insert own test results"
  ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create bookmarks table for saved questions
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

-- Enable RLS on bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policy for reading bookmarks (only owner can see their bookmarks)
CREATE POLICY "Users can read own bookmarks"
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

-- Create policy for inserting bookmarks (authenticated users only, only own bookmarks)
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for deleting bookmarks (only owner can delete their bookmarks)
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update timestamps
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_tests_timestamp
BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_questions_timestamp
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Create views for data access

-- Test statistics view
CREATE OR REPLACE VIEW test_statistics AS
SELECT 
  t.id AS test_id,
  t.title,
  t.subject,
  COUNT(tr.id) AS total_attempts,
  AVG(tr.score) AS average_score,
  AVG(tr.time_taken) AS average_time,
  MIN(tr.score) AS min_score,
  MAX(tr.score) AS max_score
FROM tests t
LEFT JOIN test_results tr ON t.id = tr.test_id
GROUP BY t.id, t.title, t.subject;

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id AS user_id,
  p.username,
  COUNT(tr.id) AS total_tests_taken,
  AVG(tr.score) AS average_score,
  SUM(tr.correct_answers) AS total_correct_answers,
  SUM(tr.incorrect_answers) AS total_incorrect_answers,
  SUM(tr.total_questions) AS total_questions_attempted
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN test_results tr ON u.id = tr.user_id
GROUP BY u.id, p.username; 