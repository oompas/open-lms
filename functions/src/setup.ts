import * as admin from 'firebase-admin';

// Get required services
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
