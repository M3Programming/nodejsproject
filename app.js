const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql')
const sessions = require('express-session');
const http = require('http');
const parseUrl = require('body-parser');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const { constants } = require('fs/promises');
const app = express();

require("dotenv").config()
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

let db = mysql.createConnection({
  connectionLimit: 100,
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT

})

let encodeUrl = parseUrl.urlencoded({ extended: false });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use(sessions({
  secret: "thisismysecrctekey",
  saveUninitialized:true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
  resave: false
}));

app.post('/register', encodeUrl, (req, res) => {
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let email = req.body.email;
  let userName = req.body.userName;
  let password = req.body.password;

  db.connect(function (err) {
    if (err) {
        console.log(err);
    };
    // checking user already registered or no
    db.query(`SELECT * FROM userlogin WHERE username = '${userName}' AND userpassword  = '${password}'`, function (err, result) {
        if (err) {
            console.log(err);
        };
        if (Object.keys(result).length > 0) {
            res.sendFile(__dirname + '/failreg.html');
        } else {
            //creating user page in userPage function
            function userPage() {
                // We create a session for the dashboard (user page) page and save the user data to this session:
                req.session.user = {
                    firstname: firstName,
                    lastname: lastName,
                    emailadd: email,
                    username: userName,
                    userpassword: password
                };

                res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Login and register form with Node.js, Express.js and MySQL</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container">
                    <h3>Hi, ${req.session.user.firstname} ${req.session.user.lastname}</h3>
                    <a href="/">Log out</a>
                </div>
            </body>
            </html>
            `);
            }
            // inserting new user data
            let sql = `INSERT INTO userlogin (firstname, lastname,emailadd, username, userpassword) VALUES ('${firstName}', '${lastName}','${email}', '${userName}', '${password}')`;
            db.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    // using userPage function for creating user page
                    userPage();
                };
            });

        }

    });
});
});
const port = process.env.PORT
app.listen(port, () => console.log(`Server Started on port ${port}...`))
module.exports = app;
