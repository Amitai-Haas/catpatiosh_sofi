const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const port = 3000;
const connection = require('./db.js');
const fs = require('fs');
const SECRET_PASS = "1234";//הגדרת סיסמה לצפייה בפרטי משתמשים
//---------------------------אנחנו רוצים לאפשר רק למשתמשים להיכנס לעמודים ולעמוד האילוצים רק למי שנרשם כקת''ה
const session = require('express-session');// נשתמש בעוגיות כדי לאפשר כניסה רק למשתמשים שרשומים
app.use(session({
    secret: 'memberOnly',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
})) // העוגייה תהיה תקפה לשעה אחת}));

function checkIfConect(req, res, next) {//פונק שבודקת אם המשמש מחובר או לא
    if (req.session && req.session.isLoggedIn) {
        return next(); //אם מחובר, נמשיך הלאה
    } else {//אם לא מחובר נשלח לעמוד התחברות
        res.redirect(`<script>
                    alert("לא מחובר, נא להתחבר");
                    window.location.href = "/LogIn.html";
                </script>`);
    }
}

function checkIfkata(req, res, next) {
    // קודם בודקים אם מחובר
    if (!req.session || !req.session.isLoggedIn) {
        //אם לא מחובר משום מה נשלח להתחברות
        return res.redirect(`<script>
                    alert("לא מחובר, נא להתחבר");
                    window.location.href = "/LogIn.html";
                </script>`);
    }
    if (req.session.is_kata === 'yes') {
        return next(); //יש אישור
    } else {
        // מחובר אבל לא קת"ה
        res.status(403).send("<h1>מיועד לקת''ה בלבד</h1><a href='/home'>חזור</a>");
    }
}

//---------------------------------------------------------------------------------------------------------------
//לשימוש בשיטת גט
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Project')));


//-------------------------- Routes-------------------------
app.get('/', (req, res) => { //מי שנכנס מגיע להתחברות
    res.sendFile(path.join(__dirname, 'Project', 'LogIn.html'));
});
app.get('/LogIn', (req, res) => { //לאחר הרשמה נגיע להתחברות
    res.sendFile(path.join(__dirname, 'Project', 'LogIn.html'));
});
//--------------  לדף הבית לכל מי שמחובר---------------
app.get('/home', checkIfConect, (req, res) => {
    // בכל כניסה נשלוף את טבלת השיבוץ העדכנית ונשים אותה בדף הבית
    connection.query("SELECT * FROM schedule", (err, rows) => {
        if (err) {
            console.log("err while select schedule:", err);
            return res.send("err while select schedule: " + err);
        }
        // נקרא את קובץ ה-html
        fs.readFile(path.join(__dirname, 'Project', 'home.html'), 'utf8', (err, htmlData) => {
            if (err) {
                console.log(err);
                return res.send(err);
            }

            let modifiedHtml = htmlData;

            // לולאה על כל השורות בטבלה
            rows.forEach(row => {
                // בדיקת מזהה התא להחלפה
                const searchString = `<td>${row.id}</td>`;
                const currentName = row.student_name;
                let replacementString;
                if (currentName === "אין סטודנט פנוי") {// אם אין סטודנט פנוי נצבע באדום שישימו לב
                    replacementString = `<td style="background-color: #ffcccc; color: #b71c1c; font-weight: bold;">${currentName}</td>`;
                } else {
                    replacementString = `<td>${currentName}</td>`;
                }

                // ביצוע ההחלפה
                modifiedHtml = modifiedHtml.replace(searchString, replacementString);
            });

            // שליחת הדף המוכן
            res.send(modifiedHtml);
        });
    });
});

//-------------------------דף מעקבים----------------------------
//לדף מעקבים לכל מי שמחובר
//מכיוון שקהל היעד שלנו הוא 200 משתמשים גג ומספר השעות מתעדכן 
// בכל טעינה נשלוף מחדש את הנתונים ונכניס לטבל מעקבים
//בנוסף, הדף נועד לבדיקה ולא אמורים לבקר בו מספר פעמים במהלך כניסה ולכן הטעינה מחגש לא תפגע בחויית המשתמש
app.get('/FollowUp', checkIfConect, (req, res) => {
    const email = req.session.email;
    //לנוחות, נשלוף קודם את המשתמש המחובר
    connection.query("SELECT * FROM users WHERE email = ?", [email], (err, conectResult) => {
        if (err) return res.send("error in conected query ", err)
        //  כל השאר (מי שהמייל שלו הוא לא שלי
        connection.query("SELECT * FROM users WHERE email != ? ORDER BY degree ASC", [email], (err, othersResult) => {
            if (err) return res.send("error in otheres query ", err);
            //קריאת הקובץ
            const filePath = path.join(__dirname, 'Project', 'FollowUp.html');
            fs.readFile(filePath, 'utf8', (err, htmlData) => {
                if (err) return res.send("שגיאה בטעינת קובץ HTML");

                let tableRows = ``;//נבנה את התוכן של טבלת המעקבים
                const me = conectResult[0]; //משתמש ראשון
                tableRows += ` 
                        <tr id = "userrow">
                            <td>${me.full_name} </td>
                            <td>${me.degree}</td>
                            <td>${me.hours}</td>
                        </tr>
                    `;

                // לולאה על כל השאר
                othersResult.forEach(user => {
                    tableRows += `
                        <tr>
                            <td>${user.full_name}</td>
                            <td>${user.degree}</td>
                            <td>${user.hours}</td>
                        </tr>
                    `;
                });
                //נוסיף לקובץ 
                const finalHtml = htmlData.replace(`1231`, tableRows);

                res.send(finalHtml);
            });
        });
    });
});
//------------------------------------------------------------------------------------------------------------------------------

//רק מי שקת''ה יכול להיכנס ולהזין אילוצים
app.get('/katapage', checkIfkata, (req, res) => {
    res.sendFile(path.join(__dirname, `Project`, 'KataPage.html'));
});

// ---------ראוט מיוחד שמגיש את דף ההתחברות כשהוא כבר פתוח על הרשמה--------------------
app.get('/sign-up', (req, res) => {
    console.log("get in sign-up rout")
    // קוראים את הקובץ מהדיסק
    fs.readFile(path.join(__dirname, `Project`, 'LogIn.html'), 'utf8', (err, htmlData) => {
        if (err) {
            return res.status(500).send("שגיאה בטעינת הדף");
        }
        // הסקריפט שפותח את ההרשמה ומסתיר את ההתחברות
        const script = `
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    alert("משתמש לא נמצא - אנא הירשם"); // הודעה למשתמש
                    
                    const loginForm = document.getElementById('login-form');
                    const signupForm = document.getElementById('signup-form');
                    const loginBtn = document.getElementById('btn-show-login');
                    const signupBtn = document.getElementById('btn-show-signup');

                    if(signupForm && loginForm) {
                        signupForm.style.display = 'block';
                        loginForm.style.display = 'none';
                        if (signupBtn) signupBtn.style.backgroundColor = '#ccc';
                        if (loginBtn) loginBtn.style.backgroundColor = '#f0f0f0';
                    }
                });
            </script>
        `;
        res.send(htmlData.replace('</body>', script + '</body>'));
    });
});
//-----------------------------------דלת אחורית שמי שיודע את הסיסמה המוגדרת יכול לצפות בכל פרטי המשתמשים (כולל סיסמאות)

app.get('/show-all-users', (req, res) => {
    // שליפת הסיסמה מהכתובת 
    const inputPass = req.query.pas;
    // בדיקה האם הסיסמה שהוזנה שווה לסיסמה הסודית
    if (inputPass === SECRET_PASS) {
        // שליפת המשתמשים
        connection.query("SELECT * FROM users", (err, rows) => {
            if (err) {
                return res.send("Error: " + err);
            }
            //שלחיחת המשתמשים
            res.json(rows);
        });

    } else {
        // אם הסיסמה לא נכונה
        res.status(401).send("<h1>גישה נדחתה: סיסמה שגויה</h1>");
    }
});
//-----------------------------------------צפייה בכל האילוצים--------------------------------
app.get('/show-all-constraints', checkIfkata, (req, res) => {

    // שאילתה ששולפת את האילוצים ומסדרת אותם לפי סדר הימים בשבוע 
    //ואח"כ לפי שעה
    //בשביל המודולריות, נכתוב את השאילתה בנפרד
    const sql = `
        SELECT * FROM constraints 
        ORDER BY 
        FIELD(day_of_week, 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'), 
        start_time ASC
    `;

    connection.query(sql, (err, rows) => {
        if (err) {
            console.log("error fetching constraints:", err);
            return res.send("error fetching constraints:", err);
        }

        // בניית טבלה יפה וקריאה
        let htmlContent = `
            <h1 style="text-align:center;">רשימת כל האילוצים במערכת</h1>
            <div style="text-align:center; margin-bottom: 20px;">
                <a href="/KataPage" style="font-size:18px;">חזור לדף קת"ה</a>
            </div>
            <table border="1" style="width: 80%; margin: 0 auto; border-collapse: collapse; text-align: center;">
                <tr style="background-color: #4CAF50; color: white;">
                    <th>יום</th>
                    <th>שעת התחלה</th>
                    <th>שעת סיום</th>
                    <th>שם</th>
                    <th>מגמה</th>
                </tr>
        `;

        // תרגום ימים לעברית
        const dayMap = {
            'sun': 'ראשון', 'mon': 'שני', 'tue': 'שלישי', 'wed': 'רביעי',
            'thu': 'חמישי', 'fri': 'שישי', 'sat': 'שבת'
        };

        rows.forEach(row => {
            // צביעת אילוצים כלליים (של כל המגמה) בצבע שונה כדי שיבלטו
            let rowStyle = "";
            let displayName = row.full_name;

            if (!displayName) { // אם אין שם, זה אילוץ מגמתי
                rowStyle = "background-color: #fff3cd;"; // צהוב בהיר
                displayName = "<b>אילוץ לכל המגמה</b>";
            }
            //נזין את שאר הטבלה
            htmlContent += `
                <tr style="${rowStyle}">
                    <td>${dayMap[row.day_of_week] || row.day_of_week}</td>
                    <td>${row.start_time}</td>
                    <td>${row.end_time}</td>
                    <td>${displayName}</td>
                    <td>${row.degree}</td>
                </tr>
            `;
        });

        htmlContent += `</table>`;
        res.send(htmlContent);
    });
});
//-----------------------------------------התנתקות--------------------------------------
app.get('/logout', (req, res) => {

    //מחיקת העוגייה
    res.clearCookie('connect.sid');
    res.send(`
            <script>
                alert("ביי ביי! נתראה בפעם הבאה");
                window.location.href = "https://www.google.co.il";
            </script>
        `);
});

//------------------------שאילתות ------------------------------------------------

//הרשמה 
app.post('/signup', (req, res) => {

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const phone = req.body.phone;
    const is_kata = req.body.is_kata;
    const degree = req.body.degree;

    if (!email || !name || !password || !phone) {
        return res.status(400).send(`<h1>שגיאה: חסרים נתונים בטופס</h1><a herf =" logIn.html">לחץ כאן להרשמה מחדש</a>`);
    }
    connection.query('INSERT INTO users (email, full_name, password, phone, is_kata , degree) VALUES (?,?,?,?,?,?)', [email, name, password, phone, is_kata, degree], (err, results) => {
        if (err) {
            console.error("SQL Error: ", err);
            res.status(400).send("שגיאה: " + err);
        } else {
            console.log("משתמש נרשם בהצלחה!");
            console.log(results);
            res.sendFile(path.join(__dirname, 'Project', 'LogIn.html'));
        }
    });
});

//------------------------ התחברות (Login) -------------------------

app.post('/login', (req, res) => {
    const email = req.body.email;
    // מחפשים את המשתמש  לפי האימייל
    connection.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.log("SQL Error:", err.message);
            return res.status(500).send("שגיאת שרת: " + err.message);
        }
        //  בדיקה האם המשתמש קיים בכלל
        if (results.length === 0) {
            console.log("נסיון התחברות למשתמש לא קיים")
            return res.send(`<script> window.location.href = "/sign-up"; </script>`);
        }
        //בדיקת סיסמא
        const user = results[0]; //מגיע בתוך מערך לכן נקח רק את הראשון והיחיד
        const password = req.body.password;
        if (password == user.password) {
            // סיסמה נכונה
            console.log("התחברות מוצלחת לאימייל: " + email);
            //נשמור את הפרטים בעוגייה
            req.session.isLoggedIn = true;
            req.session.userId = user.id;
            req.session.is_kata = user.is_kata;
            req.session.email = user.email;
            //נשלח לראוט ולא יישירות לקובץ
            res.redirect('/Home');
        } else {
            // סיסמה לא נכונה
            console.log("סיסמה שגויה לאימייל: " + email);
            return res.send(`
                <script>
                    alert("סיסמה שגויה");
                    window.location.href = "/LogIn.html";
                </script>`
            );
        }
    });
});

//-----------------------------------------הזנת אילוצים----------------------------------------

app.post('/constraints', checkIfkata, (req, res) => {
    const degree = req.body.degree;
    const name = req.body.student_name;
    const day = req.body.day_of_week;
    const start_time = req.body.start_time;
    const end_time = req.body.end_time;

    //פונק פנימית שמזינה את האילוץ  
    const saveConstraint = () => {
        connection.query('INSERT INTO constraints (degree, full_name, day_of_week, start_time, end_time) VALUES (?,?,?,?,?)', [degree, name, day, start_time, end_time], (err, results) => {
            if (err) {
                console.error("Error: ", err);
                res.status(400).send("שגיאה: " + err);
            } else {
                console.log(results);
            }
        });
    }

    if (name) { //אם יש שם נבדוק שהשם מופיע מבין המשתמשים
        connection.query(`SELECT full_name FROM users WHERE full_name =?`, [name], (err, results) => {
            if ((results.length == 0) || err) { //שגיאה בשליפה או לא קיים שם כזה
                console.log("error in the student name: ", err)
                res.send(`
            <script>
                alert("שים לב, השם חייב להיות תואם לשמות בדף מעקבים");
                window.location.href = "/FollowUp";
            </script>
        `)
            } else {
                saveConstraint();
                res.sendFile(path.join(__dirname, `Project`, 'KataPage.html'));
            }
        })
    } else {
        saveConstraint();
        res.sendFile(path.join(__dirname, `Project`, 'KataPage.html'));
    }//הזנה במקרה של הזנה לכל המגמה (ללא שם)

});

//---------------------מחיקת אילוצים---------------------
app.post('/delete-constraints', checkIfkata, (req, res) => {

    connection.query("TRUNCATE TABLE constraints", (err, results) => {
        if (err) {
            console.error("Error: ", err);
            res.status(500).send("שגיאה במחיקת הנתונים: " + err.message);
        } else {
            console.log("constraints delited");

            res.send(`
                <script>
                    alert("האילוצים נמחקו בהצלחה!");
                    window.location.href = "/KataPage"; 
                </script>
            `);
        }
    });
});
//----------------------------------אלגוריתם השיבוץ----------------------


//בגלל שאלגוריתם השיבוץ משתמש בהרבה שאילתות
//  נבנה פונק עזר שבודקת אם יש שגיאה בשליפת הנתונים

function safeQuery(sql, params = []) {
    return new Promise((resolve) => {
        connection.query(sql, params, (err, result) => {
            if (err) {
                // מחזירים מערך: [השגיאה, null]
                resolve([err, null]);
            } else {
                // מחזירים מערך: [null, התוצאה]
                resolve([null, result]);
            }
        });
    });
}
app.post('/generate_schedule', checkIfkata, async (req, res) => {
    let err, result, students, constraints;

    //נמחק את השיבוץ של שבוע שעבר
    [err, result] = await safeQuery('TRUNCATE TABLE schedule');
    if (err) {
        console.error("err on delete the table", err);
        return res.status(500).send("err on delete the table", err);
    }

    // נשלוף את כל האילוצים השבועיים
    [err, constraints] = await safeQuery('SELECT * FROM constraints');
    if (err) {
        console.error("error in constraints query", err);
        return res.status(500).send("error in constraints query", err);
    }
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let scheduleInserts = [];
    // לולאת השיבוץ
    for (let day of days) { //לכל יום
        // משבע בבוקר עד שבע בערב
        for (let h = 7; h < 20; h++) {

            // נסדר את הסטודנטים לפי מי שמר הכי פחות מהטבלת משתמשים (טבלת צדק)
            [err, students] = await safeQuery('SELECT full_name, degree, hours FROM users ORDER BY hours ASC');
            if (err) {
                console.error(`שגיאה בשליפת סטודנטים ביום ${day} שעה ${h}:`, err);
                return res.status(500).send("שגיאה בשליפת סטודנטים");
            }

            //כעת נעבור על הסטודנטים עד שנמצא אחד שאין לו אילוץ בשעה הזאת
            let assignedStudent = null;
            // חיפוש הסטודנט המתאים
            for (let student of students) {
                // בדיקת אילוצים
                const hasConstraint = constraints.some(c => {
                    if (c.day_of_week !== day) return false; //אם אין אילוץ באותו יום נמשיך
                    const cStart = parseInt(c.start_time.split(':')[0]); //שעת התחלה סיום
                    let cEnd = parseInt(c.end_time.split(':')[0]); // 
                    const cEndMinutes = parseInt(c.end_time.split(':')[1]);

                    // אם יש דקות (למשל 11:10), זה אומר שהשעה 11 לא פנויה במלואה.
                    // לכן, נגדיר שהאילוץ נגמר רק ב-12 
                    if (cEndMinutes > 0) {
                        cEnd = cEnd + 1;
                    }

                    if (h >= cStart && h < cEnd) { //אם יש אילוץ באותה שעת שמירה
                        return (c.full_name === student.full_name) || //נבדוק אם זה עבור אותו סטודנט
                            (c.full_name === null && c.degree === student.degree); //אם אין שם סטודנט (אילוץ לכל המגמה) אז נבדוק אם הוא במגמה
                    }
                    return false; //אם הגענו לפה אז הסטודנט יכול לשמור באותה שעה
                });

                if (!hasConstraint) { //אם אין לא אילוץ באותה שעה
                    assignedStudent = student; //נשבצ את את הסטודנט
                    break;  //ונצא מהלולאת סטודנטים
                }
            }

            // אם מצאנו סטודנט
            if (assignedStudent) {
                // נוסיף לו שעה בטבלת צדק
                [err, result] = await safeQuery('UPDATE users SET hours = hours + 1 WHERE full_name = ?', [assignedStudent.full_name]);
                if (err) {
                    console.error("err in update student hours", err);
                    return res.status(500).send("err in update student hours", err);
                }

                //נכניס לרשימת שמירה
                scheduleInserts.push([day, `${h}:00`, assignedStudent.full_name]);

            } else { //אם אף אחד לא יכול באותה שמירה
                scheduleInserts.push([day, `${h}:00`, "אין סטודנט פנוי"]);
            }
        }
    }

    // עדכון בבסיס הנתונים
    if (scheduleInserts.length > 0) {
        const sql = "INSERT INTO schedule (day_of_week, start_time, student_name) VALUES ?";
        [err, result] = await safeQuery(sql, [scheduleInserts]);
        if (err) {
            console.error("error in save schedule: ", err);
            return res.status(500).send("error in save schedule: ", err);
        }
    }

    // אם הגענו לפה, הכל עבר בשלום
    console.log("scheduled successfully")
    res.send(`
                <script>
                    alert("השיבוץ השבועי עודכן!");
                    window.location.href = "/Home"; // שנה לשם הדף שלך
                </script>
            `);
});
//האזנה לפורט
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
