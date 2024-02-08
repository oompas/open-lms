import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import admin from 'firebase-admin';
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./test/serviceAccountKey.json", "utf-8"));

// Get required services
const adminApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, "admin-test");

const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

export { adminDb, adminAuth };
