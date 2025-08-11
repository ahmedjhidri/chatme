// App.js
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [products, setProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "buyer",
    productName: "",
    productCategory: "produce",
    quantity: "",
    price: "",
    description: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else setUser(null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchProducts(categoryFilter);
  }, [categoryFilter]);

  async function fetchProducts(category) {
    let q = collection(db, "products");
    if (category) {
      q = query(q, where("category", "==", category));
    }
    const querySnapshot = await getDocs(q);
    const prods = [];
    querySnapshot.forEach((doc) => {
      prods.push({ id: doc.id, ...doc.data() });
    });
    setProducts(prods);
  }

  async function register() {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const uid = userCredential.user.uid;
      // Store user role in Firestore
      await addDoc(collection(db, "users"), {
        uid,
        email: formData.email,
        role: formData.role,
      });
      alert("Registration successful!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function login() {
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      alert("Login successful!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function addProduct() {
    if (!user) {
      alert("Login required to add products");
      return;
    }
    try {
      await addDoc(collection(db, "products"), {
        name: formData.productName,
        category: formData.productCategory,
        quantity: formData.quantity,
        price: formData.price,
        description: formData.description,
        ownerId: user.uid,
      });
      alert("Product added!");
      fetchProducts(categoryFilter);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Digital Farmer’s Market Tunisia</h1>

      {!user ? (
        <>
          <h2>Register / Login</h2>
          <input
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <br />
          <input
            placeholder="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <br />
          <label>
            Role:
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
              <option value="fisherman">Fisherman</option>
              <option value="butcher">Butcher</option>
            </select>
          </label>
          <br />
          <button onClick={register}>Register</button>{" "}
          <button onClick={login}>Login</button>
        </>
      ) : (
        <>
          <div>
            <b>Logged in as:</b> {user.email} ({formData.role}){" "}
            <button onClick={logout}>Logout</button>
          </div>

          {(formData.role === "farmer" ||
            formData.role === "fisherman" ||
            formData.role === "butcher") && (
            <>
              <h2>Add Product</h2>
              <input
                placeholder="Product Name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
              <br />
              <label>
                Category:
                <select
                  value={formData.productCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, productCategory: e.target.value })
                  }
                >
                  <option value="produce">Produce</option>
                  <option value="seafood">Seafood</option>
                  <option value="meat">Meat</option>
                </select>
              </label>
              <br />
              <input
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              <br />
              <input
                placeholder="Price (TND)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <br />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <br />
              <button onClick={addProduct}>Add Product</button>
            </>
          )}

          <h2>Browse Products</h2>
          <label>
            Filter by category:
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="produce">Produce</option>
              <option value="seafood">Seafood</option>
              <option value="meat">Meat</option>
            </select>
          </label>
          <ul>
            {products.map((p) => (
              <li key={p.id}>
                <b>{p.name}</b> - {p.category} - Qty: {p.quantity} - Price: {p.price} TND
                <br />
                {p.description}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
