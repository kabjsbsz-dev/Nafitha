// =============================================
// ===== نافذة - app.js (النسخة النهائية) =====
// =============================================

// ===== دوال النشر الأساسية =====

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
                likedBy: [],
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
                })
                .catch(function(err) {
                    alert("فشل النشر: " + err.message);
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
// ===== تحميل المنشورات مع التعليقات =====
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
                    `<div class="post"><div class="post-body"><p style="text-align:center;color:rgba(255,255,255,0.4);padding:30px;">📭 لا توجد منشورات</p></div></div>`;
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
                    `<div class="post"><div class="post-body"><p style="text-align:center;color:rgba(255,255,255,0.4);padding:30px;">🔍 لا توجد منشورات مطابقة</p></div></div>`;
                return;
            }

            filteredPosts.forEach(function(post) {
                // زيادة المشاهدات
                db.collection("posts").doc(post.id).update({
                    views: firebase.firestore.FieldValue.increment(1)
                }).catch(() => {});

                let diff = Math.floor((Date.now() - post.time) / 1000);
                let timeText = "الآن";
                if (diff >= 60) timeText = Math.floor(diff / 60) + " دقيقة";
                if (diff >= 3600) timeText = Math.floor(diff / 3600) + " ساعة";
                if (diff >= 86400) timeText = Math.floor(diff / 86400) + " يوم";

                let categoryBadge = post.category ?
                    `<span style="background:#1877f2;color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;">${post.category}</span>` :
                    "";

                let likeIcon = "👍";
                if (auth.currentUser && post.likedBy && post.likedBy.includes(auth.currentUser.uid)) {
                    likeIcon = "❤️";
                }

                html += `
                <div class="post" id="post-${post.id}">
                    <div class="post-header">
                        <div class="post-left">
                            <img class="post-avatar" 
                                 src="${post.profileImage || 'images/logo.png'}" 
                                 onclick="viewProfile('${post.uid}')" 
                                 style="cursor:pointer;">
                            <div class="post-user-info">
                                <div class="post-user-name" 
                                     onclick="viewProfile('${post.uid}')" 
                                     style="cursor:pointer;color:#1877f2;">
                                    ${post.owner || 'مستخدم'} ${categoryBadge}
                                </div>
                                <div class="post-user-time">🕒 ${timeText}</div>
                            </div>
                        </div>
                        <div class="post-right">
                            <button class="menu-btn" onclick="toggleMenu('${post.id}')">⋮</button>
                            <div class="menu-box" id="menu-${post.id}" style="display:none;position:absolute;background:rgba(30,30,50,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:8px;z-index:100;margin-top:30px;min-width:130px;">
                                ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                                    <button onclick="deletePost('${post.id}','${post.uid}')" style="display:block;width:100%;padding:6px 14px;border:none;background:none;text-align:right;color:#ff6b6b;font-size:13px;border-radius:6px;">🗑 حذف</button>
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
                            <span>👁️ ${post.views || 0} مشاهدات</span>
                            <span>💬 ${post.comments || 0}</span>
                            <span>${likeIcon} ${post.likes || 0}</span>
                        </div>
                        
                        <div class="post-actions">
                            <button class="action-btn" onclick="likePost('${post.id}')">
                                ${likeIcon} ${post.likedBy && post.likedBy.includes(auth.currentUser?.uid) ? 'إلغاء الإعجاب' : 'أعجبني'}
                            </button>
                            <button class="action-btn" onclick="loadAllComments('${post.id}')">💬 تعليق</button>
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
                `<div class="post"><div class="post-body"><p style="text-align:center;color:#ff6b6b;padding:30px;">❌ حدث خطأ: ${err.message}</p></div></div>`;
        });
}
// =============================================
// ===== البحث والمستخدمين والإعجاب =====
// =============================================

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
                usersHtml = `<div style="margin:10px 12px;background:rgba(255,255,255,0.06);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px;color:#fff;">
                    <h3 style="margin-bottom:10px;font-size:16px;">👤 مستخدمون (${results.length})</h3>`;
                results.forEach(function(user) {
                    let img = user.image || user.profileImage || "images/logo.png";
                    usersHtml += `
                    <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;" onclick="viewProfile('${user.id}')">
                        <img src="${img}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #FFD700;">
                        <div>
                            <div style="font-weight:bold;font-size:15px;">${user.name || 'مستخدم'}</div>
                            <div style="font-size:13px;color:rgba(255,255,255,0.4);">${user.city || ''} ${user.factory ? '🏭 '+user.factory : ''}</div>
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
    if (!uid) return;
    window.location.href = "profile.html?uid=" + uid;
}

// =============================================
// ===== الإعجاب (Toggle) =====
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
                return db.collection("posts").doc(postId).update({
                    likes: (post.likes || 0) - 1,
                    likedBy: firebase.firestore.FieldValue.arrayRemove(uid)
                });
            } else {
                return db.collection("posts").doc(postId).update({
                    likes: (post.likes || 0) + 1,
                    likedBy: firebase.firestore.FieldValue.arrayUnion(uid)
                });
            }
        })
        .then(function() {
            loadPosts(currentCategory);
        })
        .catch(function(err) {
            console.error("خطأ في الإعجاب:", err);
        });
}

// =============================================
// ===== عرض الصورة =====
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
}// =============================================
// ===== التعليقات (نافذة جميع التعليقات) =====
// =============================================

function loadAllComments(postId) {
    let commentBox = document.createElement("div");
    commentBox.className = "popup";
    commentBox.style.display = "flex";
    commentBox.id = "commentPopup";
    commentBox.innerHTML = `
        <div class="comments-container" style="width:92%;max-width:500px;background:rgba(30,30,50,0.95);backdrop-filter:blur(20px);border-radius:18px;padding:20px;max-height:85vh;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:12px;">
                <h2 style="margin:0;font-size:20px;color:#fff;">💬 جميع التعليقات</h2>
                <button onclick="this.closest('.popup').remove()" style="font-size:24px;color:#fff;background:none;border:none;cursor:pointer;">✕</button>
            </div>
            <div id="allCommentsList" style="flex:1;overflow-y:auto;margin:15px 0;padding-left:5px;color:#fff;"></div>
            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;display:flex;gap:8px;">
                <input type="text" id="commentInputPopup" placeholder="اكتب تعليقاً..." style="flex:1;padding:10px 16px;border:1px solid rgba(255,255,255,0.1);border-radius:50px;background:rgba(255,255,255,0.06);color:#fff;outline:none;">
                <button onclick="addCommentPopup('${postId}')" style="padding:10px 20px;background:linear-gradient(135deg,#FFD700,#f5a623);color:#111;border:none;border-radius:50px;font-weight:bold;">نشر</button>
            </div>
        </div>
    `;
    document.body.appendChild(commentBox);

    loadAllCommentsList(postId);
}

function loadAllCommentsList(postId) {
    db.collection("posts").doc(postId).collection("comments")
        .orderBy("time", "desc")
        .get()
        .then(function(snapshot) {
            let html = "";
            if (snapshot.empty) {
                html = "<p style='text-align:center;color:rgba(255,255,255,0.4);padding:30px;'>لا توجد تعليقات</p>";
                document.getElementById("allCommentsList").innerHTML = html;
                return;
            }

            snapshot.forEach(function(doc) {
                let c = doc.data();
                let timeText = new Date(c.time).toLocaleString("ar");
                html += `
                <div style="border-bottom:1px solid rgba(255,255,255,0.05);padding:10px 0;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <b style="color:#1877f2;">${c.name || 'مستخدم'}</b>
                        <span style="color:rgba(255,255,255,0.3);font-size:12px;">${timeText}</span>
                        <button onclick="showReplyInputPopup('${postId}','${doc.id}','${c.name}')" style="color:#65676b;font-size:12px;background:none;border:none;cursor:pointer;">رد</button>
                    </div>
                    <p style="margin:4px 0 0 0;color:#fff;">${c.text}</p>
                    <div id="popupReplies-${doc.id}" style="padding-right:20px;border-right:2px solid rgba(255,255,255,0.05);"></div>
                </div>
                `;
            });

            document.getElementById("allCommentsList").innerHTML = html;
        });
}

function addCommentPopup(postId) {
    let input = document.getElementById("commentInputPopup");
    let text = input.value.trim();

    if (!text) { return; }
    if (!auth.currentUser) { alert("يرجى تسجيل الدخول"); return; }

    let user = auth.currentUser;

    db.collection("users").doc(user.uid).get().then(function(doc) {
        let name = doc.data().name || doc.data().owner || "مستخدم";

        db.collection("posts").doc(postId).collection("comments").add({
            uid: user.uid,
            name: name,
            text: text,
            time: Date.now()
        }).then(function() {
            input.value = "";
            db.collection("posts").doc(postId).update({
                comments: firebase.firestore.FieldValue.increment(1)
            });
            loadAllCommentsList(postId);
            loadPosts(currentCategory);
        });
    });
}

// =============================================
// ===== الردود على التعليقات =====
// =============================================

function showReplyInputPopup(postId, commentId, userName) {
    let container = document.getElementById("popupReplies-" + commentId);
    if (!container) return;

    let existing = container.querySelector(".reply-input-area");
    if (existing) {
        existing.remove();
        return;
    }

    let replyHtml = `
    <div class="reply-input-area" style="display:flex;gap:6px;margin-top:6px;">
        <input type="text" id="replyInputPopup-${commentId}" placeholder="رد على ${userName}..." style="flex:1;padding:6px 12px;border:1px solid rgba(255,255,255,0.1);border-radius:50px;background:rgba(255,255,255,0.06);color:#fff;outline:none;font-size:13px;">
        <button onclick="submitReplyPopup('${postId}','${commentId}')" style="padding:6px 14px;background:linear-gradient(135deg,#FFD700,#f5a623);color:#111;border:none;border-radius:50px;font-weight:bold;font-size:12px;">رد</button>
        <button onclick="this.parentElement.remove()" style="padding:6px 10px;background:rgba(255,255,255,0.1);border:none;border-radius:50px;font-size:14px;color:#fff;">✕</button>
    </div>
    `;

    container.insertAdjacentHTML("beforeend", replyHtml);
    let input = document.getElementById("replyInputPopup-" + commentId);
    if (input) input.focus();
}

function submitReplyPopup(postId, commentId) {
    let input = document.getElementById("replyInputPopup-" + commentId);
    if (!input) return;

    let text = input.value.trim();
    if (!text) { return; }
    if (!auth.currentUser) { alert("يرجى تسجيل الدخول"); return; }

    let user = auth.currentUser;

    db.collection("users").doc(user.uid).get().then(function(doc) {
        let name = doc.data().name || doc.data().owner || "مستخدم";

        db.collection("posts").doc(postId).collection("comments")
            .doc(commentId)
            .update({
                replies: firebase.firestore.FieldValue.arrayUnion({
                    name: name,
                    text: text,
                    time: Date.now()
                })
            })
            .then(function() {
                let replyArea = input.closest(".reply-input-area");
                if (replyArea) replyArea.remove();

                // تحديث الردود في النافذة
                loadRepliesPopup(postId, commentId);
                loadPosts(currentCategory);
            });
    });
}

function loadRepliesPopup(postId, commentId) {
    db.collection("posts").doc(postId).collection("comments")
        .doc(commentId)
        .get()
        .then(function(doc) {
            if (!doc.exists) return;
            let data = doc.data();
            let replies = data.replies || [];

            let container = document.getElementById("popupReplies-" + commentId);
            if (!container) return;

            let html = "";
            replies.forEach(function(r) {
                html += `
                <div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">
                    <b style="color:#1877f2;font-size:13px;">${r.name}</b>
                    <span style="color:rgba(255,255,255,0.3);font-size:11px;">${getTimeText(r.time)}</span>
                    <p style="margin:2px 0 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${r.text}</p>
                </div>
                `;
            });

            container.innerHTML = html;
        });
}
// =============================================
// ===== دوال إضافية =====
// =============================================

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

// ===== الوقت =====
function getTimeText(timestamp) {
    if (!timestamp) return "الآن";
    let diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return Math.floor(diff / 60) + " دقيقة";
    if (diff < 86400) return Math.floor(diff / 3600) + " ساعة";
    if (diff < 604800) return Math.floor(diff / 86400) + " يوم";
    return new Date(timestamp).toLocaleDateString("ar");
}

// ===== تسجيل الخروج =====
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

// ===== إشعارات =====
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

// ===== Auth =====
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

// ===== بحث =====
window.onload = function() {
    let search = document.getElementById("search");
    if (search) {
        search.addEventListener("input", function() {
            currentCategory = "";
            loadPosts();
        });
    }
};