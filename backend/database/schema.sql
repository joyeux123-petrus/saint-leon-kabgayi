CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  className VARCHAR(255),
  parish VARCHAR(255),
  phone VARCHAR(255),
  teacherClass VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  class_name VARCHAR(255),
  teacher_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INT, -- in minutes
  start_time DATETIME,
  end_time DATETIME,
  quiz_type ENUM('standard', 'video', 'scenario', 'reflective', 'gamified') DEFAULT 'standard',
  randomize_questions BOOLEAN DEFAULT FALSE,
  is_team_based BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  class_name VARCHAR(255),
  note_id INT,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('MCQ_single_answer', 'MCQ_multiple_answers', 'True/False', 'Fill-in-the-Blank', 'Short_Answer', 'Matching', 'Pairing', 'Open-ended', 'Peer-Graded', 'Video') NOT NULL,
  media_url VARCHAR(255),
  video_timestamp INT, -- in seconds
  correct_answer TEXT,
  time_limit INT, -- Added this line
  points INT DEFAULT 0, -- Added this line
  `order` INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

ALTER TABLE questions
ADD COLUMN parent_question_id INT NULL,
ADD CONSTRAINT fk_parent_question
FOREIGN KEY (parent_question_id) REFERENCES questions(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_options_matching (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    prompt TEXT NOT NULL,
    correct_match TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    scenario_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

ALTER TABLE questions ADD COLUMN scenario_id INT;
ALTER TABLE questions ADD FOREIGN KEY (scenario_id) REFERENCES quiz_scenarios(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS quiz_teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT INT NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  student_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES quiz_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  score DECIMAL(5, 2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS student_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_option_id INT,
  answer_text TEXT,
  is_correct BOOLEAN,
  score DECIMAL(5, 2),
  teacher_feedback TEXT,
  ai_feedback TEXT,
  answer_media_url VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES options(id)
);

CREATE TABLE IF NOT EXISTS peer_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_answer_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    review_comment TEXT,
    score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_answer_id) REFERENCES student_answers(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  rank INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE (quiz_id, student_id)
);

CREATE TABLE IF NOT EXISTS quiz_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_id INT,
  metric_type VARCHAR(50) NOT NULL,
  metric_value TEXT NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS engagement_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  engagement_level DECIMAL(3, 2),
  frustration_level DECIMAL(3, 2),
  confusion_level DECIMAL(3, 2),
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT,
    estimated_duration INT,
    visibility ENUM('private', 'public', 'class') DEFAULT 'private',
    class_name VARCHAR(255),
    status ENUM('draft', 'published') DEFAULT 'draft',
    publish_at DATETIME,
    expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS note_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    estimated_time INT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS section_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES note_sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_check_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('MCQ', 'True/False', 'ShortAnswer', 'Fill-in-the-Blank', 'Matching', 'Pairing', 'Open-ended', 'Peer-Graded', 'Video') NOT NULL,
    correct_answer TEXT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES note_sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_check_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    term VARCHAR(255),
    definition TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES knowledge_check_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_check_matching_pairs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    prompt TEXT NOT NULL,
    correct_match TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES knowledge_check_questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_note_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    note_id INT NOT NULL,
    last_completed_section_id INT,
    points_earned INT DEFAULT 0,
    status ENUM('not-started', 'in-progress', 'completed') DEFAULT 'not-started',
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (last_completed_section_id) REFERENCES note_sections(id) ON DELETE SET NULL,
    UNIQUE KEY (student_id, note_id)
);

CREATE TABLE IF NOT EXISTS student_knowledge_check_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    progress_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT,
    answer_text TEXT,
    is_correct BOOLEAN,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progress_id) REFERENCES student_note_progress(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES knowledge_check_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES knowledge_check_options(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_tutor_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response JSON NOT NULL,
  response_type VARCHAR(50) DEFAULT 'conversation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_tutor_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_topic VARCHAR(255) NOT NULL,
  status ENUM('viewed', 'completed', 'in-progress') DEFAULT 'viewed',
  lesson_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_lesson (student_id, lesson_topic)
);

CREATE TABLE IF NOT EXISTS ai_tutor_quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_topic VARCHAR(255) NOT NULL,
  answers JSON,
  score DECIMAL(5, 2) DEFAULT 0.00,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    video_source ENUM('youtube', 'vimeo', 'mp4') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_puzzles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT INT NOT NULL,
    puzzle_type ENUM('crossword', 'riddle', 'other') NOT NULL,
    puzzle_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL,
    `order` INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_queries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_tutor_student ON ai_tutor_interactions(student_id);
CREATE INDEX idx_ai_tutor_created ON ai_tutor_interactions(created_at);
CREATE INDEX idx_ai_progress_student ON ai_tutor_progress(student_id);
CREATE INDEX idx_ai_progress_topic ON ai_tutor_progress(lesson_topic);
CREATE INDEX idx_ai_quizzes_student ON ai_tutor_quizzes(student_id);
CREATE INDEX idx_ai_quizzes_topic ON ai_tutor_quizzes(lesson_topic);
CREATE INDEX idx_ai_queries_user ON ai_queries(user_id);
CREATE INDEX idx_ai_queries_created ON ai_queries(created_at);

CREATE TABLE IF NOT EXISTS daily_spirituals (
  date DATE PRIMARY KEY,
  gospel_title VARCHAR(255),
  gospel_text TEXT,
  saint_name VARCHAR(255),
  saint_feast VARCHAR(255),
  liturgical_season VARCHAR(255),
  sunday_cycle VARCHAR(255),
  weekday_cycle VARCHAR(255),
  rosary_series VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
