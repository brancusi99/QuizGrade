import express from 'express'
import db from '../database.js';

const router = express.Router()

router.get('/', (req, res) => {
    const sql = "SELECT * FROM users"
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message)
            return res.send("Database error")
        }
        res.render('users/index', { users: rows })
    })
})

router.get('/new', (req, res) => {
    res.render("users/register")
})

router.post('/', (req, res) => {
    const { name, email, password } = req.body

    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`

    db.run(sql, [name, email, password], function(err) {
        if (err) {
            console.error(err.message)
            return res.render('users/register') 
        }
        
        console.log(`User created with ID: ${this.lastID}`)
        
        res.render('users/Main_page', { 
            user: { name: name, email: email, id: this.lastID } 
        })
    })
})

router.get('/Main_page', (req, res) => {
    res.render("users/Main_page")
})

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
            console.log(`User ${row.name} logged in successfully.`)

            res.render('users/Main_page', { user: row })
        } else {
            console.log("Invalid credentials")
            res.redirect('/users/login')
        }
    })
})

router.get('/create_page', (req, res) => {
    res.render('users/create_page')
})

router.get('/professor', (req, res) => {
    res.render('users/professor')
})

router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM users WHERE id = ?"
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return console.error(err.message)
        
        if (row) {
            res.send(`User Profile: ${row.name} (${row.email})`)
        } else {
            res.send("User not found")
        }
    })
})

router.route('/:id')
    .get((req, res) => {
        const id = req.params.id;
        const sql = "SELECT * FROM users WHERE id = ?";
        
        db.get(sql, [id], (err, row) => {
            if (err) return console.error(err.message);
            
            if (row) {
                res.send(`User Details: Name: ${row.name}, Email: ${row.email}`);
            } else {
                res.status(404).send("User not found");
            }
        });
    })
    .put((req, res) => {
        const id = req.params.id;
        const { name, email } = req.body; 
        
        const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
        
        db.run(sql, [name, email, id], function(err) {
            if (err) return console.error(err.message);
            
            res.send(`User with id ${id} updated successfully.`);
        });
    })
    .delete((req, res) => {
        const id = req.params.id;
        const sql = "DELETE FROM users WHERE id = ?";
        
        db.run(sql, [id], function(err) {
            if (err) return console.error(err.message);
            
            res.send(`User with id ${id} deleted.`);
        });
    });


//const users = [{name: 'Kyle'}, {name: 'Sally'}]

//middleware
//executes function but doesent do anything else unless next is called
// router.param('id', (req, res, next, id) => {
//     //console.log(id)
//     req.user = users[id]
//     next()
// })

export default router 