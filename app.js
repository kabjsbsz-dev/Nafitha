function showForm(){
document.getElementById("popup").style.display="flex";
}

function closeForm(){
document.getElementById("popup").style.display="none";
}

function addPost(){

let factory="";
let owner="";
let product=document.getElementById("product").value.trim();
let price=document.getElementById("price").value.trim();
let phone="";
let city="";
let location="";
let description=document.getElementById("description").value.trim();
let image=document.getElementById("image").files[0];

if(product=="" && description==""){
alert("املأ جميع الحقول المطلوبة");
return;
}

let uid=auth.currentUser.uid;

if(image){

let formData=new FormData();
formData.append("image",image);

fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb",{
method:"POST",
body:formData
})

.then(r=>r.json())

.then(data=>{

if(data.success){

savePost(data.data.url);

}else{

alert("فشل رفع الصورة");

}

})

.catch(()=>{

alert("حدث خطأ أثناء رفع الصورة");

});

}else{

savePost("");

}

function savePost(imageUrl){

db.collection("posts").add({

uid:uid,
profileImage:document.getElementById("publishProfileImage").src,
factory:factory,
owner:document.getElementById("publishUserName").innerText,
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
comments:0,
time:Date.now()

})

.then(()=>{

closeForm();

loadPosts();

})

.catch(()=>{

alert("فشل النشر");

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

if(
post.factory.toLowerCase().includes(search)||
post.product.toLowerCase().includes(search)||
post.city.toLowerCase().includes(search)
){
  let diff=Math.floor((Date.now()-post.time)/1000);

let timeText="الآن";

if(diff>=60) timeText=Math.floor(diff/60)+" دقيقة";
if(diff>=3600) timeText=Math.floor(diff/3600)+" ساعة";
if(diff>=86400) timeText=Math.floor(diff/86400)+" يوم";

html+=`

<div class="post">

<div class="post-header">

<div class="post-left">

<img class="post-avatar"
src="images/logo.png">

<div class="post-user-info">

<div class="post-user-name">
${post.owner}
</div>

<div class="post-user-time">
🕒 ${timeText}
</div>

</div>

</div>

<div class="post-right">

<button class="menu-btn"
onclick="toggleMenu('${doc.id}')">
⋮
</button>

</div>

</div>

<div class="post-body">

<div class="post-title">
🏭 ${post.factory}
</div>

<div class="post-product">
${post.product}
</div>

<div class="post-description">
${post.description}
</div>

<div class="post-price">
${post.price} د.ع
</div>
${post.image ? `
<img
src="${post.image}"
class="post-image"
onclick="openImage('${post.image}')">
` : ""}

<div class="post-stats">

<span>
👁️ ${post.views||0} مشاهدة
</span>

<span>
💬 ${post.comments||0} تعليق
</span>

</div>

<div class="post-actions">
<button class="action-btn"
onclick="likePost('${doc.id}',${post.likes||0})">
👍
<span>أعجبني</span>
</button>

<button class="action-btn"
onclick="openComments('${doc.id}')">
💬
<span>تعليق</span>
</button>

<button class="action-btn"
onclick="sharePost('${post.product}','${post.price}')">
↗️
<span>مشاركة</span>
</button>

<button class="action-btn"
onclick="favoritePost('${doc.id}',${post.favorites||0})">
🔖
<span>حفظ</span>
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

likes:(likes||0)+1

}).then(loadPosts);

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

let search=document.getElementById("search");

if(search){

search.addEventListener("keyup",loadPosts);

}

};
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

alert("سيتم إضافة التعليقات قريبًا");

}

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

function toggleMenu(id){

let menu=document.getElementById("menu-"+id);

if(menu){

if(menu.style.display=="block"){

menu.style.display="none";

}else{

document.querySelectorAll(".menu-box").forEach(function(item){

item.style.display="none";

});

menu.style.display="block";

}

}

}

function deletePost(postId,ownerId){

if(!auth.currentUser) return;

if(auth.currentUser.uid!==ownerId){

alert("لا يمكنك حذف هذا المنشور");

return;

}

if(!confirm("هل تريد حذف المنشور؟")) return;

db.collection("posts").doc(postId).delete()

.then(function(){

loadPosts();

});

}
function toggleProductFields(){

let box=document.getElementById("productFields");

if(box.style.display=="none" || box.style.display==""){

box.style.display="block";

}else{

box.style.display="none";

}

}

auth.onAuthStateChanged(function(user){

if(!user) return;

db.collection("users").doc(user.uid).get()

.then(function(doc){

if(doc.exists){

let data=doc.data();

if(document.getElementById("publishUserName")){

document.getElementById("publishUserName").innerText=data.name||data.owner||"مستخدم";

}

if(document.getElementById("publishProfileImage")){

document.getElementById("publishProfileImage").src=data.photo||"images/logo.png";

}

}

});

});