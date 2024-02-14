import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";
import { getFunctions } from "firebase/functions";
import { readFileSync } from "fs";

const firebaseConfig = JSON.parse(readFileSync("./test/config.json", "utf-8"));

// There doesn't seem to be a way to call functions with firebase-functions-test and authentication
// So to call functions that require user auth, just do it like a client app
const clientApp = initializeApp(firebaseConfig, "client-test");
const clientAuth = getAuth(clientApp);
const clientFunctions = getFunctions(clientApp);

export { clientApp, clientAuth, clientFunctions };
