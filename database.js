// Importing module
const mysql = require('mysql')
const express = require("express")
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const app = express()
const http = require('http');
var parseUrl = require('body-parser');



require("dotenv").config()
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

var db = mysql.createConnection({
    connectionLimit: 100,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    port: DB_PORT

})



let encodeUrl = parseUrl.urlencoded({ extended: false });

app.use(sessions({
    secret: "thisismysecrctekey",
    saveUninitialized:true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
    resave: false
}));

app.use(cookieParser());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/register.html');
})

app.post('/register', encodeUrl, (req, res) => {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var email = req.body.email;
    var userName = req.body.userName;
    var password = req.body.password;

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
                var sql = `INSERT INTO userlogin (firstname, lastname,emailadd, username, userpassword) VALUES ('${firstName}', '${lastName}','${email}', '${userName}', '${password}')`;
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


