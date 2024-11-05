import { expect } from 'chai';

suite("Basic test suite - sanity", function() {

    suite("Sub-suite", () => {
        test("Sub-suite test", () => {
            expect(false).to.equal(false);
        });
    });
});
