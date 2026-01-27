const mysql = require('mysql2');
const dbConfig = require('./db.config.js');

// יצירת החיבור לפי ההגדרות
const connection = mysql.createConnection({
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB,
    charset: 'utf8mb4' //לצורך שימוש בעברית בבסיס הנתונים
});

// ביצוע החיבור
connection.connect(err => {
    if (err) {
        console.log("err: ", err)
        return;
    }
    console.log("conect to DB");
})

module.exports = connection;
