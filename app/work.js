const circomlib = require("circomlib");

async function calculateMiMC7(x, k) {
    // Convert inputs to BigInt
    const xBigInt = BigInt(x);
    const kBigInt = BigInt(k);
    
    // Use circomlib's mimc7 hasher
    const result = circomlib.mimc7.hash(xBigInt, kBigInt);
    
    return result.toString();
}

async function main() {
    const bid = 5;
    const nonce = 6;
    const k = 91;
    const sum = bid + nonce;

    const output = await calculateMiMC7(sum, k);
    console.log("MiMC7 hash:", output);
}

main().catch(console.error);