// @ts-ignore
import * as firebaseConfig from "../config.json" with { type: "json" };
import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";
import { getFunctions } from "firebase/functions";

// There doesn't seem to be a way to call functions with firebase-functions-test and authentication
// So to call functions that require user auth, just do it like a client app
const clientApp = initializeApp(firebaseConfig, "client-test");
const clientAuth = getAuth(clientApp);
const clientFunctions = getFunctions(clientApp);

export { clientApp, clientAuth, clientFunctions };
