const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { buildPoseidon } = require('circomlibjs'); // Adjust this import based on your library

async function calculateCommitmentFromArgs() {
    const argv = yargs(hideBin(process.argv))
        .usage("Usage: $0 --bid [num] --nonce [num]")
        .demandOption(["bid", "nonce"])
        .argv;

    const { bid, nonce } = argv;

    // Convert bid and nonce to BigInt
    const bidAmount = BigInt(bid);
    const randomness = BigInt(nonce);

    // Calculate expected commitment
    const poseidon = await buildPoseidon();
    const hash = poseidon([bidAmount, randomness]);
    const expectedCommitment = poseidon.F.toString(hash);

    // Log results
    console.log("Bid Amount:", bidAmount);
    console.log("Randomness:", randomness);
    console.log("Expected Commitment:", expectedCommitment);
}

// Execute the function
calculateCommitmentFromArgs().catch((error) => {
    console.error("Error calculating commitment:", error);
});
