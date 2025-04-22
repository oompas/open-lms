import { expect } from 'chai';
import { callAPI } from "../helpers/api.ts";
import { sanitySkipDetailed, setupWipeDb } from "../helpers/mocha.ts";

suite("endpoint-name", function() {

    setupWipeDb();

    suite("Sanity", function() {

    });

    suite("Detailed", function() {

        sanitySkipDetailed();
    });
});
