const { buildPoseidon } = require("circomlibjs");
const snarkjs = require("snarkjs");
const fs = require("fs");

async function testCircuit() {
    console.log("🧪 Testing AuctionBid circuit...");

    // Test values
    const bidAmount = BigInt(10);
    const randomness = BigInt(5);

    // Calculate expected commitment
    const poseidon = await buildPoseidon();
    const hash = poseidon([bidAmount, randomness]);
    const expectedCommitment = poseidon.F.toString(hash);

    console.log("\n📝 Test Values:");
    console.log("Bid Amount:", bidAmount.toString());
    console.log("Randomness:", randomness.toString());
    console.log("Expected Commitment:", expectedCommitment);

    // Create input.json
    const input = {
        bidAmount: bidAmount.toString(),
        randomness: randomness.toString(),
        bidCommitment: expectedCommitment
    };
    fs.writeFileSync("input.json", JSON.stringify(input, null, 2));

    try {
        // Generate witness
        console.log("\n🔍 Generating witness...");
        await snarkjs.wtns.calculate(
            input,
            "auction_bid_js/auction_bid.wasm",
            "witness.wtns"
        );
        console.log("✅ Witness generation successful!");

        // Verify constraint satisfaction
        const r1cs = await snarkjs.r1cs.info("auction_bid.r1cs");
        console.log("\n📊 Circuit Stats:");
        console.log("Constraints:", r1cs.nConstraints);
        console.log("Private Inputs:", r1cs.nPrvInputs);
        console.log("Public Inputs:", r1cs.nPubInputs);

        console.log("\n✨ Circuit test passed successfully!");
    } catch (error) {
        console.error("\n❌ Test failed:", error);
    }
}

testCircuit().catch(console.error);