auth.onAuthStateChanged(function(user){

if(!user){

window.location="login.html";
return;

}

db.collection("users").doc(user.uid).get()

.then(function(doc){

if(doc.exists){

let data=doc.data();

document.getElementById("userName").innerHTML=data.name||"";

document.getElementById("factoryName").innerHTML="🏭 "+(data.factory||"لا يوجد");

document.getElementById("userPhone").innerHTML="📞 "+(data.phone||"");

document.getElementById("userCity").innerHTML="📍 "+(data.city||"");

document.getElementById("userBirth").innerHTML="🎂 "+(data.birth||"");

if(data.image){

document.getElementById("profileImage").src=data.image;

}

}

});

loadMyPosts(user.uid);

});

function loadMyPosts(uid){

let html="";

db.collection("posts")
.where("uid","==",uid)
.orderBy("time","desc")
.get()
.then(function(snapshot){

snapshot.forEach(function(doc){

let post=doc.data();

html+=`

<div class="post">

${post.image?`<img src="${post.image}">`:""}

<div class="post-info">

<h3>🏭 ${post.factory}</h3>

<h2>${post.product}</h2>

<p>${post.description}</p>

<h3>${post.price} د.ع</h3>

</div>

</div>

`;

});

if(html==""){

html="<p style='text-align:center;padding:20px'>لا توجد منشورات بعد</p>";

}

document.getElementById("myPosts").innerHTML=html;

});

}

function editProfile(){

alert("ميزة تعديل الملف الشخصي سنضيفها بالخطوة القادمة");

}