window.onload = function() {
   
    // ==========================================
  //דף התחברות
  // תפיסת האלמנטים
    const loginBtn = document.getElementById('btn-show-login');
    const signupBtn = document.getElementById('btn-show-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

// האם האלמנטים נמצאים בעמוד הזה (כדי שלא יתפוס אלמנטים שלא קיימים)
    if (loginBtn && signupBtn) {
        
        loginBtn.addEventListener('click', function() {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            loginBtn.style.backgroundColor = '#ccc';
            signupBtn.style.backgroundColor = '#f0f0f0';
        });

        signupBtn.addEventListener('click', function() {
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
            signupBtn.style.backgroundColor = '#ccc';
            loginBtn.style.backgroundColor = '#f0f0f0';
        });
    }

    // ==========================================
// דף אילוצים

    //  תופסים את הטופס
    const constraintsForm = document.getElementById("constraints-form");

    //   אם הטופס קיים בדף הזה
    if (constraintsForm) {
        //תפיסת האלמנטים
        const scopeAllRadio = document.getElementById("scope_all");
        const scopeSingleRadio = document.getElementById("scope_single");
        const studentSelect = document.getElementById("select_student");
        const startTimeInput = document.getElementById("start_time");
        const endTimeInput = document.getElementById("end_time");

        function toggleStudentSelect() { // אם סימנו צוער ספציפי אז נפתח את הרשימ 
            if (scopeSingleRadio.checked) {
                studentSelect.disabled = false;
                studentSelect.required = true;
            } else {
                studentSelect.disabled = true;
                studentSelect.required = false;
                studentSelect.value = "";//אם לא אז ננעל ונמחק את הבחירה
            }
        }

        scopeAllRadio.addEventListener("change", toggleStudentSelect);
        scopeSingleRadio.addEventListener("change", toggleStudentSelect);
                        //בדיקת שעות אילוץ בטווח
        constraintsForm.addEventListener("submit", function(event) {
            event.preventDefault(); 

            if (!constraintsForm.checkValidity()) {
                constraintsForm.reportValidity();
                return;
            }

            if (endTimeInput.value <= startTimeInput.value) {// אם לא בטווח
                alert("שים לב: שעת הסיום חייבת להיות מאוחרת משעת ההתחלה!");
                console.log('הוזן טווח שעות לא תקין')
                return; 
            }

            alert("האילוץ הוזן בהצלחה!");
            console.log('הוזן אילוץ')
            constraintsForm.reset();
            setTimeout(toggleStudentSelect, 10);
        });
    }

}
var http = require('http');
http.createServer(function(req, res) {
 res.write('Hello World!');
 res.end();
}).listen(8080);

