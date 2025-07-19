import { app } from "./firebaseConfig.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  updateDoc,
  addDoc,
  increment,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    

    // Listen for profile updates
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById("displayName").textContent = `Hi, ${data.fname}`;
        document.getElementById("acctNumber").textContent = data.accountNumber;
        document.getElementById("accountBalance").textContent = `₦${data.balance.toLocaleString()}`;
      }
    });

   
  const txRef = collection(docRef, "transactions");
  onSnapshot(txRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const tx = change.doc.data();
      if (change.type === "added" && tx.type === "Credit") {
        showToast(`💰 You received ₦${tx.amount.toLocaleString()} from ${tx.from}`);
      }
    });
  });

    // Transaction history
    const transactionsRef = collection(db, "users", user.uid, "transactions");
    const q = query(transactionsRef, orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
      const tableBody = document.getElementById("transactionsTableBody");
      tableBody.innerHTML = "";
      snapshot.forEach((doc) => {
        const tx = doc.data();
        const date = tx.timestamp?.toDate().toLocaleDateString() || "";
        const time = tx.timestamp?.toDate().toLocaleTimeString() || "";
        const method = tx.type === "Credit" ? "Credit" : "Debit";
        const person = tx.type === "Credit" ? tx.from : tx.to;
        const color = tx.type === "Credit" ? "text-success" : "text-danger";
        const amountSign = tx.type === "Credit" ? "+" : "-";

        const row = `
          <tr>
            <td>${person || "-"}</td>
            <td>${method}</td>
            <td>${date}</td>
            <td>${time}</td>
            <td>${tx.description || "-"}</td>
            <td class="${color}">${amountSign}₦${tx.amount.toLocaleString()}</td>
          </tr>`;

        tableBody.innerHTML += row;
      });
    });

  } else {
    window.location.href = "./signin.html";
  }
});

// Recipient lookup
const acctInput = document.getElementById("recipientAcct");
const nameResult = document.getElementById("acctNameResult");
const loader = document.getElementById("acctNameLoader");

acctInput.addEventListener("blur", async () => {
  const acctNum = acctInput.value.trim();
  if (!acctNum) return;

  loader.style.display = "block";
  nameResult.textContent = "";

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("accountNumber", "==", acctNum));
    const snapshot = await getDocs(q);

    loader.style.display = "none";

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      nameResult.textContent = `Account Name: ${userData.fname} ${userData.otherNames || ""} ${userData.lname}`;
      nameResult.dataset.uid = snapshot.docs[0].id;
    } else {
      nameResult.textContent = "Account not found";
      delete nameResult.dataset.uid;
    }
  } catch (error) {
    loader.style.display = "none";
    nameResult.textContent = "Error looking up account.";
  }
});

// Transfer form submit
const transferForm = document.getElementById("transferForm");
transferForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const recipientAcct = document.getElementById("recipientAcct").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const description = document.getElementById("description")?.value || "Fund transfer";

  if (!recipientAcct || isNaN(amount) || amount <= 0) {
    return alert("Enter valid account and amount");
  }

  const sender = auth.currentUser;
  if (!sender) return;

  const senderRef = doc(db, "users", sender.uid);
  const senderSnap = await getDoc(senderRef);
  const senderData = senderSnap.data();

  if (senderData.accountNumber === recipientAcct) {
    return alert("You cannot transfer to yourself.");
  }

  const q = query(collection(db, "users"), where("accountNumber", "==", recipientAcct));
  const recipientSnap = await getDocs(q);
  if (recipientSnap.empty) return alert("Recipient not found.");

  const recipientDoc = recipientSnap.docs[0];
  const recipientData = recipientDoc.data();
  const recipientRef = doc(db, "users", recipientDoc.id);

  if (senderData.balance < amount) return alert("Insufficient balance.");

  await updateDoc(senderRef, { balance: increment(-amount) });
  await updateDoc(recipientRef, { balance: increment(amount) });

  await addDoc(collection(senderRef, "transactions"), {
    type: "Debit",
    to: recipientData.fname + " " + recipientData.lname,
    amount,
    timestamp: serverTimestamp(),
    description: description || `Transfer to ${recipientData.accountNumber}`
  });

  await addDoc(collection(recipientRef, "transactions"), {
    type: "Credit",
    from: senderData.fname + " " + senderData.lname,
    amount,
    timestamp: serverTimestamp(),
    description: description || `Transfer from ${senderData.accountNumber}`
  });

  const now = new Date();
  const formattedDate = now.toLocaleDateString();
  const formattedTime = now.toLocaleTimeString();

  document.getElementById("receiptName").textContent = `${recipientData.fname} ${recipientData.lname || ""}`;
  document.getElementById("receiptAcct").textContent = recipientAcct;
  document.getElementById("receiptAmount").textContent = amount.toLocaleString();
  document.getElementById("receiptDate").textContent = formattedDate;
  document.getElementById("receiptTime").textContent = formattedTime;

  document.getElementById("transferForm").style.display = "none";
  document.getElementById("transferSuccess").style.display = "block";
});


function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-popup";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}


const transferModal = document.getElementById("transferModal");
transferModal.addEventListener("hidden.bs.modal", () => {
  document.getElementById("transferForm").reset();
  document.getElementById("transferForm").style.display = "block";
  document.getElementById("transferSuccess").style.display = "none";
  document.getElementById("acctNameResult").textContent = "";
  delete document.getElementById("acctNameResult").dataset.uid;
});
