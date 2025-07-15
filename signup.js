import { app } from "./firebaseConfig.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth(app);
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const username = document.getElementById("signupUsername").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    
    await sendEmailVerification(user);
    alert("A verification email has been sent. Please verify before continuing.");

  
    window.location.href = "./verify-email.html";

  } catch (error) {
    alert(error.message);
  }
});
