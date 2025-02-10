const { buildPoseidon } = require("circomlibjs");
const snarkjs = require("snarkjs");
const fs = require("fs");
const ethers = require("ethers");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { zkVerifySession, ZkVerifyEvents } = require("zkverifyjs");
require("dotenv").config({ path: [".env", ".env.secrets"] });
const zk=require("zkverifyjs");

async function run() {
    // Parse command-line arguments
    const argv = yargs(hideBin(process.argv))
        .usage("Usage: $0 --bid [num] --nonce [num]")
        .demandOption(["bid", "nonce"])
        .parse();
    const { bid, nonce } = argv;
    const bidAmount = BigInt(bid);
        const randomness = BigInt(nonce);
   
        // Calculate expected commitment
        const poseidon = await buildPoseidon();
        const hash = poseidon([bidAmount, randomness]);
        const expectedCommitment = poseidon.F.toString(hash);
       
    // Initialize Pedersen hash
    console.log(bidAmount);
    console.log(randomness);
    console.log(expectedCommitment);
    // Load environment variables
    const {
        ZKV_RPC_URL,
        ZKV_SEED_PHRASE,
        ETH_RPC_URL,
        ETH_SECRET_KEY,
        ETH_ZKVERIFY_CONTRACT_ADDRESS,
        ETH_APP_CONTRACT_ADDRESS,
    } = process.env;

    
        const evmAccount = ethers.computeAddress(ETH_SECRET_KEY);
        console.log(evmAccount);
        // Generate groth16 proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            { b:bidAmount,r:randomness,v: expectedCommitment },
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
    
        const provider = new ethers.JsonRpcProvider(ETH_RPC_URL, null, { polling: true });
        const wallet = new ethers.Wallet(ETH_SECRET_KEY, provider);
    
        const abiZkvContract = [
            "event AttestationPosted(uint256 indexed attestationId, bytes32 indexed root)"
        ];
    
        const abiAppContract = [
            "function proveYouCanCommit(uint256 attestationId, bytes32[] calldata merklePath, uint256 leafCount, uint256 index,uint256 commitment)",
            "event SuccessfulProofSubmission(address indexed from)"
        ];
    
        const zkvContract = new ethers.Contract(ETH_ZKVERIFY_CONTRACT_ADDRESS, abiZkvContract, provider);
        const appContract = new ethers.Contract(ETH_APP_CONTRACT_ADDRESS, abiAppContract, wallet);
    
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
        })
    }
    
    run();

