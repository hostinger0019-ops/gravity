-- Education Platform Database Schema
-- Run this with: supabase db push or in Supabase Dashboard SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Teachers & Students)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_course ON topics(course_id);

-- Student Progress table
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'in_progress', 'mastered', 'struggling')
  ),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_topic ON student_progress(topic_id);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);

-- Quiz Attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- Student Sessions table (for engagement tracking)
CREATE TABLE IF NOT EXISTS student_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  pages_visited INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_student ON student_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON student_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON student_sessions(started_at);

-- Student Questions table (AI Chat History)
CREATE TABLE IF NOT EXISTS student_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id),
  question TEXT NOT NULL,
  ai_response TEXT,
  was_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_student ON student_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_course ON student_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON student_questions(topic_id);

-- Analytics Daily table (pre-aggregated for performance)
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_active_students INTEGER DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0,
  total_quiz_attempts INTEGER DEFAULT 0,
  average_quiz_score DECIMAL(5,2),
  total_questions_asked INTEGER DEFAULT 0,
  UNIQUE(course_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_course ON analytics_daily(course_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_daily(date);

-- Create a view for teacher dashboard analytics
CREATE OR REPLACE VIEW teacher_dashboard_stats AS
SELECT 
  c.id AS course_id,
  c.teacher_id,
  COUNT(DISTINCT e.student_id) AS total_students,
  ROUND(AVG(sp.progress_percentage), 2) AS avg_progress,
  ROUND(AVG(qa.score), 2) AS avg_quiz_score,
  SUM(sp.time_spent_minutes) AS total_time_spent,
  COUNT(DISTINCT 
    CASE WHEN ss.started_at >= CURRENT_DATE - INTERVAL '7 days' 
    THEN e.student_id END
  ) AS active_this_week
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
LEFT JOIN student_progress sp ON e.student_id = sp.student_id AND c.id = sp.course_id
LEFT JOIN quiz_attempts qa ON e.student_id = qa.student_id
LEFT JOIN student_sessions ss ON e.student_id = ss.student_id AND c.id = ss.course_id
GROUP BY c.id, c.teacher_id;

-- Create a view for topic-specific insights
CREATE OR REPLACE VIEW topic_insights AS
SELECT 
  t.id AS topic_id,
  t.course_id,
  t.title AS topic_name,
  COUNT(DISTINCT sp.student_id) AS total_students,
  COUNT(DISTINCT CASE WHEN sp.status = 'mastered' THEN sp.student_id END) AS mastered_count,
  COUNT(DISTINCT CASE WHEN sp.status = 'struggling' THEN sp.student_id END) AS struggling_count,
  COUNT(DISTINCT CASE WHEN sp.status = 'in_progress' THEN sp.student_id END) AS in_progress_count,
  ROUND(AVG(CASE WHEN sp.status = 'mastered' THEN sp.time_spent_minutes END), 2) AS avg_time_to_master,
  ROUND(AVG(sp.progress_percentage), 2) AS avg_progress,
  COUNT(sq.id) AS total_questions_asked
FROM topics t
LEFT JOIN student_progress sp ON t.id = sp.topic_id
LEFT JOIN student_questions sq ON t.id = sq.topic_id
GROUP BY t.id, t.course_id, t.title;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
-- Sample teacher
INSERT INTO users (email, password_hash, role, full_name) VALUES
('teacher@example.com', '$2a$10$example_hash', 'teacher', 'Dr. Jane Smith')
ON CONFLICT (email) DO NOTHING;

-- Sample course
INSERT INTO courses (teacher_id, title, description, category) 
SELECT id, 'Advanced Mathematics', 'Comprehensive math course covering algebra, calculus, and more', 'Mathematics'
FROM users WHERE email = 'teacher@example.com'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE users IS 'Stores both teachers and students with role-based access';
COMMENT ON TABLE courses IS 'Course catalog managed by teachers';
COMMENT ON TABLE student_progress IS 'Tracks individual student progress per topic';
COMMENT ON TABLE analytics_daily IS 'Pre-aggregated daily analytics for performance';
COMMENT ON VIEW teacher_dashboard_stats IS 'Real-time statistics for teacher dashboard';
COMMENT ON VIEW topic_insights IS 'Topic-level analytics showing mastery and struggle patterns';
