let userImage = "";

function register() {
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    let name = document.getElementById("name").value.trim();
    let factory = document.getElementById("factory").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let city = document.getElementById("city").value.trim();
    let birth = document.getElementById("birth").value;
    let image = document.getElementById("image").files[0];

    if (name == "" || phone == "" || city == "") {
        alert("املأ جميع الحقول");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(function(result) {
            let uid = result.user.uid;

            if (image) {
                let formData = new FormData();
                formData.append("image", image);
                fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb", {
                        method: "POST",
                        body: formData
                    })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success) {
                            userImage = data.data.url;
                            saveUser(uid, name, factory, phone, city, birth);
                        } else {
                            alert("فشل رفع الصورة");
                            saveUser(uid, name, factory, phone, city, birth);
                        }
                    })
                    .catch(() => {
                        alert("خطأ برفع الصورة، سيتم الحفظ بدونها");
                        saveUser(uid, name, factory, phone, city, birth);
                    });
            } else {
                saveUser(uid, name, factory, phone, city, birth);
            }
        })
        .catch(function(error) {
            alert(error.message);
        });
}

function saveUser(uid, name, factory, phone, city, birth) {
    db.collection("users").doc(uid).set({
        name: name,
        factory: factory,
        phone: phone,
        city: city,
        birth: birth,
        image: userImage,
        type: "factory",
        created: Date.now()
    })
    .then(function() {
        localStorage.setItem("uid", uid);
        localStorage.setItem("userName", name);
        localStorage.setItem("factoryName", factory);
        localStorage.setItem("phone", phone);
        localStorage.setItem("city", city);
        localStorage.setItem("profileImage", userImage);
        window.location = "home.html";
    })
    .catch(function(error) {
        alert(error.message);
    });
}