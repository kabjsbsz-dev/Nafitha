// =============================================
// ===== chat.js - صفحة الدردشة =====
// =============================================

let otherUid = null;
let conversationId = null;

auth.onAuthStateChanged(function(user) {
    if (!user) {
        window.location = "login.html";
        return;
    }

    let urlParams = new URLSearchParams(window.location.search);
    otherUid = urlParams.get("uid");

    if (!otherUid) {
        window.location = "messages.html";
        return;
    }

    loadChatUser();
    getOrCreateConversation();
});

function loadChatUser() {
    db.collection("users").doc(otherUid).get()
        .then(function(doc) {
            if (!doc.exists) return;
            let data = doc.data();
            document.getElementById("chatUserName").innerText = data.name || "مستخدم";
            if (data.image || data.profileImage) {
                document.getElementById("chatUserImg").src = data.image || data.profileImage;
            }
        })
        .catch(function(err) {
            console.error("خطأ:", err);
        });
}

function getOrCreateConversation() {
    let uid = auth.currentUser.uid;

    db.collection("conversations")
        .where("participants", "array-contains", uid)
        .get()
        .then(function(snapshot) {
            let found = false;
            snapshot.forEach(function(doc) {
                let conv = doc.data();
                if (conv.participants.includes(otherUid)) {
                    conversationId = doc.id;
                    found = true;
                    loadMessages(conversationId);
                }
            });

            if (!found) {
                db.collection("conversations").add({
                    participants: [uid, otherUid],
                    lastMessage: "",
                    lastTime: Date.now()
                })
                .then(function(docRef) {
                    conversationId = docRef.id;
                    loadMessages(conversationId);
                })
                .catch(function(err) {
                    console.error("خطأ في إنشاء المحادثة:", err);
                });
            }
        })
        .catch(function(err) {
            console.error("خطأ:", err);
        });
}

function loadMessages(convId) {
    document.getElementById("chatMessages").innerHTML = 
        `<div class="chat-empty-msg">⏳ جاري التحميل...</div>`;

    db.collection("conversations")
        .doc(convId)
        .collection("messages")
        .orderBy("time", "asc")
        .onSnapshot(function(snapshot) {
            let html = "";
            if (snapshot.empty) {
                html = `<div class="chat-empty-msg">💬 لا توجد رسائل، ابدأ المحادثة</div>`;
                document.getElementById("chatMessages").innerHTML = html;
                return;
            }

            let uid = auth.currentUser.uid;
            snapshot.forEach(function(doc) {
                let msg = doc.data();
                let isSent = msg.sender === uid;
                let timeText = new Date(msg.time).toLocaleTimeString("ar");

                html += `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    ${msg.text}
                    <span class="msg-time">${timeText}</span>
                </div>
                `;
            });

            document.getElementById("chatMessages").innerHTML = html;
            let container = document.getElementById("chatMessages");
            container.scrollTop = container.scrollHeight;
        });
}

function sendMessage() {
    let input = document.getElementById("msgInput");
    let text = input.value.trim();

    if (!text) return;
    if (!conversationId) {
        alert("جاري تجهيز المحادثة...");
        return;
    }

    let uid = auth.currentUser.uid;

    db.collection("conversations")
        .doc(conversationId)
        .collection("messages")
        .add({
            sender: uid,
            text: text,
            time: Date.now()
        })
        .then(function() {
            db.collection("conversations")
                .doc(conversationId)
                .update({
                    lastMessage: text,
                    lastTime: Date.now()
                })
                .catch(function(err) {
                    console.error("خطأ في تحديث آخر رسالة:", err);
                });

            input.value = "";
        })
        .catch(function(err) {
            console.error("خطأ في إرسال الرسالة:", err);
            alert("فشل إرسال الرسالة");
        });
}