import sqlite3 from 'sqlite3';

// Connect to a file named 'db.sqlite'
// If the file does not exist, it will be created automatically.
const db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create the 'users' table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            password TEXT  
        )`, (err) => {
            if (err) {
                // Table already created
            }
        });
    }
});

export default db