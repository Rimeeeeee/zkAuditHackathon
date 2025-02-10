// calculate_commitment.js
const { buildPoseidon } = require("circomlibjs");

async function calculateCommitment() {
    const poseidon = await buildPoseidon();
    
    // Match values from input.json
    const bidAmount = BigInt(10);
    const randomness = BigInt(5);
    
    // Calculate hash
    const hash = poseidon([bidAmount, randomness]);
    const commitment = poseidon.F.toString(hash);
    
    console.log("Calculated commitment:", commitment);
}

calculateCommitment().catch(console.error);