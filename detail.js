import { app } from "./firebaseConfig.js";
import {
    getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("detailsForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("User not logged in");

    const uid = user.uid;
    const fname = document.getElementById("fname").value;
    const lname = document.getElementById("lname").value;
    const otherNames = document.getElementById("others").value;
    const phone = document.getElementById("phoneNumber").value;
    const address = document.getElementById("address").value;

    const accountNumber = "100" + Math.floor(100000 + Math.random() * 1100000);

    try {
        await setDoc(doc(db, "users", uid), {
            fname,
            lname,
            otherNames,
            phone,
            address,
            email: user.email,
            accountNumber
        });
        
        

        window.location.href = "./dashboard.html";
    } catch (err) {
        alert("Error saving details: " + err.message);
    }
});
