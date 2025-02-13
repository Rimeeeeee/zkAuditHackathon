const { buildPoseidon } = require("circomlibjs");
const snarkjs = require("snarkjs");
const fs = require("fs");
const ethers = require("ethers");
const { zkVerifySession, ZkVerifyEvents } = require("zkverifyjs");
require("dotenv").config({ path: [".env", ".env.secrets"] });

async function verifyBid(bidAmount, tokenId, randomness, signer) {
    try {
        // Load environment variables
        const {
            ZKV_RPC_URL,
            ZKV_SEED_PHRASE,
            ETH_ZKVERIFY_CONTRACT_ADDRESS,
            ETH_APP_CONTRACT_ADDRESS,
        } = process.env;

        if (!signer) throw new Error("Signer is required");
         const provider = new ethers.JsonRpcProvider(ETH_RPC_URL, null, { polling: true });
         const wallet = new ethers.Wallet(signer, provider);

        // Define ABI for reading commitment from contract
        const abiAppContract = [
            "function NFTCommitment(uint256, address) external view returns (uint256)",
            
        ];
        const abiZkvContract = [
           "function proveYouCanCommit(uint256 attestationId, bytes32[] calldata merklePath, uint256 leafCount, uint256 index, uint256 commitment, uint256 tokenId, uint256 bid)",
            "event SuccessfulProofSubmission(address indexed from)"
        ];
        // Connect to the contract using signer
        const appContract = new ethers.Contract(ETH_APP_CONTRACT_ADDRESS, abiAppContract, signer);
        const zkvContract = new ethers.Contract(ETH_ZKVERIFY_CONTRACT_ADDRESS, abiZkvContract, provider);

        // Fetch the commitment from the smart contract
        const commitment = await appContract.NFTCommitment(tokenId, await signer.getAddress());
        console.log("Retrieved Commitment from Contract:", commitment.toString());

        // Generate zk-SNARK proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            { b: BigInt(bidAmount), r: BigInt(randomness), v: commitment.toString() },
            "../circuit/build/circuit.wasm",
            "../circuit/build/circuit_final.zkey"
        );

        const vk = JSON.parse(fs.readFileSync("../circuit/build/verification_key.json"));

         // Establish a session with zkVerify
               const session = await zkVerifySession.start()
                   .Testnet()
                   .withAccount(ZKV_SEED_PHRASE);
           
               // Send the proof to zkVerify chain for verification
               const { events, transactionResult } = await session.verify()
                   .groth16(zk.Library.snarkjs,zk.CurveType.bn128)
                   .waitForPublishedAttestation()
                   .execute({
                       proofData: {
                           vk,
                           proof,
                           publicSignals
                       }
                   });
           
               // Listen for the 'includedInBlock' event
               events.on(ZkVerifyEvents.IncludedInBlock, ({ txHash }) => {
                   console.log(`Transaction accepted in zkVerify, tx-hash: ${txHash}`);
               });
           
               // Listen for the 'finalized' event
               events.on(ZkVerifyEvents.Finalized, ({ blockHash }) => {
                   console.log(`Transaction finalized in zkVerify, block-hash: ${blockHash}`);
               });
           
               // Handle errors during the transaction process
               events.on('error', (error) => {
                   console.error('An error occurred during the transaction:', error);
               });
           
               // Upon successful publication on zkVerify of the attestation containing the proof, extract:
               // - the attestation id
               // - the leaf digest (i.e. the structured hash of the statement of the proof)
               let attestationId, leafDigest;
               try {
                   ({ attestationId, leafDigest } = await transactionResult);
                   console.log(`Attestation published on zkVerify`)
                   console.log(`\tattestationId: ${attestationId}`);
                   console.log(`\tleafDigest: ${leafDigest}`);
               } catch (error) {
                   console.error('Transaction failed:', error);
               }
           
               // Retrieve via rpc call:
               // - the merkle proof of inclusion of the proof inside the attestation
               // - the total number of leaves of the attestation merkle tree
               // - the leaf index of our proof
               let merkleProof, numberOfLeaves, leafIndex;
               try {
                   const proofDetails = await session.poe(attestationId, leafDigest);
                   ({ proof: merkleProof, numberOfLeaves, leafIndex } = await proofDetails);
                   console.log(`Merkle proof details`)
                   console.log(`\tmerkleProof: ${merkleProof}`);
                   console.log(`\tnumberOfLeaves: ${numberOfLeaves}`);
                   console.log(`\tleafIndex: ${leafIndex}`);
               } catch (error) {
                   console.error('RPC failed:', error);
               }
               
               const filterAttestationsById = zkvContract.filters.AttestationPosted(attestationId, null);
               zkvContract.once(filterAttestationsById, async (_id, _root) => {
                   // After the attestation has been posted on the EVM, send a `proveYouCanFactor42` tx
                   // to the app contract, with all the necessary merkle proof details
                   const txResponse = await appContract.proveYouCanCommit(
                       attestationId,
                       merkleProof,    
                       numberOfLeaves,
                       leafIndex,
                       expectedCommitment
       
                   );
                   const { hash } = await txResponse;
                   console.log(`Tx sent to EVM, tx-hash ${hash}`);
               });
           
               const filterAppEventsByCaller = appContract.filters.SuccessfulProofSubmission(evmAccount);
               appContract.once(filterAppEventsByCaller, async () => {
                   console.log("App contract has acknowledged that you can factor 42!")
               });

               return { success: true, txHash: txResponse.hash };
            }

               catch (error) {
                   console.error('Transaction failed:', error);
               }
                return { success: false, error: error.message };
       
}

// Export the function
module.exports = { verifyBid };

