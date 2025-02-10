const fs = require("fs");
const { zkVerifySession } = require("zkverifyjs");
const zk= require("zkverifyjs");
require('dotenv').config({ path: ['.env', '.env.secrets'] });

async function run() {
    // Load verification key from file
    const vk = JSON.parse(fs.readFileSync("../circuit/build/verification_key.json"));
    console.log(vk);
    // Establish a session with zkVerify
    const session = await zkVerifySession.start()
        .Testnet()
        .withAccount(process.env.ZKV_SEED_PHRASE);

    // Send verification key to zkVerify for registration
    const { transactionResult } = await session.registerVerificationKey()
        .groth16(zk.Library.snarkjs,  // Make sure the library is set properly
            zk.CurveType.bn128)
        .execute(vk);
    const { statementHash } = await transactionResult;
    console.log(`vk hash: ${statementHash}`);
}//ZKV_SEED_PHRASE="pair orbit cool later amount laptop give asthma sunset junk front accuse"

run()
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
