window.onload = function () {

    // ==========================================
    // חלק א': לוגיקה לדף התחברות (Login/Signup)
    // ==========================================

    // 1. קודם כל תופסים את הכפתורים
    const loginBtn = document.getElementById('btn-show-login');
    const signupBtn = document.getElementById('btn-show-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // 2. הוספתי פה בדיקה: האם הכפתורים האלה בכלל קיימים בדף הזה?
    // אם לא נבדוק, הקוד יקרוס כשתהיה בדף האילוצים (כי שם אין כפתורי התחברות)
    if (loginBtn && signupBtn) {

        loginBtn.addEventListener('click', function () {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            loginBtn.style.backgroundColor = '#ccc';
            signupBtn.style.backgroundColor = '#f0f0f0';
        });

        signupBtn.addEventListener('click', function () {
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
            signupBtn.style.backgroundColor = '#ccc';
            loginBtn.style.backgroundColor = '#f0f0f0';
        });
    }

    // ==========================================
    // חלק ב': לוגיקה לדף האילוצים (Constraints)
    // ==========================================

    // 1. תופסים את הטופס
    const constraintsForm = document.getElementById("constraints-form");

    // 2. הבדיקה שלך: האם הטופס קיים בדף הזה?
    if (constraintsForm) {

        const scopeAllRadio = document.getElementById("scope_all");
        const scopeSingleRadio = document.getElementById("scope_single");
        const studentSelect = document.getElementById("select_student");
        const startTimeInput = document.getElementById("start_time");
        const endTimeInput = document.getElementById("end_time");

        function toggleStudentSelect() {
            if (scopeSingleRadio.checked) {
                studentSelect.disabled = false;
                studentSelect.required = true;
            } else {
                studentSelect.disabled = true;
                studentSelect.required = false;
                studentSelect.value = "";
            }
        }

        scopeAllRadio.addEventListener("change", toggleStudentSelect);
        scopeSingleRadio.addEventListener("change", toggleStudentSelect);

        constraintsForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!constraintsForm.checkValidity()) {
                constraintsForm.reportValidity();
                return;
            }

            if (endTimeInput.value <= startTimeInput.value) {
                alert("שים לב: שעת הסיום חייבת להיות מאוחרת משעת ההתחלה!");
                return;
            }
            alert("האילוץ נשלח!");
            constraintsForm.submit();
        });
    }


}
