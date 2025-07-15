import { app } from "./firebaseConfig.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth(app);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user.emailVerified) {
      if (user.uid === "3Gs0qWZlqBhaOCaT1nqIVDTg9dr2") {
        window.location.href = "./admin.html";
      } else {
        window.location.href = "./dashboard.html";
      }

    } else {
      alert("Please verify your email before continuing.");
    }

  } catch (error) {
    alert("Login failed: " + error.message);
  }
});
