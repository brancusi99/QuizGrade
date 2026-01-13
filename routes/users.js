import express from 'express'
import OpenAI from 'openai';
import db from '../database.js';
const router = express.Router()

const openai = new OpenAI({
    apiKey: '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', 
});

async function gradeWithAI(questionText, studentAnswer, correctAnswer) {
    console.log(`--- [AI Start] Grading Question ---`);
    console.log(`Q: ${questionText}`);
    console.log(`Student Answer: "${studentAnswer}"`);

    try {
        const prompt = `
            Ești un profesor corect. Evaluează răspunsul studentului comparându-l cu cel corect.
            
            Întrebare: "${questionText}"
            Răspuns Corect (Referință): "${correctAnswer}"
            Răspuns Student: "${studentAnswer}"
            
            Reguli de notare:
            1. Dacă sensul este identic sau foarte apropiat de răspunsul corect, dă 100.
            2. Dacă este parțial corect, dă o notă între 1 și 99.
            3. Dacă este greșit sau irelevant, dă 0.
            
            IMPORTANT: Răspunde DOAR cu numărul (nota). Nu scrie cuvinte precum "Nota este" sau "Punctaj". Doar cifra.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", 
            messages: [{ role: "user", content: prompt }],
            temperature: 0, 
        });

        const rawContent = response.choices[0].message.content.trim();
        console.log(`[AI Raw Response]: "${rawContent}"`);

        const match = rawContent.match(/\d+(\.\d+)?/);
        let grade = 0;

        if (match) {
            grade = parseFloat(match[0]);
        } else {
            console.log("Nu am putut găsi un număr în răspunsul AI.");
        }

        if (grade > 100) grade = 100;
        if (grade < 0) grade = 0;

        console.log(`[AI Final Grade]: ${grade}`);
        return grade;

    } catch (error) {
        console.error("!!! [AI Error] !!!", error.message);
        if (error.code === 'insufficient_quota') {
            console.error("Eroare: Nu mai ai credit pe contul OpenAI sau cheia nu e validă.");
        }
        return 0; 
    }
}

const isProfessor = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'professor') {
        return next();
    }
    res.redirect('/users/login');
};

//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

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/users/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/users/login');
    });
});




router.get('/register', (req, res) => {
    res.render("users/register")
})


router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body
    const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`

    db.run(sql, [name, email, password, role], function(err) {
        if (err) {
            console.error(err.message)
            return res.render('users/register', { error: "Eroare la creare cont" }) 
        }
        console.log(`User nou creat cu ID: ${this.lastID}`)
        
        req.session.user = {
            id: this.lastID,
            name: name,
            email: email,
            role: role
        };
        
        res.redirect(`/users/dashboard`)
    })
})

router.get('/professor', isProfessor, (req, res) => {
    res.render('users/professor');
})

router.get('/create_page', isProfessor, (req, res) => {
    res.render('users/create_page');
})

router.post('/create_quiz', isProfessor, (req, res) => {
    const userId = req.session.user.id; 
    
    const { title, questions, use_ai } = req.body;

    if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ error: "Titlu sau întrebări lipsă" });
    }

    const useAiInt = use_ai ? 1 : 0;

    const sqlQuiz = "INSERT INTO quizzes (user_id, title, use_ai_grading) VALUES (?, ?, ?)";
    
    db.run(sqlQuiz, [userId, title, useAiInt], function(err) {
        if (err) {
            console.error("Eroare la crearea quiz-ului:", err.message);
            return res.status(500).json({ error: "Eroare la salvarea în baza de date." });
        }

        const quizId = this.lastID;
        let hasError = false;

        const sqlQuestion = `INSERT INTO questions (quiz_id, text, type, options, correct_answer) VALUES (?, ?, ?, ?, ?)`;

        questions.forEach((q) => {

            const optionsString = JSON.stringify(q.options || []);

            db.run(sqlQuestion, [quizId, q.text, q.type, optionsString, q.correct_answer], (err) => {
                if (err) {
                    console.error("Eroare la salvarea intrebarii:", err);
                    hasError = true;
                }
                completed++;
                
                if (completed === questions.length) {
                    if (hasError) {
                        return res.status(500).json({ error: "A apărut o eroare la salvarea întrebărilor." });
                    }
                    
                    console.log(`Quiz '${title}' creat cu succes. AI Grading: ${useAiInt === 1 ? 'Activat' : 'Dezactivat'}.`);
                    
                    res.json({ success: true, quizId: quizId });
                }
            });
        });
    });
});

router.get('/login', (req, res) => {
    res.render('users/login')
})

router.post('/login', (req, res) => {
    const { email, password } = req.body
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?"
    
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            console.error(err.message)
            return res.redirect('/users/login')
        }
        if (row) {
            console.log(`User ${row.name} s-a logat.`)
            
            req.session.user = row;
            
            res.redirect(`/users/dashboard`)
        } else {
            console.log("Date incorecte")
            res.redirect('/users/login')
        }
    })
})

router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/users/login');
    }

    const user = req.session.user;
    let sql = "SELECT q.id, q.title, q.created_at, u.name as professor_name FROM quizzes q JOIN users u ON q.user_id = u.id";
    const params = [];

    if (user.role === 'professor') {
        sql += " WHERE q.user_id = ?";
        params.push(user.id);
    }

    sql += " ORDER BY q.created_at DESC";

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.render("users/Main_page", { user: user, quizzes: [], error: "Error fetching quizzes." });
        }
        
        let viewData = {
            user: user,
            quizzes: rows,
            pageTitle: "Dashboard",
            pageHeader: "Available Quizzes"
        };

        if (user.role === 'professor') {
            viewData.pageHeader = "My Quizzes";
        }
        
        res.render("users/Main_page", viewData);
    });
});
router.get('/quiz/:id', (req, res) => {
    const quizId = req.params.id;
    const sqlQuiz = "SELECT * FROM quizzes WHERE id = ?";
    const sqlQuestions = "SELECT id, text, options, type FROM questions WHERE quiz_id = ?";

    db.get(sqlQuiz, [quizId], (err, quiz) => {
        if (err || !quiz) {
            return res.status(404).send("Quiz not found.");
        }

        db.all(sqlQuestions, [quizId], (err, questions) => {
            if (err) {
                return res.status(500).send("Error fetching questions.");
            }

            const parsedQuestions = questions.map(q => ({
                ...q,
                options: JSON.parse(q.options) 
            }));

            res.render('users/take_quiz', { quiz, questions: parsedQuestions, user: req.session.user });
        });
    });
});


router.post('/quiz/:id', async (req, res) => {
    const quizId = req.params.id;
    const userAnswers = req.body;
    const userId = req.session.user.id;

    console.log(`\n=== START SUBMIT QUIZ (ID: ${quizId}) ===`);
    console.log("User Answers received:", userAnswers);

    const sqlQuizInfo = "SELECT use_ai_grading FROM quizzes WHERE id = ?";
    
    db.get(sqlQuizInfo, [quizId], (err, quizInfo) => {
        if(err) {
            console.error("DB Error la Quiz Info:", err);
            return res.status(500).send("DB Error");
        }
        
        console.log("Info Quiz din DB:", quizInfo);

        const useAI = (quizInfo && quizInfo.use_ai_grading === 1);
        console.log(`--> Este AI Grading activat? ${useAI ? "DA" : "NU"}`);

        const sqlQuestions = "SELECT id, text, type, correct_answer FROM questions WHERE quiz_id = ?";
        db.all(sqlQuestions, [quizId], async (err, questions) => {
            if (err) return res.status(500).send("Error fetching questions.");

            let totalScorePoints = 0;
            let needsManualGrading = false;

            console.log(`Am gasit ${questions.length} intrebari.`);

            for (const q of questions) {
                const answerKey = `question_${q.id}`;
                const studentAnswer = userAnswers[answerKey] || "";
                let pointsForQuestion = 0;

                console.log(`\nProcesez intrebarea ID ${q.id} (Tip: ${q.type})`);

                if (q.type === 'fill_in_the_blank' || q.type === 'fill-blank' || q.type === 'text') {
                    
                    if (useAI) {
                        console.log("--> Conditie indeplinita: Tip TEXT + AI Activat. Apelez functia...");
                        if (studentAnswer.trim().length > 0) {
                            pointsForQuestion = await gradeWithAI(q.text, studentAnswer, q.correct_answer);
                        } else {
                            console.log("--> Studentul nu a scris nimic (0 puncte).");
                        }
                    } else {
                        console.log("--> AI este OPRIT. Marchez pentru corectare manuala.");
                        needsManualGrading = true;
                    }

                } else if (q.type === 'multiple_choice' || q.type === 'multiple-choice') {
                    console.log("--> Intrebare Grila. Verificare clasica.");
                    if (studentAnswer.toLowerCase() === q.correct_answer.toLowerCase()) {
                        pointsForQuestion = 100;
                    }
                } else {
                    console.log(`--> [ATENTIE] Tip intrebare necunoscut: '${q.type}'`);
                }
                
                totalScorePoints += pointsForQuestion;
            }

            const finalScore = totalScorePoints / questions.length;
            const status = needsManualGrading ? 'pending_grading' : 'graded';
            
            console.log(`\n=== FINAL SCORE: ${finalScore} | STATUS: ${status} ===`);

            const sqlInsertResult = `INSERT INTO student_quiz_results (user_id, quiz_id, score, status) VALUES (?, ?, ?, ?)`;
            db.run(sqlInsertResult, [userId, quizId, finalScore, status], function(err) {
                if(err) console.error("Eroare la salvare rezultat:", err);
                const resultId = this.lastID;

                const sqlInsertAnswer = `INSERT INTO student_answers (result_id, question_id, answer_text) VALUES (?, ?, ?)`;
                questions.forEach(q => {
                    db.run(sqlInsertAnswer, [resultId, q.id, userAnswers[`question_${q.id}`] || ""]);
                });

                req.session.lastQuizResult = {
                    score: needsManualGrading ? "Pending" : finalScore.toFixed(2),
                    status: status
                };
                res.redirect(`/users/quiz/${quizId}/results`);
            });
        });
    });
});

router.get('/grading', isProfessor, (req, res) => {
    const sql = `
        SELECT r.id as result_id, r.taken_at, u.name as student_name, q.title as quiz_title
        FROM student_quiz_results r
        JOIN users u ON r.user_id = u.id
        JOIN quizzes q ON r.quiz_id = q.id
        WHERE r.status = 'pending_grading' AND q.user_id = ?
        ORDER BY r.taken_at ASC
    `;
    
    db.all(sql, [req.session.user.id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database Error");
        }
        res.render('users/grading_list', { submissions: rows, user: req.session.user });
    });
});

router.get('/grading/:id', isProfessor, (req, res) => {
    const resultId = req.params.id;

    const sqlResult = `
        SELECT r.id, r.score, r.quiz_id, u.name as student_name, q.title
        FROM student_quiz_results r
        JOIN users u ON r.user_id = u.id
        JOIN quizzes q ON r.quiz_id = q.id
        WHERE r.id = ?
    `;

    const sqlAnswers = `
        SELECT sa.id as answer_id, sa.answer_text, q.text as question_text, q.correct_answer, q.type, q.options
        FROM student_answers sa
        JOIN questions q ON sa.question_id = q.id
        WHERE sa.result_id = ?
    `;

    db.get(sqlResult, [resultId], (err, result) => {
        if(err || !result) return res.status(404).send("Submission not found");

        db.all(sqlAnswers, [resultId], (err, answers) => {
            if(err) return res.status(500).send("Error fetching answers");

            res.render('users/grading_interface', { 
                submission: result, 
                answers: answers, 
                user: req.session.user 
            });
        });
    });
});

router.post('/grading/:id', isProfessor, (req, res) => {
    const resultId = req.params.id;
    const { final_score } = req.body; 

    const sql = `UPDATE student_quiz_results SET score = ?, status = 'graded' WHERE id = ?`;

    db.run(sql, [final_score, resultId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Error updating grade");
        }
        res.redirect('/users/grading');
    });
});


router.get('/my-results', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'student') {
        return res.redirect('/users/login');
    }

    const userId = req.session.user.id;
    const sql = `
        SELECT 
            q.title, 
            r.score, 
            r.taken_at
        FROM student_quiz_results r
        JOIN quizzes q ON r.quiz_id = q.id
        WHERE r.user_id = ?
        ORDER BY r.taken_at DESC
    `;

    db.all(sql, [userId], (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Could not fetch results.");
        }

        let overallGrade = 0;
        if (results.length > 0) {
            const totalScore = results.reduce((acc, row) => acc + row.score, 0);
            overallGrade = totalScore / results.length;
        }

        res.render('users/my_results', { 
            user: req.session.user, 
            results: results,
            overallGrade: overallGrade.toFixed(2)
        });
    });
});

router.get('/quiz/:id/all_results', isProfessor, (req, res) => {
    const quizId = req.params.id;

    db.get("SELECT title FROM quizzes WHERE id = ?", [quizId], (err, quiz) => {
        if (err || !quiz) return res.status(404).send("Quiz not found");

        const sqlResults = `
            SELECT r.score, r.taken_at, r.status, u.name as student_name, u.email
            FROM student_quiz_results r
            JOIN users u ON r.user_id = u.id
            WHERE r.quiz_id = ?
            ORDER BY r.taken_at DESC
        `;

        db.all(sqlResults, [quizId], (err, rows) => {
            if (err) return res.status(500).send("Database error");

            res.render('users/quiz_grades', { 
                quizTitle: quiz.title, 
                grades: rows, 
                user: req.session.user 
            });
        });
    });
});

router.get('/quiz/:id/results', (req, res) => {
    if (!req.session.lastQuizResult) {
        return res.redirect('/users/dashboard');
    }

    const result = req.session.lastQuizResult;
    delete req.session.lastQuizResult; 

    res.render('users/quiz_results', { result, user: req.session.user });
});

router.get('/quiz/:id/edit', isProfessor, (req, res) => {
    const quizId = req.params.id;
    const sqlQuiz = "SELECT * FROM quizzes WHERE id = ? AND user_id = ?";
    
    db.get(sqlQuiz, [quizId, req.session.user.id], (err, quiz) => {
        if (err || !quiz) {
            return res.status(404).send("Quiz not found or you don't have permission to edit it.");
        }

        const sqlQuestions = "SELECT id, text, options, type, correct_answer FROM questions WHERE quiz_id = ?";
        db.all(sqlQuestions, [quizId], (err, questions) => {
            if (err) {
                return res.status(500).send("Error fetching questions.");
            }

            const parsedQuestions = questions.map(q => ({
                ...q,
                options: JSON.parse(q.options || '[]')
            }));

            res.render('users/edit_quiz', { quiz, questions: parsedQuestions, user: req.session.user });
        });
    });
});

router.post('/quiz/:id/edit', isProfessor, (req, res) => {
    const quizId = req.params.id;
    const { title, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ error: "Title or questions missing." });
    }

    const sqlUpdateTitle = "UPDATE quizzes SET title = ? WHERE id = ? AND user_id = ?";
    db.run(sqlUpdateTitle, [title, quizId, req.session.user.id], function(err) {
        if (err) {
            return res.status(500).json({ error: "Error updating quiz title." });
        }
        if (this.changes === 0) {
            return res.status(403).json({ error: "You do not have permission to edit this quiz." });
        }

        const sqlDeleteQuestions = "DELETE FROM questions WHERE quiz_id = ?";
        db.run(sqlDeleteQuestions, [quizId], (err) => {
            if (err) {
                return res.status(500).json({ error: "Error clearing old questions." });
            }

            const sqlInsertQuestion = `INSERT INTO questions (quiz_id, text, type, options, correct_answer) VALUES (?, ?, ?, ?, ?)`;
            let completed = 0;
            let hasError = false;

            questions.forEach(q => {
                const optionsString = JSON.stringify(q.options || []);
                db.run(sqlInsertQuestion, [quizId, q.text, q.type, optionsString, q.correct_answer], (err) => {
                    if (err && !hasError) {
                        hasError = true;
                        console.error(err);
                    }
                    completed++;
                    if (completed === questions.length) {
                        if (hasError) {
                            return res.status(500).json({ error: "Error saving new questions." });
                        }
                        res.json({ success: true, quizId: quizId });
                    }
                });
            });
        });
    });
});

router.get('/', (req, res) => {
    const sql = "SELECT * FROM users"
    db.all(sql, [], (err, rows) => {
        if (err) return res.send("Eroare baza de date")
        res.render('users/index', { users: rows })
    })
})

router.route('/:id')
    .get((req, res) => {
        const id = req.params.id;
        db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
            if (err) return console.error(err.message);
            if (row) {
                res.render('users/profile', { user: row }); 
            } else {
                res.status(404).send("User not found");
            }
        });
    })
    .put((req, res) => {
        const { name, email } = req.body; 
        const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
        db.run(sql, [name, email, req.params.id], function(err) {
            if (err) return console.error(err.message);
            res.send(`User actualizat.`);
        });
    })
    .delete((req, res) => {
        const sql = "DELETE FROM users WHERE id = ?";
        db.run(sql, [req.params.id], function(err) {
            if (err) return console.error(err.message);
            res.send(`User sters.`);
        });
    });


export default router