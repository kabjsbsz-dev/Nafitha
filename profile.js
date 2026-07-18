auth.onAuthStateChanged(function(user) {
    if (!user) {
        location.href = "login.html";
        return;
    }

    // تحميل بيانات المستخدم
    db.collection("users").doc(user.uid).get().then(function(doc) {
        let data = doc.data();
        document.getElementById("userName").innerText = data.name || data.owner || "مستخدم";
        if (data.image || data.profileImage) {
            document.getElementById("profileImage").src = data.image || data.profileImage;
        }
    });

    // تحميل منشورات المستخدم
    db.collection("posts")
        .where("uid", "==", user.uid)
        .get()
        .then(function(snapshot) {
            document.getElementById("postsCount").innerText = snapshot.size;

            let html = "";
            snapshot.forEach(function(doc) {
                let post = doc.data();
                html += `
                <div class="post">
                    ${post.image ? `<img src="${post.image}" class="post-image">` : ""}
                    <div class="post-body">
                        ${post.factory ? `<div class="post-title">🏭 ${post.factory}</div>` : ""}
                        ${post.product ? `<div class="post-product">📦 ${post.product}</div>` : ""}
                        <div class="post-description">${post.description || ''}</div>
                        ${post.price ? `<div class="post-price">💰 ${post.price} د.ع</div>` : ""}
                    </div>
                </div>
                `;
            });
            document.getElementById("userPosts").innerHTML = html || "<p style='text-align:center;color:#888;padding:30px;'>لا توجد منشورات</p>";
        });
});

function editProfile() {
    location.href = "edit-profile.html";
}

function changeCover() {
    alert("📷 سيتم إضافة تغيير الغلاف قريباً");
}

// رفع صورة الملف الشخصي
document.getElementById("profileUpload").onchange = async function() {
    let file = this.files[0];
    if (!file) return;

    let formData = new FormData();
    formData.append("image", file);

    let res = await fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb", {
        method: "POST",
        body: formData
    });

    let data = await res.json();
    if (!data.success) {
        alert("فشل رفع الصورة");
        return;
    }

    let image = data.data.url;
    await db.collection("users").doc(auth.currentUser.uid).update({
        image: image,
        profileImage: image
    });

    document.getElementById("profileImage").src = image;
    alert("✅ تم تغيير صورة الحساب");
};