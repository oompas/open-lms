import { initializeApp } from 'firebase-admin/app';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Get required services
initializeApp();

const adminDb = getFirestore();
const adminAuth = getAuth();

export { adminDb, adminAuth };
