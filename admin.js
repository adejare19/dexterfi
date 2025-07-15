import { app } from "./firebaseConfig.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  increment,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Admin UID (master)
const masterUID = "3Gs0qWZlqBhaOCaT1nqIVDTg9dr2";
const db = getFirestore(app);
const masterRef = doc(db, "users", masterUID);

// 🔁 Realtime balance update
onSnapshot(masterRef, (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("masterBalance").textContent = `₦${data.balance.toLocaleString()}`;
  }
});

// 🔁 Realtime transaction history
const txRef = collection(masterRef, "transactions");
const txQuery = query(txRef, orderBy("timestamp", "desc"));

onSnapshot(txQuery, (snapshot) => {
  const txList = document.getElementById("txList");
  txList.innerHTML = "";

  snapshot.forEach((doc) => {
    const tx = doc.data();
    const date = tx.timestamp?.toDate().toLocaleDateString() || "";
    const time = tx.timestamp?.toDate().toLocaleTimeString() || "";
    const label = tx.type === "Credit" ? "from" : "to";
    const name = tx.from || tx.to;
    const sign = tx.type === "Credit" ? "+" : "-";
    const color = tx.type === "Credit" ? "text-success" : "text-danger";

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <div>
        <div class="fw-bold">${sign}₦${tx.amount.toLocaleString()} <span class="${color}">(${tx.type})</span></div>
        <small>${label}: ${name} — ${tx.description}</small><br>
        <small>${date} ${time}</small>
      </div>
    `;
    txList.appendChild(li);
  });
});

// ✅ Transfer logic
document.getElementById("masterTransferForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const recipientAcct = document.getElementById("recipientAcct").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description").value.trim();

  if (!recipientAcct || isNaN(amount) || amount <= 0 || !description) {
    return alert("Fill all fields correctly.");
  }

  const senderSnap = await getDoc(masterRef);
  const senderData = senderSnap.data();

  if (senderData.balance < amount) {
    return alert("Insufficient funds.");
  }

  // 🔍 Look up recipient by account number
  const q = query(collection(db, "users"), where("accountNumber", "==", recipientAcct));
  const recipientSnap = await getDocs(q);

  if (recipientSnap.empty) return alert("Recipient not found.");
  const recipientDoc = recipientSnap.docs[0];
  const recipientRef = doc(db, "users", recipientDoc.id);
  const recipientData = recipientDoc.data();

  // 💸 Update balances
  await updateDoc(masterRef, { balance: increment(-amount) });
  await updateDoc(recipientRef, { balance: increment(amount) });

  // 🧾 Log transactions
  await addDoc(collection(masterRef, "transactions"), {
    type: "Debit",
    to: `${recipientData.fname} ${recipientData.lname || ""}`,
    amount,
    timestamp: serverTimestamp(),
    description: `Transfer to ${recipientData.accountNumber}: ${description}`,
  });

  await addDoc(collection(recipientRef, "transactions"), {
    type: "Credit",
    from: "Admin",
    amount,
    timestamp: serverTimestamp(),
    description: `Transfer from Admin: ${description}`,
  });

  // ✅ UI feedback
  showToast(`Sent ₦${amount.toLocaleString()} to ${recipientData.fname}`);
  e.target.reset();
});

// ✅ Toast logic
window.showToast = (msg) => {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMessage");
  toastMsg.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
};
