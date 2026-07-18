const firebaseConfig = {
  apiKey: "AIzaSyCn9igHD_YeFz1n3yFpzAqrXV6GoimpVsQ",
  authDomain: "nafitha-26a37.firebaseapp.com",
  projectId: "nafitha-26a37",
  storageBucket: "nafitha-26a37.firebasestorage.app",
  messagingSenderId: "551325547816",
  appId: "1:551325547816:web:d9aea49a1262f9af9ee41d"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();