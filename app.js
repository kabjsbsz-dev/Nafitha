function showForm(){
document.getElementById("popup").style.display="flex";
}

function closeForm(){
document.getElementById("popup").style.display="none";
}

function addPost(){

let factory=document.getElementById("factory").value.trim();
let owner=document.getElementById("owner").value.trim();
let product=document.getElementById("product").value.trim();
let price=document.getElementById("price").value.trim();
let phone=document.getElementById("phone").value.trim();
let city=document.getElementById("city").value.trim();
let location=document.getElementById("location").value.trim();
let description=document.getElementById("description").value.trim();
let image=document.getElementById("image").files[0];

if(factory==""||owner==""||product==""){

alert("املأ جميع الحقول المطلوبة");

return;

}

let uid=auth.currentUser.uid;

if(image){

let formData = new FormData();
formData.append("image", image);

fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb",{
method:"POST",
body:formData
})
.then(response => response.json())
.then(data => {

if(data.success){

savePost(data.data.url);

}else{

alert("فشل رفع الصورة");

}

})
.catch(error => {

console.log(error);
alert("خطأ في رفع الصورة");

});

}else{

savePost("");

}


function savePost(imageUrl){

db.collection("posts").add({

uid:uid,

factory:factory,

owner:owner,

product:product,

price:price,

phone:phone,

city:city,

location:location,

description:description,

image:imageUrl,

likes:0,

favorites:0,

views:0,

time:Date.now()

})

.then(function(){

alert("تم نشر المنشور");

document.getElementById("factory").value="";
document.getElementById("owner").value="";
document.getElementById("product").value="";
document.getElementById("price").value="";
document.getElementById("phone").value="";
document.getElementById("city").value="";
document.getElementById("location").value="";
document.getElementById("description").value="";
document.getElementById("image").value="";

closeForm();
loadPosts();

})
.catch(function(error){

console.log(error);
alert("فشل نشر المنشور");

});

}

}

function loadPosts(){

let html="";

let search=document.getElementById("search").value.toLowerCase();

db.collection("posts")
.orderBy("time","desc")
.get()
.then(function(snapshot){

snapshot.forEach(function(doc){

let post=doc.data();

let postDate = new Date(post.time);
let now = new Date();

let diff = Math.floor((now - postDate) / 1000);

let timeText = "الآن";

if(diff >= 60){
timeText = Math.floor(diff/60) + " دقيقة";
}

if(diff >= 3600){
timeText = Math.floor(diff/3600) + " ساعة";
}

if(diff >= 86400){
timeText = Math.floor(diff/86400) + " يوم";
}
db.collection("posts").doc(doc.id).update({
views:(post.views||0)+1
});
if(
post.factory.toLowerCase().includes(search)||
post.product.toLowerCase().includes(search)||
post.city.toLowerCase().includes(search)
){

html+=`

<div class="post">

${post.image?`<img src="${post.image}" class="post-image" onclick="openImage('${post.image}')">`:""}

<div class="post-info">

<h3>🏭 ${post.factory}</h3>

<p>👤 ${post.owner}</p>

<p style="color:#999;font-size:13px;">
🕒 ${timeText}
</p>

<p>📍 ${post.city}</p>

<h2>${post.product}</h2>

<p>${post.description}</p>

<h3>${post.price} د.ع</h3>

<p>👁️ ${post.views||0} مشاهدة</p>
</div>

<div class="post-actions">

<button onclick="likePost('${doc.id}',${post.likes||0})">
❤️ ${post.likes||0}
</button>

<button onclick="openComments('${doc.id}')">
💬 تعليق
</button>

<button onclick="favoritePost('${doc.id}',${post.favorites||0})">
⭐
</button>

<button onclick="window.location.href='tel:${post.phone}'">
📞
</button>

<button onclick="window.open('https://wa.me/${post.phone}')">
واتساب
<button onclick="sharePost('${post.product}','${post.price}')">
📤
</button>
</button>

</div>

</div>

`;

}

});

document.getElementById("posts").innerHTML=html;

});

}

function likePost(id,likes){

db.collection("posts").doc(id).update({

likes:likes+1

}).then(function(){

loadPosts();

});

}

function favoritePost(id,favorites){

db.collection("posts").doc(id).update({

favorites:(favorites||0)+1

}).then(function(){

alert("تمت الإضافة إلى المفضلة");

});

}

auth.onAuthStateChanged(function(user){

if(!user){

window.location="login.html";

return;

}

loadPosts();

});

window.onload=function(){

if(document.getElementById("search")){

document.getElementById("search").addEventListener("keyup",loadPosts);

}

};

function openImage(src){

let viewer=document.createElement("div");
viewer.className="image-viewer";

viewer.innerHTML=`
<span class="close-viewer">&times;</span>

<img src="${src}" id="zoomImage">

<a href="${src}" download class="download-btn">
تحميل الصورة
</a>
`;

document.body.appendChild(viewer);

viewer.querySelector(".close-viewer").onclick=function(){
viewer.remove();
};

viewer.onclick=function(e){
if(e.target===viewer){
viewer.remove();
}
};

}

function openImage(src){

let viewer=document.createElement("div");

viewer.className="image-viewer";

viewer.innerHTML=`
<span class="close-viewer">&times;</span>
<img src="${src}" class="viewer-img">
<a href="${src}" download class="download-btn">
تحميل الصورة
</a>
`;

document.body.appendChild(viewer);

viewer.querySelector(".close-viewer").onclick=function(){
viewer.remove();
};

viewer.onclick=function(e){
if(e.target===viewer){
viewer.remove();
}
};

}
function openComments(postId){

function sharePost(product,price){

if(navigator.share){

navigator.share({
title:"نافذة",
text:product+" - "+price+" د.ع"
});

}else{

alert("المشاركة غير مدعومة على هذا الجهاز");

}

}
alert("ميزة التعليقات سنضيفها بالخطوة القادمة.");

}