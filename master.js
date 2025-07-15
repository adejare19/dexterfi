import { app } from "./firebaseConfig.js";
import {
  getFirestore, doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth(app);
const db = getFirestore(app);

const MASTER_UID = "3Gs0qWZlqBhaOCaT1nqIVDTg9dr2";

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== MASTER_UID) {
    alert("Unauthorized access.");
    window.location.href = "./index.html";
    return;
  }

  const masterRef = doc(db, "users", MASTER_UID);
  const masterSnap = await getDoc(masterRef);
  const masterData = masterSnap.data();
  document.getElementById("masterBalance").textContent = `₦${masterData.balance.toLocaleString()}`;
});

document.getElementById("fundForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userUid = document.getElementById("userUid").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const fundStatus = document.getElementById("fundStatus");

  if (!userUid || isNaN(amount) || amount <= 0) {
    return (fundStatus.textContent = "Enter a valid UID and amount.");
  }

  const masterRef = doc(db, "users", MASTER_UID);
  const userRef = doc(db, "users", userUid);

  const masterSnap = await getDoc(masterRef);
  const masterBalance = masterSnap.data().balance;

  if (masterBalance < amount) {
    fundStatus.textContent = "Insufficient master account balance.";
    return;
  }

  try {
    await updateDoc(masterRef, { balance: increment(-amount) });
    await updateDoc(userRef, { balance: increment(amount) });

    // Log transactions
    await addDoc(collection(userRef, "transactions"), {
      type: "Credit",
      from: "Master Admin",
      amount,
      timestamp: serverTimestamp(),
      description: "Initial funding"
    });

    await addDoc(collection(masterRef, "transactions"), {
      type: "Debit",
      to: userUid,
      amount,
      timestamp: serverTimestamp(),
      description: `Funding to user ${userUid}`
    });

    fundStatus.textContent = `✅ ₦${amount.toLocaleString()} sent to ${userUid}`;
    document.getElementById("fundForm").reset();
  } catch (err) {
    fundStatus.textContent = "❌ Transfer failed. Check UID or try again.";
    console.error(err);
  }
});
