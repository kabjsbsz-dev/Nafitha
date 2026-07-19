// =============================================
// ===== الملف الشخصي - الجزء 1 =====
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

    document.getElementById("userName").innerText = "جاري التحميل...";
    document.getElementById("userBio").innerText = "⏳";
    document.getElementById("userCity").innerText = "📍 جاري التحميل";

    db.collection("users").doc(uid).get()
        .then(function(doc) {
            if (!doc.exists) {
                document.getElementById("userName").innerText = "مستخدم غير مسجل";
                document.getElementById("userBio").innerText = "ليس لديك حساب كامل";
                document.getElementById("userCity").innerText = "📍 غير محدد";
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
                    followBtn.style.background = "rgba(255,255,255,0.1)";
                    followBtn.style.color = "#fff";
                } else {
                    followBtn.innerText = "➕ متابعة";
                    followBtn.style.background = "rgba(255,215,0,0.2)";
                    followBtn.style.color = "#FFD700";
                }
            } else {
                followBtn.style.display = "none";
            }

            // ===== زر المراسلة (فقط للمستخدمين الآخرين) =====
            if (uid !== currentUser.uid) {
                let oldChatBtn = document.getElementById("chatBtn");
                if (oldChatBtn) oldChatBtn.remove();

                let chatBtn = document.createElement("button");
                chatBtn.id = "chatBtn";
                chatBtn.innerHTML = "💬 مراسلة";
                chatBtn.style.background = "rgba(255,215,0,0.15)";
                chatBtn.style.border = "1px solid #FFD700";
                chatBtn.style.borderRadius = "50px";
                chatBtn.style.padding = "10px 20px";
                chatBtn.style.color = "#FFD700";
                chatBtn.style.cursor = "pointer";
                chatBtn.style.fontSize = "14px";
                chatBtn.style.fontWeight = "bold";
                chatBtn.onclick = function() {
                    window.location.href = "chat.html?uid=" + uid;
                };

                let buttonsContainer = document.querySelector(".profile-buttons");
                if (buttonsContainer) {
                    buttonsContainer.appendChild(chatBtn);
                }
            }

        })
        .catch(function(err) {
            console.error("خطأ:", err);
            document.getElementById("userName").innerText = "خطأ في التحميل";
        });

    loadUserPosts(uid);
}
// =============================================
// ===== الملف الشخصي - الجزء 2 =====
// =============================================

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
                html = `<div class="post"><div class="post-body"><p style="text-align:center;color:rgba(255,255,255,0.4);padding:30px;">📭 لا توجد منشورات</p></div></div>`;
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

                html += `
                <div class="post">
                    <div class="post-body">
                        ${post.factory ? `<div class="post-title">🏭 ${post.factory}</div>` : ''}
                        ${post.product ? `<div class="post-product">📦 ${post.product}</div>` : ''}
                        <div class="post-description">${post.description || ''}</div>
                        ${post.price ? `<div class="post-price">💰 ${post.price} د.ع</div>` : ''}
                        ${imagesHtml}
                        <div class="post-stats" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);">
                            <span>👁️ ${post.views || 0} مشاهدات</span>
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
            console.error("خطأ:", err);
            document.getElementById("userPosts").innerHTML = 
                `<div class="post"><div class="post-body"><p style="text-align:center;color:#ff6b6b;padding:30px;">❌ حدث خطأ أثناء تحميل المنشورات</p></div></div>`;
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
            });

            html += "</div>";
            if (count === 0) {
                html = "<p style='text-align:center;color:rgba(255,255,255,0.4);padding:30px;'>📷 لا توجد صور</p>";
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
                "<p style='text-align:center;color:rgba(255,255,255,0.4);padding:30px;'>⭐ لا توجد مفضلات</p>";
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
                        </div>
                    </div>
                    `;
                }
                count++;
                if (count === favs.length) {
                    document.getElementById("userPosts").innerHTML = 
                        html || "<p style='text-align:center;color:rgba(255,255,255,0.4);padding:30px;'>⭐ لا توجد مفضلات</p>";
                }
            });
        });
    });
}
// =============================================
// ===== الملف الشخصي - الجزء 3 =====
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
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
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
                db.collection("users").doc(auth.currentUser.uid).update({ cover: url })
                    .then(function() {
                        document.getElementById("coverImage").src = url;
                    });
            } else {
                alert("فشل رفع الصورة");
            }
        })
        .catch(function() {
            alert("حدث خطأ");
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
        btn.style.background = "rgba(255,255,255,0.1)";
        btn.style.color = "#fff";
    } else {
        unfollowUser(targetUid);
        btn.innerText = "➕ متابعة";
        btn.style.background = "rgba(255,215,0,0.2)";
        btn.style.color = "#FFD700";
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
        db.collection("users").doc(uid).get().then(function(userDoc) {
            let name = userDoc.data()?.name || "مستخدم";
            sendNotification(targetUid, "follow", `${name} بدأ متابعتك`, "/profile?uid=" + uid);
        });
        updateFollowCounts(targetUid);
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
        updateFollowCounts(targetUid);
    });
}

function updateFollowCounts(uid) {
    db.collection("users").doc(uid).get().then(function(doc) {
        if (doc.exists) {
            let data = doc.data();
            let followers = data.followers || [];
            document.getElementById("followersCount").innerText = followers.length;
        }
    });
}

function showFollowers() {
    let urlParams = new URLSearchParams(window.location.search);
    let uid = urlParams.get("uid") || auth.currentUser.uid;

    db.collection("users").doc(uid).get().then(function(doc) {
        let data = doc.data() || {};
        let followers = data.followers || [];
        let names = [];

        if (followers.length === 0) {
            alert("👥 لا يوجد متابعون");
            return;
        }

        let count = 0;
        followers.forEach(function(followerUid) {
            db.collection("users").doc(followerUid).get().then(function(userDoc) {
                if (userDoc.exists) {
                    let userData = userDoc.data();
                    names.push(userData.name || "مستخدم");
                }
                count++;
                if (count === followers.length) {
                    alert("👥 المتابعون:\n" + names.join("\n"));
                }
            });
        });
    });
}

function showFollowing() {
    let urlParams = new URLSearchParams(window.location.search);
    let uid = urlParams.get("uid") || auth.currentUser.uid;

    db.collection("users").doc(uid).get().then(function(doc) {
        let data = doc.data() || {};
        let following = data.following || [];
        let names = [];

        if (following.length === 0) {
            alert("👥 لا يتابع أحد");
            return;
        }

        let count = 0;
        following.forEach(function(followUid) {
            db.collection("users").doc(followUid).get().then(function(userDoc) {
                if (userDoc.exists) {
                    let userData = userDoc.data();
                    names.push(userData.name || "مستخدم");
                }
                count++;
                if (count === following.length) {
                    alert("👥 يتابع:\n" + names.join("\n"));
                }
            });
        });
    });
}

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