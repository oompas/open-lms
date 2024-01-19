import { project_id } from "./serviceAccountKey.json" with { type: "json" };
import functionsTest from "firebase-functions-test";

//
// !!! Do not change this file unless you know EXACTLY what you're doing !!!
// The order of code here matters significantly, and confidential info is used that can't be exposed
// See https://firebase.google.com/docs/functions/unit-testing for setup info
//

console.log("Initializing function tests data...");
const test = functionsTest({
    storageBucket: project_id + '.appspot.com',
    projectId: project_id,
}, './test/serviceAccountKey.json');
console.log("Done.");

// If you need to mock config values with functions.config(), put them here

// Do not move to the top; this must be done AFTER initializing firebase-functions-test and mocking config values
import * as functions from "../src";

console.log("\n==========================");
console.log("Starting firebase tests...");
console.log("==========================");

it('Should complete', (done) => {

    const data2 = test.firestore.makeDocumentSnapshot({ email: "testEmail@gmail.com", password: "pass98765" }, 'document/path');

    const wrapped = test.wrap(functions.createAccount);
    wrapped(data2);

    done();
})

// Unsets envars & deletes temporary objects
test.cleanup();
