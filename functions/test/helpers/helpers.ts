import { signInWithEmailAndPassword, signOut } from "@firebase/auth";
import { clientAuth, clientFunctions } from "./config/clientSetup";
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

// Generates a random integer between min and max (inclusive)
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);

// Calls an onCall function unauthenticated
const callOnCallFunction = async (functionName: string, data: any) => httpsCallable(clientFunctions, functionName)(data);

// Calls an onCall function for a given user
const callOnCallFunctionWithAuth = async (functionName: string, data: any, user: { email: string, password: string }) => {
    if (clientAuth.currentUser) {
        await signOut(clientAuth)
            .then(() => console.log(`Successfully signed out of account ${user.email}`))
            .catch((err) => { throw new Error(`Error signing out: ${err}`); });
    }

    await signInWithEmailAndPassword(clientAuth, user.email, user.password)
        .then(() => console.log(`Successfully logged in to account ${user.email}`))
        .catch((err) => { throw new Error(`Error signing into ${user.email}: ${err}`); });

    return httpsCallable(clientFunctions, functionName)(data);
}

// Delays execution for the specified number of milliseconds
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const USER_ID_LENGTH: number = 28;
const DOCUMENT_ID_LENGTH: number = 20;

export { randomString, randomInt, callOnCallFunction, callOnCallFunctionWithAuth, delay, USER_ID_LENGTH, DOCUMENT_ID_LENGTH };
