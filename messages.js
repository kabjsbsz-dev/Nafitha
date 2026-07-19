// =============================================
// ===== messages.js - صفحة المحادثات =====
// =============================================

auth.onAuthStateChanged(function(user) {
    if (!user) {
        window.location = "login.html";
        return;
    }
    loadConversations();
});

function loadConversations() {
    let uid = auth.currentUser.uid;

    db.collection("conversations")
        .where("participants", "array-contains", uid)
        .orderBy("lastTime", "desc")
        .get()
        .then(function(snapshot) {
            let html = "";
            if (snapshot.empty) {
                html = `
                <div class="chat-empty">
                    <span>💬</span>
                    لا توجد محادثات<br>
                    <span style="font-size:14px;">ابحث عن مستخدم وابدأ محادثة</span>
                </div>`;
                document.getElementById("chatList").innerHTML = html;
                return;
            }

            let conversations = [];
            snapshot.forEach(function(doc) {
                let conv = doc.data();
                conv.id = doc.id;
                conversations.push(conv);
            });

            let loaded = 0;
            conversations.forEach(function(conv) {
                let otherUid = conv.participants.find(function(p) { return p !== uid; });

                db.collection("users").doc(otherUid).get()
                    .then(function(userDoc) {
                        if (!userDoc.exists) return;
                        let user = userDoc.data();
                        let name = user.name || "مستخدم";
                        let image = user.image || user.profileImage || "images/logo.png";
                        let lastMsg = conv.lastMessage || "ابدأ المحادثة";
                        let timeText = conv.lastTime ? getTimeText(conv.lastTime) : "";

                        html += `
                        <div class="chat-item" onclick="openChat('${otherUid}')">
                            <img src="${image}" onerror="this.src='images/logo.png'">
                            <div class="chat-info">
                                <div class="chat-name">${name}</div>
                                <div class="chat-last">${lastMsg}</div>
                            </div>
                            <div class="chat-time">${timeText}</div>
                        </div>
                        `;

                        loaded++;
                        if (loaded === conversations.length) {
                            document.getElementById("chatList").innerHTML = html;
                        }
                    });
            });
        })
        .catch(function(err) {
            console.error("خطأ:", err);
        });
}

function getTimeText(timestamp) {
    if (!timestamp) return "";
    let diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return Math.floor(diff / 60) + " د";
    if (diff < 86400) return Math.floor(diff / 3600) + " س";
    return new Date(timestamp).toLocaleDateString("ar");
}

function openChat(otherUid) {
    window.location.href = "chat.html?uid=" + otherUid;
}