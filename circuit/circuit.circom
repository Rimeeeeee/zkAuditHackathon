pragma circom 2.1.6;

include "./node_modules/circomlib/circuits/poseidon.circom";

template Auction () {
   // Inputs
   signal input b; // Bid
   signal input r; // Random Message
   signal input v;  // Expected Poseidon hash
   // Poseidon component with two inputs
   component hash = Poseidon(2);
   hash.inputs[0] <== b;
   hash.inputs[1] <== r;

   // Log the output of the Poseidon hash for debugging
   log(hash.out);

   // Ensure computed hash matches expected value
    assert(v == hash.out);
}

component main { public [ v ] } = Auction();