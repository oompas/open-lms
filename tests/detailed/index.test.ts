import { expect } from 'chai';

suite("Basic test suite - detailed", function() {

    test("Simple test", function() {
        expect(true).to.equal(true);
    });

    suite("Sub-suite", () => {
        test("Sub-suite test", () => {
            expect(false).to.equal(false);
        });
    });
});
