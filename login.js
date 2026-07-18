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

// ===== تسجيل الدخول بواسطة Google =====
function loginWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    firebase.auth().signInWithPopup(provider)
        .then(function(result) {
            var user = result.user;
            var uid = user.uid;
            var email = user.email;
            var name = user.displayName || "مستخدم";

            db.collection("users").doc(uid).get()
                .then(function(doc) {
                    if (doc.exists) {
                        localStorage.setItem("uid", uid);
                        localStorage.setItem("userName", doc.data().name || name);
                        localStorage.setItem("profileImage", doc.data().image || user.photoURL || "images/logo.png");
                        window.location.href = "home.html";
                    } else {
                        if (confirm("مرحباً! حسابك الجديد. تريد إكمال البيانات؟")) {
                            localStorage.setItem("googleEmail", email);
                            localStorage.setItem("googleName", name);
                            localStorage.setItem("googlePhoto", user.photoURL || "");
                            localStorage.setItem("googleUid", uid);
                            window.location.href = "register.html?google=true";
                        } else {
                            db.collection("users").doc(uid).set({
                                name: name,
                                email: email,
                                image: user.photoURL || "images/logo.png",
                                type: "user",
                                created: Date.now()
                            }).then(function() {
                                localStorage.setItem("uid", uid);
                                localStorage.setItem("userName", name);
                                localStorage.setItem("profileImage", user.photoURL || "images/logo.png");
                                window.location.href = "home.html";
                            });
                        }
                    }
                });
        })
        .catch(function(error) {
            alert("فشل تسجيل الدخول: " + error.message);
        });
}

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        window.location = "home.html";
    }
});