auth.onAuthStateChanged(function(user){

if(!user){

window.location="login.html";
return;

}

db.collection("users").doc(user.uid).get()

.then(function(doc){

if(doc.exists){

let data=doc.data();
document.getElementById("editFactory").value=data.factory||"";

document.getElementById("editPhone").value=data.phone||"";

document.getElementById("editCity").value=data.city||"";
document.getElementById("userName").innerHTML=data.name||"";

document.getElementById("factoryName").innerHTML="🏭 "+(data.factory||"لا يوجد");

document.getElementById("userPhone").innerHTML="📞 "+(data.phone||"");

document.getElementById("userCity").innerHTML="📍 "+(data.city||"");

if(data.image){

document.getElementById("profileImage").src=data.image;

document.getElementById("publishProfileImage")?.setAttribute("src",data.image);

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
function saveProfile(){

let user=auth.currentUser;

if(!user){
return;
}

let factory=document.getElementById("editFactory").value.trim();
let phone=document.getElementById("editPhone").value.trim();
let city=document.getElementById("editCity").value.trim();

db.collection("users").doc(user.uid).set({

factory:factory,
phone:phone,
city:city

},{merge:true})

.then(function(){

alert("تم حفظ البيانات");

location.reload();

})

.catch(function(){

alert("حدث خطأ أثناء الحفظ");

});

}
document.getElementById("profileUpload").addEventListener("change",function(){

let file=this.files[0];

if(!file) return;

let formData=new FormData();

formData.append("image",file);

fetch("https://api.imgbb.com/1/upload?key=b7c1924307a10aed4942a02aff73e3cb",{

method:"POST",

body:formData

})

.then(r=>r.json())

.then(data=>{

if(data.success){

let url=data.data.url;

document.getElementById("profileImage").src=url;

db.collection("users").doc(auth.currentUser.uid).set({

image:url

},{merge:true});

alert("تم تغيير الصورة");

}

});

});