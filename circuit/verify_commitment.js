const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");

async function verifyCommitment() {
    // Read input.json
    const input = JSON.parse(fs.readFileSync("input.json"));
    
    // Initialize Poseidon
    const poseidon = await buildPoseidon();
    
    // Convert inputs to BigInt
    const bidAmount = BigInt(input.bidAmount);
    const randomness = BigInt(input.randomness);
    const providedCommitment = BigInt(input.bidCommitment);
    
    // Calculate hash
    const hash = poseidon([bidAmount, randomness]);
    const calculatedCommitment = BigInt(poseidon.F.toString(hash));
    
    console.log("Provided commitment:", providedCommitment.toString());
    console.log("Calculated commitment:", calculatedCommitment.toString());
    console.log("Match:", providedCommitment === calculatedCommitment);
}

verifyCommitment().catch(console.error);