import express from 'express'
// import fetch from 'node-fetch'
// import cors from 'cors'
// import session from 'express-session'
import userRouter from './routes/users.js';

const app = express();
const PORT = 5500;

app.use(express.static("public"))
//allows access to info coming from forms
app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.set('view engine', 'ejs')
app.use(logger)

app.use('/users', userRouter)

function logger(req, res, next){
    console.log(req.originalUrl)
    next()
}

app.listen(PORT, () => {
    console.log(`Serverul ruleaza pe http://localhost:${PORT}`)
})