  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  
  const firebaseConfig = {
    apiKey: "AIzaSyCqyFebtyv2uvPpmOldN_2OvQCg4alr4IE",
    authDomain: "kuda-a6d33.firebaseapp.com",
    projectId: "kuda-a6d33",
    storageBucket: "kuda-a6d33.firebasestorage.app",
    messagingSenderId: "273234716892",
    appId: "1:273234716892:web:9b8ab5c79f0f40422d6c19",
    measurementId: "G-C5N5X7JS51"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);


  export{
    app
  }