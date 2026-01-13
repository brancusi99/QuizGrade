import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                password TEXT,
                role TEXT NOT NULL
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS quizzes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT,
                use_ai_grading INTEGER DEFAULT 0, -- 0 = Manual, 1 = AI
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);
        
            db.run(`ALTER TABLE quizzes ADD COLUMN use_ai_grading INTEGER DEFAULT 0`, (err) => {});

            db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quiz_id INTEGER,
                text TEXT,
                type TEXT,
                options TEXT, 
                correct_answer TEXT,
                FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS student_quiz_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                quiz_id INTEGER,
                score REAL,
                status TEXT DEFAULT 'graded', -- 'graded' or 'pending_grading'
                taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
            )`);
        
            db.run(`ALTER TABLE student_quiz_results ADD COLUMN status TEXT DEFAULT 'graded'`, (err) => {

            });
    
            db.run(`CREATE TABLE IF NOT EXISTS student_answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                result_id INTEGER,
                question_id INTEGER,
                answer_text TEXT,
                is_correct INTEGER DEFAULT 0, -- 0 or 1
                FOREIGN KEY(result_id) REFERENCES student_quiz_results(id),
                FOREIGN KEY(question_id) REFERENCES questions(id)
            )`);
        });
    }
});

export default db;