// =============================================
// ===== profile.js - الجزء 1 =====
// =============================================

auth.onAuthStateChanged(function(user) {
    if (!user) {
        location.href = "login.html";
        return;
    }

    let urlParams = new URLSearchParams(window.location.search);
    let profileUid = urlParams.get("uid") || user.uid;

    loadProfile(profileUid);
});

function loadProfile(uid) {
    if (!uid) return;

    db.collection("users").doc(uid).get().then(function(doc) {
        if (!doc.exists) {
            document.getElementById("userName").innerText = "مستخدم غير موجود";
            return;
        }

        let data = doc.data();
        document.getElementById("userName").innerText = data.name || data.owner || "مستخدم";
        document.getElementById("userBio").innerText = data.bio || "مرحباً! أنا على نافذة";
        document.getElementById("userCity").innerText = "📍 " + (data.city || "غير محدد");

        if (data.image || data.profileImage) {
            document.getElementById("profileImage").src = data.image || data.profileImage;
        }
        if (data.cover) {
            document.getElementById("coverImage").src = data.cover;
        }

        let followers = data.followers || [];
        let following = data.following || [];
        document.getElementById("followersCount").innerText = followers.length;
        document.getElementById("followingCount").innerText = following.length;

        let currentUser = auth.currentUser;
        let followBtn = document.getElementById("followBtn");

        if (uid !== currentUser.uid) {
            followBtn.style.display = "block";
            if (followers.includes(currentUser.uid)) {
                followBtn.innerText = "❌ إلغاء المتابعة";
                followBtn.style.background = "#e4e6eb";
                followBtn.style.color = "#111";
            } else {
                followBtn.innerText = "➕ متابعة";
                followBtn.style.background = "#1877f2";
                followBtn.style.color = "#fff";
            }
        } else {
            followBtn.style.display = "none";
        }
    }).catch(function(err) {
        console.log("خطأ بتحميل المستخدم:", err);
    });

    loadUserPosts(uid);
}

function loadUserPosts(uid) {
    if (!uid) {
        let urlParams = new URLSearchParams(window.location.search);
        uid = urlParams.get("uid") || auth.currentUser.uid;
    }

    db.collection("posts")
        .where("uid", "==", uid)
        .get()
        .then(function(snapshot) {
            document.getElementById("postsCount").innerText = snapshot.size;

            let html = "";
            if (snapshot.empty) {
                html = "<p style='text-align:center;color:#888;padding:30px;'>📭 لا توجد منشورات</p>";
                document.getElementById("userPosts").innerHTML = html;
                return;
            }

            let posts = [];
            snapshot.forEach(function(doc) {
                let post = doc.data();
                post.id = doc.id;
                posts.push(post);
            });

            posts.sort(function(a, b) {
                return b.time - a.time;
            });

            posts.forEach(function(post) {
                let imagesHtml = "";
                if (post.image) {
                    imagesHtml = `<img src="${post.image}" style="width:100%;max-height:300px;object-fit:cover;border-radius:12px;cursor:pointer;margin-top:8px;" onclick="openImage('${post.image}')">`;
                }
                if (post.images && post.images.length > 0) {
                    imagesHtml = `
                    <div style="display:flex;overflow-x:auto;gap:8px;padding:8px 0;margin-top:8px;">
                        ${post.images.map(img => `
                            <img src="${img}" style="min-width:150px;height:150px;object-fit:cover;border-radius:12px;cursor:pointer;" onclick="openImage('${img}')">
                        `).join('')}
                    </div>
                    `;
                }

                let pinnedBadge = post.pinned ? '📌 <span style="color:#1877f2;">مثبت</span> ' : '';

                html += `
                <div class="post">
                    <div class="post-body">
                        <div style="font-size:14px;color:#888;margin-bottom:4px;">${pinnedBadge}</div>
                        ${post.factory ? `<div class="post-title">🏭 ${post.factory}</div>` : ''}
                        ${post.product ? `<div class="post-product">📦 ${post.product}</div>` : ''}
                        <div class="post-description">${post.description || ''}</div>
                        ${post.price ? `<div class="post-price">💰 ${post.price} د.ع</div>` : ''}
                        ${imagesHtml}
                        <div class="post-stats" style="margin-top:10px;padding-top:10px;border-top:1px solid #eee;">
                            <span>👁️ ${post.views || 0}</span>
                            <span>💬 ${post.comments || 0}</span>
                            <span>👍 ${post.likes || 0}</span>
                        </div>
                    </div>
                </div>
                `;
            });

            document.getElementById("userPosts").innerHTML = html;
        })
        .catch(function(err) {
            console.error("خطأ بتحميل المنشورات:", err);
            document.getElementById("userPosts").innerHTML = 
                `<p style="text-align:center;color:#d32f2f;padding:30px;">❌ حدث خطأ أثناء تحميل المنشورات</p>`;
        });
}

function loadUserPhotos() {
    let urlParams = new URLSearchParams(window.location.search);
    let uid = urlParams.get("uid") || auth.currentUser.uid;

    db.collection("posts")
        .where("uid", "==", uid)
        .get()
        .then(function(snapshot) {
            let html = "<div style='display:flex;flex-wrap:wrap;gap:10px;padding:20px;'>";
            let count = 0;

            snapshot.forEach(function(doc) {
                let post = doc.data();
                if (post.image) {
                    html += `
                    <img src="${post.image}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;cursor:pointer;" onclick="openImage('${post.image}')">
                    `;
                    count++;
                }
                if (post.images && post.images.length > 0) {
                    post.images.forEach(function(img) {
                        html += `
                        <img src="${img}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;cursor:pointer;" onclick="openImage('${img}')">
                        `;
                        count++;
                    });
                }
            });

            html += "</div>";
            if (count === 0) {
                html = "<p style='text-align:center;color:#888;padding:30px;'>📷 لا توجد صور</p>";
            }

            document.getElementById("userPosts").innerHTML = html;
        });
}

function loadUserFavorites() {
    let urlParams = new URLSearchParams(window.location.search);
    let uid = urlParams.get("uid") || auth.currentUser.uid;

    db.collection("users").doc(uid).get().then(function(doc) {
        let data = doc.data() || {};
        let favs = data.favoritesList || [];

        if (favs.length === 0) {
            document.getElementById("userPosts").innerHTML = 
                "<p style='text-align:center;color:#888;padding:30px;'>⭐ لا توجد مفضلات</p>";
            return;
        }

        let html = "";
        let count = 0;

        favs.forEach(function(postId) {
            db.collection("posts").doc(postId).get().then(function(postDoc) {
                if (postDoc.exists) {
                    let p = postDoc.data();
                    html += `
                    <div class="post">
                        <div class="post-body">
                            ${p.factory ? `<div class="post-title">🏭 ${p.factory}</div>` : ''}
                            ${p.product ? `<div class="post-product">📦 ${p.product}</div>` : ''}
                            <div class="post-description">${p.description || ''}</div>
                            ${p.price ? `<div class="post-price">💰 ${p.price} د.ع</div>` : ''}
                            ${p.image ? `<img src="${p.image}" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;cursor:pointer;margin-top:8px;" onclick="openImage('${p.image}')">` : ''}
                        </div>
                    </div>
                    `;
                }
                count++;
                if (count === favs.length) {
                    document.getElementById("userPosts").innerHTML = 
                        html || "<p style='text-align:center;color:#888;padding:30px;'>⭐ لا توجد مفضلات</p>";
                }
            });
        });
    });
}
// =============================================
// ===== profile.js - الجزء 2 =====
// =============================================

function openImage(src) {
    let viewer = document.createElement("div");
    viewer.className = "image-viewer";
    viewer.innerHTML = `
        <span class="close-viewer" onclick="this.parentElement.remove()">&times;</span>
        <img src="${src}" class="viewer-img">
        <a href="${src}" download class="download-btn">📥 تحميل الصورة</a>
    `;
    document.body.appendChild(viewer);
    viewer.onclick = function(e) {
        if (e.target === viewer) viewer.remove();
    };
}

document.getElementById("profileUpload").onchange = function() {
    let file = this.files[0];
    if (!file) return;

    let formData = new FormData();
    formData.append("image", file);

    fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb", {
        method: "POST",
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            let image = data.data.url;
            db.collection("users").doc(auth.currentUser.uid).update({
                image: image,
                profileImage: image
            }).then(function() {
                document.getElementById("profileImage").src = image;
                alert("✅ تم تغيير صورة الحساب");
            });
        } else {
            alert("فشل رفع الصورة");
        }
    })
    .catch(function() {
        alert("حدث خطأ أثناء رفع الصورة");
    });
};

function changeCover() {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = function() {
        let file = this.files[0];
        if (!file) return;

        let formData = new FormData();
        formData.append("image", file);

        fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb", {
            method: "POST",
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                let url = data.data.url;
                db.collection("users").doc(auth.currentUser.uid).update({ cover: url });
                document.getElementById("coverImage").src = url;
                alert("✅ تم تغيير الغلاف");
            }
        });
    };
    input.click();
}

function editProfile() {
    window.location.href = "profile.html";
}

function switchTab(tab) {
    document.querySelectorAll(".profile-tabs .tab").forEach(function(el) {
        el.classList.remove("active");
    });

    if (tab === 'posts') {
        document.querySelector(".profile-tabs .tab:nth-child(1)").classList.add("active");
        loadUserPosts();
    } else if (tab === 'photos') {
        document.querySelector(".profile-tabs .tab:nth-child(2)").classList.add("active");
        loadUserPhotos();
    } else if (tab === 'favorites') {
        document.querySelector(".profile-tabs .tab:nth-child(3)").classList.add("active");
        loadUserFavorites();
    }
}

function toggleFollow() {
    if (!auth.currentUser) { alert("يرجى تسجيل الدخول"); return; }

    let btn = document.getElementById("followBtn");
    let urlParams = new URLSearchParams(window.location.search);
    let targetUid = urlParams.get("uid") || auth.currentUser.uid;

    if (btn.innerText.includes("متابعة")) {
        followUser(targetUid);
        btn.innerText = "❌ إلغاء المتابعة";
        btn.style.background = "#e4e6eb";
        btn.style.color = "#111";
    } else {
        unfollowUser(targetUid);
        btn.innerText = "➕ متابعة";
        btn.style.background = "#1877f2";
        btn.style.color = "#fff";
    }
}

function followUser(targetUid) {
    if (!auth.currentUser) return;
    let uid = auth.currentUser.uid;
    if (uid === targetUid) return;

    db.collection("users").doc(targetUid).update({
        followers: firebase.firestore.FieldValue.arrayUnion(uid)
    });

    db.collection("users").doc(uid).update({
        following: firebase.firestore.FieldValue.arrayUnion(targetUid)
    }).then(function() {
        loadProfile(targetUid);
    });
}

function unfollowUser(targetUid) {
    if (!auth.currentUser) return;
    let uid = auth.currentUser.uid;

    db.collection("users").doc(targetUid).update({
        followers: firebase.firestore.FieldValue.arrayRemove(uid)
    });

    db.collection("users").doc(uid).update({
        following: firebase.firestore.FieldValue.arrayRemove(targetUid)
    }).then(function() {
        loadProfile(targetUid);
    });
}

function showFollowers() {
    let urlParams = new URLSearchParams(window.location.search);
    let uid = urlParams.get("uid") || auth.currentUser.uid;

    db.collection("users").doc(uid).get().then(function(doc) {
        let data = doc.data() || {};
        let followers = data.followers || [];
        alert(`👥 المتابعون (${followers.length}):\n${followers.join('\n') || 'لا يوجد متابعون'}`);
    });
}

function showFollowing() {
    let urlParams = new URLSearchParams(window.location.search);
    let uid = urlParams.get("uid") || auth.currentUser.uid;

    db.collection("users").doc(uid).get().then(function(doc) {
        let data = doc.data() || {};
        let following = data.following || [];
        alert(`👥 يتابع (${following.length}):\n${following.join('\n') || 'لا يتابع أحد'}`);
    });
}

// ===== تسجيل خروج =====
function logout() {
    if (confirm("هل تريد تسجيل الخروج؟")) {
        firebase.auth().signOut().then(function() {
            localStorage.clear();
            window.location.href = "login.html";
        }).catch(function(error) {
            alert("خطأ: " + error.message);
        });
    }
}
// ===== إرسال إشعار عند المتابعة =====
// ملاحظة: دالة followUser موجودة بالفعل، فقط تأكد من وجود sendNotification فيها
// إذا ماكو، أضف هذا السطر داخل followUser بعد نجاح المتابعة:

/*
db.collection("users").doc(uid).get().then(function(userDoc) {
    let name = userDoc.data()?.name || "مستخدم";
    sendNotification(targetUid, "follow", `${name} بدأ متابعتك`, "/profile?uid=" + uid);
});
*/