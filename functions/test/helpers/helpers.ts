import { signInWithEmailAndPassword, signOut } from "@firebase/auth";
import { clientAuth, clientFunctions } from "./clientSetup";
import { httpsCallable } from "firebase/functions";

// Generates a string of the specified length of random characters
const randomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~`!@#$%^&*()_+-={}[]|\\:";\'<>,.?/';
    const charactersLength = characters.length;

    let result = '';
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

// Calls an onCall function unauthenticated
const callOnCallFunction = async (functionName: string, data: any) => httpsCallable(clientFunctions, functionName)(data);

// Calls an onCall function for a given user
const callOnCallFunctionWithAuth = async (functionName: string, data: any, email: string, password: string) => {
    if (clientAuth.currentUser) {
        await signOut(clientAuth)
            .then(() => console.log(`Successfully signed out of account ${email}`))
            .catch((err) => { throw new Error(`Error signing out: ${err}`); });
    }

    await signInWithEmailAndPassword(clientAuth, email, password)
        .then(() => console.log(`Successfully logged in to account ${email}`))
        .catch((err) => { throw new Error(`Error signing into ${email}: ${err}`); });

    return httpsCallable(clientFunctions, functionName)(data);
}

const USER_ID_LENGTH: number = 28;
const DOCUMENT_ID_LENGTH: number = 20;

export { randomString, callOnCallFunction, callOnCallFunctionWithAuth, USER_ID_LENGTH, DOCUMENT_ID_LENGTH };
