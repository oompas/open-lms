// @ts-ignore
import * as config from "../../firebaseConfig.json" with { type: "json" };
import { initializeApp } from "firebase/app";
import { getAuth } from "@firebase/auth";

const app = initializeApp(config);

const auth = getAuth(app);

export { app, auth };
