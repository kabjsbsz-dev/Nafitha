function login() {
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    if (email == "") {
        alert("اكتب البريد الإلكتروني");
        return;
    }
    if (password == "") {
        alert("اكتب كلمة المرور");
        return;
    }

    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(function() {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then(function(result) {
            let uid = result.user.uid;
            return db.collection("users").doc(uid).get();
        })
        .then(function(doc) {
            if (!doc.exists) {
                alert("بيانات الحساب غير موجودة");
                return;
            }
            let user = doc.data();
            localStorage.setItem("uid", auth.currentUser.uid);
            localStorage.setItem("userName", user.name || "");
            localStorage.setItem("factoryName", user.factory || "");
            localStorage.setItem("phone", user.phone || "");
            localStorage.setItem("city", user.city || "");
            localStorage.setItem("profileImage", user.image || "");
            setTimeout(function() {
                window.location = "home.html";
            }, 500);
        })
        .catch(function(error) {
            let msg = "";
            switch (error.code) {
                case "auth/user-not-found":
                    msg = "هذا البريد غير مسجل";
                    break;
                case "auth/wrong-password":
                    msg = "كلمة المرور غير صحيحة";
                    break;
                case "auth/invalid-email":
                    msg = "البريد الإلكتروني غير صحيح";
                    break;
                case "auth/too-many-requests":
                    msg = "تم إيقاف المحاولة مؤقتاً، حاول لاحقاً";
                    break;
                default:
                    msg = error.message;
            }
            alert(msg);
        });
}

auth.onAuthStateChanged(function(user) {
    if (user) {
        window.location = "home.html";
    }
});