import { project_id } from "./serviceAccountKey.json" with { type: "json" };
import functionsTest from "firebase-functions-test";

//
// !!! Do not change this file unless you know EXACTLY what you're doing !!!
// The order of code here matters significantly, and confidential info is used that can't be exposed
// See https://firebase.google.com/docs/functions/unit-testing for setup info
//

console.log("Initializing function test environment...");
const testEnv = functionsTest({
    storageBucket: project_id + '.appspot.com',
    projectId: project_id,
}, './test/serviceAccountKey.json');
console.log("Done.");

console.log("\n==========================");
console.log("Starting firebase tests...");
console.log("==========================");

export default testEnv;
