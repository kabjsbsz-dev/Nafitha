// =============================================
// ===== app.js - الجزء 1: دوال النشر الأساسية =====
// =============================================

function showForm() {
    document.getElementById("popup").style.display = "flex";
}

function closeForm() {
    document.getElementById("popup").style.display = "none";
}

function addPost() {
    let product = document.getElementById("product").value.trim();
    let price = document.getElementById("price").value.trim();
    let description = document.getElementById("description").value.trim();
    let category = document.getElementById("postCategory").value;
    let image = document.getElementById("image").files[0];

    if (!auth.currentUser) {
        alert("يرجى تسجيل الدخول أولاً");
        return;
    }

    if (description == "" && product == "") {
        alert("اكتب وصفاً أو اسم منتج على الأقل");
        return;
    }

    let uid = auth.currentUser.uid;

    db.collection("users").doc(uid).get().then(function(userDoc) {
        let userData = userDoc.data() || {};
        let profileImage = userData.image || userData.profileImage || "images/logo.png";
        let owner = userData.name || userData.owner || "مستخدم";
        let factory = userData.factory || "";
        let phone = userData.phone || "";
        let city = userData.city || "";
        let location = userData.location || "";

        function savePost(imageUrl) {
            let postData = {
                uid: uid,
                profileImage: profileImage,
                factory: factory,
                owner: owner,
                phone: phone,
                city: city,
                location: location,
                description: description,
                product: product,
                price: price,
                category: category,
                image: imageUrl || "",
                likes: 0,
                views: 0,
                comments: 0,
                time: Date.now()
            };

            db.collection("posts").add(postData)
                .then(function() {
                    closeForm();
                    loadPosts();
                    document.getElementById("description").value = "";
                    document.getElementById("product").value = "";
                    document.getElementById("price").value = "";
                    document.getElementById("image").value = "";
                    document.getElementById("productFields").style.display = "none";
                    document.getElementById("postCategory").value = "";
                    alert("✅ تم النشر بنجاح");
                })
                .catch(function(err) {
                    alert("❌ فشل النشر: " + err.message);
                });
        }

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
                        savePost(data.data.url);
                    } else {
                        alert("فشل رفع الصورة");
                    }
                })
                .catch(() => {
                    alert("حدث خطأ أثناء رفع الصورة");
                });
        } else {
            savePost("");
        }
    });
}
// =============================================
// ===== app.js - الجزء 2: تحميل المنشورات والبحث =====
// =============================================

let currentCategory = "";

function loadPosts(category) {
    if (category !== undefined) {
        currentCategory = category;
    }

    let html = "";
    let search = document.getElementById("search").value.toLowerCase();

    document.getElementById("usersResults").innerHTML = "";

    db.collection("posts")
        .get()
        .then(function(snapshot) {
            if (snapshot.empty) {
                document.getElementById("posts").innerHTML =
                    `<div class="post"><div class="post-body"><p style="text-align:center;color:#888;padding:30px;">📭 لا توجد منشورات</p></div></div>`;
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

            let filteredPosts = posts;
            if (currentCategory) {
                filteredPosts = posts.filter(function(post) {
                    return post.category === currentCategory;
                });
            }

            if (search) {
                filteredPosts = filteredPosts.filter(function(post) {
                    let productText = post.product || "";
                    let factoryText = post.factory || "";
                    let cityText = post.city || "";
                    let descriptionText = post.description || "";
                    let ownerText = post.owner || "";
                    return productText.toLowerCase().includes(search) ||
                           factoryText.toLowerCase().includes(search) ||
                           cityText.toLowerCase().includes(search) ||
                           descriptionText.toLowerCase().includes(search) ||
                           ownerText.toLowerCase().includes(search);
                });
            }

            if (filteredPosts.length === 0) {
                document.getElementById("posts").innerHTML =
                    `<div class="post"><div class="post-body"><p style="text-align:center;color:#888;padding:30px;">🔍 لا توجد منشورات مطابقة</p></div></div>`;
                return;
            }

            filteredPosts.forEach(function(post) {
                let diff = Math.floor((Date.now() - post.time) / 1000);
                let timeText = "الآن";
                if (diff >= 60) timeText = Math.floor(diff / 60) + " دقيقة";
                if (diff >= 3600) timeText = Math.floor(diff / 3600) + " ساعة";
                if (diff >= 86400) timeText = Math.floor(diff / 86400) + " يوم";

                let categoryBadge = post.category ?
                    `<span style="background:#1877f2;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;">${post.category}</span>` :
                    "";

                html += `
                <div class="post" id="post-${post.id}">
                    <div class="post-header">
                        <div class="post-left">
                            <img class="post-avatar" src="${post.profileImage || 'images/logo.png'}">
                            <div class="post-user-info">
                                <div class="post-user-name">${post.owner || 'مستخدم'} ${categoryBadge}</div>
                                <div class="post-user-time">🕒 ${timeText}</div>
                            </div>
                        </div>
                        <div class="post-right">
                            <button class="menu-btn" onclick="toggleMenu('${post.id}')">⋮</button>
                            <div class="menu-box" id="menu-${post.id}" style="display:none;position:absolute;background:#fff;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.2);padding:8px;z-index:100;margin-top:30px;">
                                ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                                    <button onclick="deletePost('${post.id}','${post.uid}')" style="display:block;width:100%;padding:8px 16px;border:none;background:none;text-align:right;color:#d32f2f;font-size:14px;">🗑 حذف</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="post-body">
                        ${post.factory ? `<div class="post-title">🏭 ${post.factory}</div>` : ''}
                        ${post.product ? `<div class="post-product">📦 ${post.product}</div>` : ''}
                        <div class="post-description">${post.description || ''}</div>
                        ${post.price ? `<div class="post-price">💰 ${post.price} د.ع</div>` : ''}
                        ${post.image ? `<img src="${post.image}" class="post-image" onclick="openImage('${post.image}')">` : ''}
                        <div class="post-stats">
                            <span>👁️ ${post.views || 0}</span>
                            <span>💬 ${post.comments || 0}</span>
                            <span>👍 ${post.likes || 0}</span>
                        </div>
                        <div class="post-actions">
                            <button class="action-btn" onclick="likePost('${post.id}')">👍 أعجبني</button>
                            <button class="action-btn" onclick="openComments('${post.id}')">💬 تعليق</button>
                            <button class="action-btn" onclick="sharePost('${post.product || ''}','${post.price || ''}')">↗️ مشاركة</button>
                        </div>
                    </div>
                </div>`;
            });

            document.getElementById("posts").innerHTML = html;

            if (search.length >= 2) {
                searchUsers(search);
            }

        })
        .catch(function(err) {
            console.error("خطأ:", err);
            document.getElementById("posts").innerHTML =
                `<div class="post"><div class="post-body"><p style="text-align:center;color:#d32f2f;padding:30px;">❌ حدث خطأ: ${err.message}</p></div></div>`;
        });
}

function searchUsers(query) {
    db.collection("users")
        .get()
        .then(function(snapshot) {
            let results = [];
            snapshot.forEach(function(doc) {
                let user = doc.data();
                user.id = doc.id;
                let name = (user.name || "").toLowerCase();
                let city = (user.city || "").toLowerCase();
                let factory = (user.factory || "").toLowerCase();
                let q = query.toLowerCase();

                if (name.includes(q) || city.includes(q) || factory.includes(q)) {
                    results.push(user);
                }
            });

            let usersHtml = "";
            if (results.length > 0) {
                usersHtml = `<div style="margin:10px 12px;background:#fff;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                    <h3 style="margin-bottom:10px;font-size:16px;">👤 مستخدمون (${results.length})</h3>`;
                results.forEach(function(user) {
                    let img = user.image || user.profileImage || "images/logo.png";
                    usersHtml += `
                    <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f0f2f5;cursor:pointer;" onclick="viewProfile('${user.id}')">
                        <img src="${img}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #FFD700;">
                        <div>
                            <div style="font-weight:bold;font-size:15px;">${user.name || 'مستخدم'}</div>
                            <div style="font-size:13px;color:#888;">${user.city || ''} ${user.factory ? '🏭 '+user.factory : ''}</div>
                        </div>
                    </div>`;
                });
                usersHtml += `</div>`;
            }

            document.getElementById("usersResults").innerHTML = usersHtml;
        })
        .catch(function(err) {
            console.error("خطأ في البحث عن المستخدمين:", err);
        });
}

function filterByCategory(category) {
    document.getElementById("search").value = category;
    loadPosts(category);
}

function viewProfile(uid) {
    window.location.href = "profile.html?uid=" + uid;
}
// =============================================
// ===== app.js - الجزء 3: دوال التفاعل والإدارة =====
// =============================================

function likePost(postId) {
    if (!auth.currentUser) {
        alert("يرجى تسجيل الدخول");
        return;
    }

    let uid = auth.currentUser.uid;

    db.collection("posts").doc(postId).get()
        .then(function(doc) {
            if (!doc.exists) return;
            let post = doc.data();
            let likedBy = post.likedBy || [];

            if (likedBy.includes(uid)) {
                alert("❌ لقد أعجبت بالفعل");
                return;
            }

            return db.collection("posts").doc(postId).update({
                likes: (post.likes || 0) + 1,
                likedBy: firebase.firestore.FieldValue.arrayUnion(uid)
            });
        })
        .then(function() {
            loadPosts(currentCategory);
        })
        .catch(function(err) {
            console.error("خطأ في الإعجاب:", err);
        });
}

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

function openComments(postId) {
    let commentBox = document.createElement("div");
    commentBox.className = "popup";
    commentBox.style.display = "flex";
    commentBox.innerHTML = `
        <div class="form" style="max-width:500px;background:#fff;border-radius:18px;padding:20px;">
            <h2 style="text-align:center;">💬 التعليقات</h2>
            <div id="commentsList" style="max-height:300px;overflow:auto;text-align:right;margin:15px 0;"></div>
            <input type="text" id="commentInput" placeholder="اكتب تعليقك..." style="width:100%;padding:12px;border:1px solid #ddd;border-radius:12px;margin-bottom:10px;">
            <button onclick="addComment('${postId}')" style="width:100%;padding:12px;background:#1877f2;color:#fff;border:none;border-radius:12px;font-weight:bold;">إرسال</button>
            <button onclick="this.closest('.popup').remove()" style="width:100%;padding:12px;background:#ccc;border:none;border-radius:12px;margin-top:8px;">إغلاق</button>
        </div>
    `;
    document.body.appendChild(commentBox);

    db.collection("posts").doc(postId).collection("comments")
        .orderBy("time", "desc")
        .get()
        .then(function(snapshot) {
            let html = "";
            snapshot.forEach(function(doc) {
                let c = doc.data();
                html += `<p style="border-bottom:1px solid #eee;padding:10px 0;"><b>${c.name || 'مستخدم'}</b>: ${c.text}</p>`;
            });
            document.getElementById("commentsList").innerHTML = html || "<p style='color:#888;text-align:center;'>لا توجد تعليقات</p>";
        });
}

function addComment(postId) {
    let text = document.getElementById("commentInput").value.trim();
    if (!text) { alert("اكتب تعليقاً"); return; }
    let user = auth.currentUser;
    if (!user) { alert("يرجى تسجيل الدخول"); return; }

    db.collection("users").doc(user.uid).get().then(function(doc) {
        let name = doc.data().name || doc.data().owner || "مستخدم";
        db.collection("posts").doc(postId).collection("comments").add({
            uid: user.uid,
            name: name,
            text: text,
            time: Date.now()
        }).then(function() {
            document.getElementById("commentInput").value = "";
            db.collection("posts").doc(postId).update({
                comments: firebase.firestore.FieldValue.increment(1)
            });
            openComments(postId);
        });
    });
}

function sharePost(product, price) {
    let text = product + " - " + price + " د.ع";
    if (navigator.share) {
        navigator.share({ title: "نافذة", text: text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert("✅ تم نسخ النص للحافظة");
        }).catch(() => {
            alert("المشاركة غير مدعومة على هذا الجهاز");
        });
    }
}

function toggleMenu(id) {
    document.querySelectorAll(".menu-box").forEach(function(item) {
        if (item.id !== "menu-" + id) {
            item.style.display = "none";
        }
    });
    let menu = document.getElementById("menu-" + id);
    if (menu) {
        menu.style.display = (menu.style.display === "block") ? "none" : "block";
    }
}

function deletePost(postId, ownerId) {
    if (!auth.currentUser) return;
    if (auth.currentUser.uid !== ownerId) {
        alert("❌ لا يمكنك حذف هذا المنشور");
        return;
    }
    if (!confirm("هل تريد حذف المنشور؟")) return;
    db.collection("posts").doc(postId).delete()
        .then(function() {
            loadPosts(currentCategory);
        })
        .catch(function(err) {
            alert("فشل الحذف: " + err.message);
        });
}

function toggleProductFields() {
    let box = document.getElementById("productFields");
    box.style.display = (box.style.display === "none" || box.style.display === "") ? "block" : "none";
}

auth.onAuthStateChanged(function(user) {
    if (!user) {
        window.location = "login.html";
        return;
    }
    loadPosts();

    db.collection("users").doc(user.uid).get()
        .then(function(doc) {
            if (doc.exists) {
                let data = doc.data();
                if (document.getElementById("publishUserName")) {
                    document.getElementById("publishUserName").innerText = data.name || data.owner || "مستخدم";
                }
                if (document.getElementById("publishProfileImage")) {
                    document.getElementById("publishProfileImage").src = data.image || data.profileImage || "images/logo.png";
                }
            }
        });
});

window.onload = function() {
    let search = document.getElementById("search");
    if (search) {
        search.addEventListener("input", function() {
            currentCategory = "";
            loadPosts();
        });
    }
};
// ===== زر الرجوع (Back Button) =====
let backPressed = false;

window.addEventListener('popstate', function(e) {
    if (document.getElementById('popup').style.display === 'flex') {
        closeForm();
        return;
    }
    
    if (window.location.pathname.includes('home.html')) {
        if (!backPressed) {
            backPressed = true;
            alert("اضغط رجوع مرة أخرى للخروج");
            setTimeout(function() {
                backPressed = false;
            }, 2000);
        } else {
            window.close();
        }
    } else {
        window.history.back();
    }
});

// إضافة حالة للـ popstate
if (window.location.pathname.includes('home.html')) {
    window.history.pushState(null, null, window.location.href);
}
// =============================================
// ===== نظام الإشعارات المتكامل =====
// =============================================

// ===== 1. إرسال إشعار =====
function sendNotification(targetUid, type, message, link) {
    if (!targetUid || targetUid === auth.currentUser?.uid) return;
    
    db.collection("users").doc(targetUid).collection("notifications").add({
        type: type,
        message: message,
        link: link || "#",
        read: false,
        time: Date.now()
    }).catch(function(err) {
        console.error("خطأ في الإشعار:", err);
    });
}

// ===== 2. إشعار عند الإعجاب (موجود، نعدله) =====
// استبدل دالة likePost بهذه:
function likePost(postId) {
    if (!auth.currentUser) {
        alert("يرجى تسجيل الدخول");
        return;
    }

    let uid = auth.currentUser.uid;

    db.collection("posts").doc(postId).get()
        .then(function(doc) {
            if (!doc.exists) return;
            let post = doc.data();
            let likedBy = post.likedBy || [];

            if (likedBy.includes(uid)) {
                alert("❌ لقد أعجبت بالفعل");
                return;
            }

            return db.collection("posts").doc(postId).update({
                likes: (post.likes || 0) + 1,
                likedBy: firebase.firestore.FieldValue.arrayUnion(uid)
            }).then(function() {
                // إرسال إشعار لصاحب المنشور
                if (post.uid !== uid) {
                    db.collection("users").doc(uid).get().then(function(userDoc) {
                        let name = userDoc.data()?.name || "مستخدم";
                        sendNotification(post.uid, "like", `${name} أعجب بمنشورك`, "/home");
                    });
                }
                loadPosts(currentCategory);
            });
        })
        .catch(function(err) {
            console.error("خطأ في الإعجاب:", err);
        });
}

// ===== 3. إشعار عند التعليق =====
// استبدل دالة addComment بهذه:
function addComment(postId) {
    let text = document.getElementById("commentInput").value.trim();
    if (!text) { alert("اكتب تعليقاً"); return; }
    let user = auth.currentUser;
    if (!user) { alert("يرجى تسجيل الدخول"); return; }

    db.collection("users").doc(user.uid).get().then(function(doc) {
        let name = doc.data().name || doc.data().owner || "مستخدم";
        
        db.collection("posts").doc(postId).collection("comments").add({
            uid: user.uid,
            name: name,
            text: text,
            time: Date.now()
        }).then(function() {
            document.getElementById("commentInput").value = "";
            db.collection("posts").doc(postId).update({
                comments: firebase.firestore.FieldValue.increment(1)
            });
            
            // إرسال إشعار لصاحب المنشور
            db.collection("posts").doc(postId).get().then(function(postDoc) {
                if (postDoc.exists) {
                    let post = postDoc.data();
                    if (post.uid !== user.uid) {
                        sendNotification(post.uid, "comment", `${name} علق على منشورك: "${text}"`, "/home");
                    }
                }
            });
            
            openComments(postId);
        });
    });
}

// ===== 4. إشعار عند المتابعة =====
// استبدل دالة followUser بهذه:
function followUser(targetUid) {
    if (!auth.currentUser) { alert("يرجى تسجيل الدخول"); return; }
    let uid = auth.currentUser.uid;
    if (uid === targetUid) { alert("لا يمكنك متابعة نفسك"); return; }

    db.collection("users").doc(targetUid).update({
        followers: firebase.firestore.FieldValue.arrayUnion(uid)
    });

    db.collection("users").doc(uid).update({
        following: firebase.firestore.FieldValue.arrayUnion(targetUid)
    }).then(function() {
        // إرسال إشعار للمستخدم المستهدف
        db.collection("users").doc(uid).get().then(function(userDoc) {
            let name = userDoc.data()?.name || "مستخدم";
            sendNotification(targetUid, "follow", `${name} بدأ متابعتك`, "/profile?uid=" + uid);
        });
        alert("✅ تمت المتابعة");
        loadProfile(targetUid);
    });
}

// ===== 5. إشعار عند نشر منشور (للمتابعين) =====
// أضف هذا في نهاية دالة addPost (بعد savePost)
// داخل دالة savePost، بعد db.collection("posts").add
// أضف هذا الكود:

/*
// بعد إضافة المنشور بنجاح
db.collection("users").doc(uid).get().then(function(userDoc) {
    let userData = userDoc.data() || {};
    let followers = userData.followers || [];
    let userName = userData.name || "مستخدم";
    
    followers.forEach(function(followerUid) {
        sendNotification(followerUid, "new_post", `${userName} نشر منشور جديد`, "/home");
    });
});
*/