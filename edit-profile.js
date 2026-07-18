// =============================================
// ===== تحميل بيانات المستخدم الحالية =====
// =============================================

auth.onAuthStateChanged(function(user) {
    if (!user) {
        window.location = "login.html";
        return;
    }

    let uid = user.uid;

    db.collection("users").doc(uid).get()
        .then(function(doc) {
            if (doc.exists) {
                let data = doc.data();
                document.getElementById("editName").value = data.name || "";
                document.getElementById("editBio").value = data.bio || "";
                document.getElementById("editCity").value = data.city || "";
                document.getElementById("editPhone").value = data.phone || "";
                document.getElementById("editFactory").value = data.factory || "";

                // عرض الصور الحالية (معاينة)
                if (data.image || data.profileImage) {
                    let imgUrl = data.image || data.profileImage;
                    document.getElementById("profilePreview").innerHTML =
                        `<img src="${imgUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:2px solid #FFD700;">`;
                }
                if (data.cover) {
                    document.getElementById("coverPreview").innerHTML =
                        `<img src="${data.cover}" style="width:120px;height:80px;object-fit:cover;border-radius:10px;border:2px solid #ddd;">`;
                }
            }
        })
        .catch(function(err) {
            console.error("خطأ في تحميل البيانات:", err);
        });
});

// =============================================
// ===== معاينة الصور عند الاختيار =====
// =============================================

document.getElementById("profileImageInput").addEventListener("change", function() {
    let file = this.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("profilePreview").innerHTML =
                `<img src="${e.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:2px solid #FFD700;">`;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById("coverImageInput").addEventListener("change", function() {
    let file = this.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("coverPreview").innerHTML =
                `<img src="${e.target.result}" style="width:120px;height:80px;object-fit:cover;border-radius:10px;border:2px solid #ddd;">`;
        };
        reader.readAsDataURL(file);
    }
});

// =============================================
// ===== رفع الصور إلى imgbb =====
// =============================================

function uploadImage(file) {
    return new Promise(function(resolve, reject) {
        if (!file) {
            resolve(null);
            return;
        }
        let formData = new FormData();
        formData.append("image", file);
        fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb", {
            method: "POST",
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                resolve(data.data.url);
            } else {
                reject("فشل رفع الصورة");
            }
        })
        .catch(() => reject("خطأ في رفع الصورة"));
    });
}

// =============================================
// ===== حفظ التغييرات =====
// =============================================

async function saveProfile() {
    if (!auth.currentUser) {
        alert("يرجى تسجيل الدخول");
        return;
    }

    // جمع البيانات من الحقول
    let name = document.getElementById("editName").value.trim();
    let bio = document.getElementById("editBio").value.trim();
    let city = document.getElementById("editCity").value.trim();
    let phone = document.getElementById("editPhone").value.trim();
    let factory = document.getElementById("editFactory").value.trim();

    if (!name) {
        alert("الاسم مطلوب");
        return;
    }

    let profileFile = document.getElementById("profileImageInput").files[0];
    let coverFile = document.getElementById("coverImageInput").files[0];

    // عرض رسالة تحميل
    let saveBtn = document.querySelector(".btn-save");
    let originalText = saveBtn.innerText;
    saveBtn.innerText = "⏳ جاري الحفظ...";
    saveBtn.disabled = true;

    try {
        // رفع الصور إذا وجدت
        let profileUrl = null;
        let coverUrl = null;

        if (profileFile) {
            profileUrl = await uploadImage(profileFile);
        }
        if (coverFile) {
            coverUrl = await uploadImage(coverFile);
        }

        // بناء كائن التحديث
        let updateData = {
            name: name,
            bio: bio,
            city: city,
            phone: phone,
            factory: factory
        };

        if (profileUrl) {
            updateData.image = profileUrl;
            updateData.profileImage = profileUrl;
        }
        if (coverUrl) {
            updateData.cover = coverUrl;
        }

        // تحديث في Firestore
        await db.collection("users").doc(auth.currentUser.uid).update(updateData);

        // تحديث localStorage (إذا كنت تستخدمه)
        localStorage.setItem("userName", name);
        localStorage.setItem("factoryName", factory);
        localStorage.setItem("phone", phone);
        localStorage.setItem("city", city);
        if (profileUrl) localStorage.setItem("profileImage", profileUrl);

        alert("✅ تم حفظ التغييرات بنجاح");
        window.location.href = "profile.html";

    } catch (error) {
        alert("❌ حدث خطأ: " + error);
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}