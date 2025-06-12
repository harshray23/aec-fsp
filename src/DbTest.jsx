"use client";

import { useEffect, useState } from "react";
import { db } from "./firebase"; // ensure this file exports correctly
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function DbTest() {
  const [status, setStatus] = useState("…");

  useEffect(() => {
    (async () => {
      try {
        // Ensure db is defined before using it
        if (!db) {
          setStatus("Error: Firestore DB instance is not available. Check firebase.js initialization.");
          console.error("Firestore DB instance is not available in DbTest.jsx");
          return;
        }
        const added = await addDoc(collection(db, "test"), { msg: "hello", time: Date.now() });
        const snap = await getDocs(collection(db, "test"));
        setStatus(`${snap.size} doc(s) saved — last ID: ${added.id}`);
      } catch (err) {
        console.error("DbTest component error:", err);
        setStatus("Error: " + err.message);
      }
    })();
  }, []);

  return <div style={{ padding: 20 }}>Firestore Test: {status}</div>;
}
