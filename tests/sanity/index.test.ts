import { expect } from 'chai';
import { createAccount } from "../helpers/auth.ts";

suite("Basic test suite - sanity", function() {

    test("Get profile", async function() {
        await createAccount('get-profile@test.com', 'password12345');
    });

    suite("Sub-suite", () => {
        test("Sub-suite test", () => {
            expect(false).to.equal(false);
        });
    });
});
