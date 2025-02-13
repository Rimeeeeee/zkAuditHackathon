import { buildPoseidon } from "circomlibjs";

/**
 * Calculate the expected commitment (hash) for a bid and nonce.
 * @param bid - The bid amount (as a string, it will be converted to BigInt).
 * @param nonce - The nonce (as a string, it will be converted to BigInt).
 * @returns The expected commitment as a string.
 */
export const calculateCommitment = async (
  bid: string,
  nonce: string,
): Promise<string> => {
  try {
    // Convert the bid and nonce to BigInt
    const bidAmount = BigInt(bid);
    const randomness = BigInt(nonce);

    // Initialize Poseidon hash function
    const poseidon = await buildPoseidon();

    // Calculate the hash for bid and nonce
    const hash = poseidon([bidAmount, randomness]);

    // Convert hash to string
    const expectedCommitment = poseidon.F.toString(hash);

    return expectedCommitment;
  } catch (error) {
    console.error("Error calculating commitment:", error);
    throw new Error("Failed to calculate commitment");
  }
};
