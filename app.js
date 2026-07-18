// ===== عرض نموذج النشر =====
function showForm() {
    document.getElementById("popup").style.display = "flex";
}

function closeForm() {
    document.getElementById("popup").style.display = "none";
}

// ===== إضافة منشور جديد =====
function addPost() {
    let product = document.getElementById("product").value.trim();
    let price = document.getElementById("price").value.trim();
    let description = document.getElementById("description").value.trim();
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
                image: imageUrl || "",
                likes: 0,
                favorites: 0,
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

// ===== تحميل المنشورات =====
function loadPosts() {
    let html = "";
    let search = document.getElementById("search").value.toLowerCase();

    db.collection("posts")
        .orderBy("time", "desc")
        .get()
        .then(function(snapshot) {
            if (snapshot.empty) {
                document.getElementById("posts").innerHTML =
                    `<div class="post"><div class="post-body"><p style="text-align:center;color:#888;padding:30px;">📭 لا توجد منشورات</p></div></div>`;
                return;
            }

            snapshot.forEach(function(doc) {
                let post = doc.data();
                let productText = post.product || "";

                if (
                    (post.factory && post.factory.toLowerCase().includes(search)) ||
                    productText.toLowerCase().includes(search) ||
                    (post.city && post.city.toLowerCase().includes(search))
                ) {
                    let diff = Math.floor((Date.now() - post.time) / 1000);
                    let timeText = "الآن";
                    if (diff >= 60) timeText = Math.floor(diff / 60) + " دقيقة";
                    if (diff >= 3600) timeText = Math.floor(diff / 3600) + " ساعة";
                    if (diff >= 86400) timeText = Math.floor(diff / 86400) + " يوم";

                    html += `
                    <div class="post" id="post-${doc.id}">
                        <div class="post-header">
                            <div class="post-left">
                                <img class="post-avatar" src="${post.profileImage || 'images/logo.png'}">
                                <div class="post-user-info">
                                    <div class="post-user-name">${post.owner || 'مستخدم'}</div>
                                    <div class="post-user-time">🕒 ${timeText}</div>
                                </div>
                            </div>
                            <div class="post-right">
                                <button class="menu-btn" onclick="toggleMenu('${doc.id}')">⋮</button>
                                <div class="menu-box" id="menu-${doc.id}" style="display:none;position:absolute;background:#fff;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.2);padding:8px;z-index:100;margin-top:30px;">
                                    ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                                        <button onclick="deletePost('${doc.id}','${post.uid}')" style="display:block;width:100%;padding:8px 16px;border:none;background:none;text-align:right;color:#d32f2f;font-size:14px;">🗑 حذف</button>
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
                                <button class="action-btn" onclick="likePost('${doc.id}',${post.likes || 0})">👍 أعجبني</button>
                                <button class="action-btn" onclick="openComments('${doc.id}')">💬 تعليق</button>
                                <button class="action-btn" onclick="sharePost('${post.product || ''}','${post.price || ''}')">↗️ مشاركة</button>
                            </div>
                        </div>
                    </div>`;
                }
            });

            document.getElementById("posts").innerHTML = html || `<div class="post"><div class="post-body"><p style="text-align:center;color:#888;padding:30px;">🔍 لا توجد نتائج</p></div></div>`;
        })
        .catch(function(err) {
            console.error("خطأ بتحميل المنشورات:", err);
            document.getElementById("posts").innerHTML =
                `<div class="post"><div class="post-body"><p style="text-align:center;color:#d32f2f;padding:30px;">❌ حدث خطأ أثناء تحميل المنشورات</p></div></div>`;
        });
}

// ===== إعجاب =====
function likePost(id, likes) {
    db.collection("posts").doc(id).update({
        likes: (likes || 0) + 1
    }).then(loadPosts).catch(() => {});
}

// ===== عرض الصورة =====
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

// ===== فتح التعليقات (زي فيسبوك بالضبط) =====
let currentReplyData = { postId: null, commentId: null, userName: null };

function openComments(postId) {
    // إخفاء أي نافذة مفتوحة
    let oldPopup = document.getElementById("commentPopup");
    if (oldPopup) oldPopup.remove();

    let commentBox = document.createElement("div");
    commentBox.className = "popup";
    commentBox.style.display = "flex";
    commentBox.id = "commentPopup";
    commentBox.innerHTML = `
        <div class="comments-container" style="width:92%;max-width:500px;background:#fff;border-radius:18px;padding:20px;max-height:85vh;display:flex;flex-direction:column;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:12px;">
                <h2 style="margin:0;font-size:20px;">💬 التعليقات</h2>
                <button onclick="this.closest('.popup').remove()" style="font-size:24px;background:none;border:none;cursor:pointer;">✕</button>
            </div>
            
            <!-- قائمة التعليقات -->
            <div id="commentsList" style="flex:1;overflow-y:auto;margin:15px 0;padding-left:5px;"></div>
            
            <!-- حقل كتابة التعليق -->
            <div style="border-top:1px solid #eee;padding-top:12px;">
                <div style="display:flex;gap:8px;">
                    <input type="text" id="commentInput" placeholder="اكتب تعليقاً..." style="flex:1;padding:12px;border:1px solid #ddd;border-radius:25px;outline:none;">
                    <button onclick="addComment('${postId}')" style="padding:12px 20px;background:#1877f2;color:#fff;border:none;border-radius:25px;font-weight:bold;">نشر</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(commentBox);

    // تحميل التعليقات
    loadComments(postId);
}

// ===== تحميل التعليقات مع الردود (زي فيسبوك) =====
function loadComments(postId) {
    db.collection("posts").doc(postId).collection("comments")
        .orderBy("time", "desc")
        .get()
        .then(function(snapshot) {
            let html = "";

            if (snapshot.empty) {
                document.getElementById("commentsList").innerHTML = 
                    `<p style="text-align:center;color:#888;padding:30px;">💬 لا توجد تعليقات، كن أول من يعلق!</p>`;
                return;
            }

            snapshot.forEach(function(doc) {
                let c = doc.data();
                let commentId = doc.id;
                let timeText = getTimeText(c.time);

                // بناء الردود
                let repliesHtml = "";
                if (c.replies && c.replies.length > 0) {
                    repliesHtml = `
                    <div style="padding-right:20px;border-right:2px solid #e4e6eb;margin-top:8px;">
                        ${c.replies.map((r, index) => `
                            <div style="padding:8px 0;border-bottom:${index < c.replies.length - 1 ? '1px solid #f0f2f5' : 'none'};">
                                <div style="display:flex;align-items:center;gap:6px;">
                                    <b style="color:#1877f2;font-size:14px;">${r.name || 'مستخدم'}</b>
                                    <span style="color:#888;font-size:11px;">${getTimeText(r.time)}</span>
                                </div>
                                <p style="margin:4px 0 0 0;font-size:14px;color:#111;">${r.text}</p>
                            </div>
                        `).join('')}
                    </div>
                    `;
                }

                html += `
                <div style="border-bottom:1px solid #f0f2f5;padding:12px 0;" id="comment-${commentId}">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                                <b style="color:#111;font-size:15px;">${c.name || 'مستخدم'}</b>
                                <span style="color:#888;font-size:12px;">${timeText}</span>
                            </div>
                            <p style="margin:6px 0 8px 0;font-size:15px;color:#111;">${c.text}</p>
                            <button onclick="showReply('${postId}','${commentId}','${c.name}')" style="color:#65676b;font-size:13px;background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:4px;">
                                رد
                            </button>
                        </div>
                    </div>
                    ${repliesHtml}
                </div>
                `;
            });

            document.getElementById("commentsList").innerHTML = html;
        });
}

// ===== عرض الوقت =====
function getTimeText(timestamp) {
    if (!timestamp) return "الآن";
    let diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return Math.floor(diff / 60) + " دقيقة";
    if (diff < 86400) return Math.floor(diff / 3600) + " ساعة";
    if (diff < 604800) return Math.floor(diff / 86400) + " يوم";
    return new Date(timestamp).toLocaleDateString("ar");
}

// ===== إظهار مربع الرد =====
function showReply(postId, commentId, userName) {
    // نبحث عن مكان الرد داخل التعليق
    let commentDiv = document.getElementById("comment-" + commentId);
    if (!commentDiv) return;

    // إذا كان فيه مربع رد مفتوح نغلقه
    let existingReply = commentDiv.querySelector(".reply-input-area");
    if (existingReply) {
        existingReply.remove();
        return;
    }

    let replyHtml = `
    <div class="reply-input-area" style="display:flex;gap:8px;margin-top:8px;padding-right:20px;">
        <input type="text" id="replyInput-${commentId}" placeholder="اكتب رداً على ${userName}..." style="flex:1;padding:10px 16px;border:1px solid #ddd;border-radius:25px;outline:none;font-size:14px;">
        <button onclick="submitReply('${postId}','${commentId}')" style="padding:10px 18px;background:#f9a825;color:#111;border:none;border-radius:25px;font-weight:bold;font-size:14px;">رد</button>
        <button onclick="this.parentElement.remove()" style="padding:10px 14px;background:#e4e6eb;border:none;border-radius:25px;font-size:16px;">✕</button>
    </div>
    `;

    commentDiv.insertAdjacentHTML("beforeend", replyHtml);

    // تركيز على حقل الإدخال
    let input = document.getElementById("replyInput-" + commentId);
    if (input) input.focus();
}

// ===== إرسال رد =====
function submitReply(postId, commentId) {
    let input = document.getElementById("replyInput-" + commentId);
    if (!input) return;

    let text = input.value.trim();
    if (!text) {
        alert("اكتب ردك أولاً");
        return;
    }

    let user = auth.currentUser;
    if (!user) {
        alert("يرجى تسجيل الدخول");
        return;
    }

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
                // حذف مربع الرد
                let replyArea = input.closest(".reply-input-area");
                if (replyArea) replyArea.remove();

                // إعادة تحميل التعليقات
                loadComments(postId);
            })
            .catch(function(err) {
                alert("فشل الرد: " + err.message);
            });
    });
}

// ===== إضافة تعليق جديد =====
function addComment(postId) {
    let input = document.getElementById("commentInput");
    let text = input.value.trim();

    if (!text) {
        alert("اكتب تعليقاً");
        return;
    }

    let user = auth.currentUser;
    if (!user) {
        alert("يرجى تسجيل الدخول");
        return;
    }

    db.collection("users").doc(user.uid).get().then(function(doc) {
        let name = doc.data().name || doc.data().owner || "مستخدم";

        db.collection("posts").doc(postId).collection("comments").add({
            uid: user.uid,
            name: name,
            text: text,
            time: Date.now()
        })
        .then(function() {
            input.value = "";

            // تحديث عدد التعليقات في المنشور
            db.collection("posts").doc(postId).update({
                comments: firebase.firestore.FieldValue.increment(1)
            });

            // إعادة تحميل التعليقات
            loadComments(postId);
        })
        .catch(function(err) {
            alert("فشل النشر: " + err.message);
        });
    });
}

// ===== مشاركة =====
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

// ===== قائمة الخيارات =====
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

// ===== حذف منشور =====
function deletePost(postId, ownerId) {
    if (!auth.currentUser) return;
    if (auth.currentUser.uid !== ownerId) {
        alert("❌ لا يمكنك حذف هذا المنشور");
        return;
    }
    if (!confirm("هل تريد حذف المنشور؟")) return;
    db.collection("posts").doc(postId).delete()
        .then(function() {
            loadPosts();
        })
        .catch(function(err) {
            alert("فشل الحذف: " + err.message);
        });
}

// ===== إظهار/إخفاء حقول المنتج =====
function toggleProductFields() {
    let box = document.getElementById("productFields");
    box.style.display = (box.style.display === "none" || box.style.display === "") ? "block" : "none";
}

// ===== تحميل بيانات المستخدم في نموذج النشر =====
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
        search.addEventListener("keyup", loadPosts);
    }
};