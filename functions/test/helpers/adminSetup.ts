// @ts-ignore
import * as serviceAccount from "../serviceAccountKey.json" with { type: "json" };
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import admin from 'firebase-admin';

// Get required services
// @ts-ignore
const adminApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, "admin-test");

const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

export { adminDb, adminAuth };
