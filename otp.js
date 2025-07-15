import { app } from "./firebaseConfig.js";
import {
  getAuth,
  onAuthStateChanged,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth(app);

document.getElementById("verifyBtn").addEventListener("click", () => {
  const user = auth.currentUser;

  if (user) {
  user.reload().then(() => {
    if (user.emailVerified) {
      window.location.href = "./details.html"; 
    } else {
      alert("Your email is not verified yet.");
    }
  });

  } else {
    alert("No user signed in. Please log in again.");
  }
});
