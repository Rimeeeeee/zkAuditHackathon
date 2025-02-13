const express = require('express');
const { ethers } = require('ethers');
const { verifyBid } = require("./commitment.js");
const cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config({ path: [".env", ".env.secrets"] });

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);

// Smart contract addresses & ABI
const nftAuctionAddress = process.env.NFT_AUCTION_CONTRACT_ADDRESS;
const zkvAttestationAddress = process.env.ETH_APP_CONTRACT_ADDRESS;

const nftAuctionABI = [
    "function createToken(string memory tokenURI, uint256 price,uint256 auctionDuration, uint256 revealDuration) public",
    "function idToNFT(uint256 tokenId) view returns (tuple(uint256 tokenId, address seller, uint256 price, bool currentlyListed, uint256 creationTime, uint256 auctionDuration, uint256 revealDuration) memory)",
    "function getAllNFTs() view returns (tuple(uint256 tokenId, address seller, uint256 price, bool currentlyListed, uint256 creationTime, uint256 auctionDuration, uint256 revealDuration)[] memory)",
    "function setCommitmentForNFT(uint256 _tokenId, uint256 _commitment) public",
    "function sellNFT(uint256 tokenId, address buyer) public"
];

const zkvAttestationABI = ["event AttestationPosted(uint256 indexed attestationId, bytes32 indexed root)"];

const nftAuctionContract = new ethers.Contract(nftAuctionAddress, nftAuctionABI, provider);
const zkvAttestationContract = new ethers.Contract(zkvAttestationAddress, zkvAttestationABI, provider);

// Function to calculate commitment using Poseidon hash
async function calculateCommitment(bid, nonce) {
    const poseidon = await buildPoseidon();
    const bidAmount = BigInt(bid);
    const randomness = BigInt(nonce);
    const hash = poseidon([bidAmount, randomness]);
    return poseidon.F.toString(hash);
}

// Route to create an NFT (Wallet must sign the transaction)
app.post('/create-nft', async (req, res) => {
    try {
      const { signer, tokenURI, price, auctionDuration, revealDuration } = req.body;
  
      const wallet = new ethers.Wallet(signer,provider);  // Use provider to get the Signer
      console.log("Wallet/Signer:", wallet);
  
      // Connect the contract with the signer
      const nftAuctionWithSigner = nftAuctionContract.connect(wallet);
  
      // Create the NFT
      const tx = await nftAuctionWithSigner.createToken(
        tokenURI,
        BigInt(price),
        BigInt(auctionDuration),
        BigInt(revealDuration),
        { value: ethers.parseEther("0.01") }  // Adjust value as needed
      );
  
      // Wait for the transaction to be mined
      await tx.wait();
  
      // Respond with success
      res.status(200).json({ message: 'NFT created successfully', transactionHash: tx.hash });
  
    } catch (error) {
      console.error("Error creating NFT:", error);
      res.status(500).json({ error: error.message });
    }
  });
  

// Route to fetch NFT details by ID
app.get('/get-nft/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const nft = await nftAuctionContract.idToNFT(BigInt(id));
        res.json(nft);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to fetch all NFTs
app.get('/allNFT', async (req, res) => {
    try {
        const allNFTs = await nftAuctionContract.getAllNFTs();
        res.json(allNFTs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to set commitment for an NFT
app.post('/set-commitment', async (req, res) => {
    try {
        const { signer, tokenId, bid, nonce } = req.body;
        if (!signer || !tokenId || !bid || !nonce) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const commitment = await calculateCommitment(bid, nonce);
        const wallet = new ethers.Wallet(signer, provider);
        const nftAuctionWithSigner = nftAuctionContract.connect(wallet);

        const tx = await nftAuctionWithSigner.setCommitmentForNFT(tokenId, commitment);
        await tx.wait();

        res.status(200).json({ message: 'Commitment set successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to verify proof
app.post("/verify-proof", async (req, res) => {
    try {
        const { bidAmount, tokenId, randomness,signer } = req.body;
        if (!bidAmount || !tokenId || !randomness||!signer) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const result = await verifyBid(bidAmount, tokenId, randomness,signer);
        if (result.success) {
            return res.json({ message: "Bid verification successful", txHash: result.txHash });
        } else {
            return res.status(500).json({ error: "Verification failed", details: result.error });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route to buy an NFT
app.post('/buy-nft', async (req, res) => {
    try {
        const { signer, tokenId, buyer } = req.body;
        if (!signer || !tokenId || !buyer) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const wallet = new ethers.Wallet(signer, provider);
        const nftAuctionWithSigner = nftAuctionContract.connect(wallet);

        const tx = await nftAuctionWithSigner.sellNFT(tokenId, buyer);
        await tx.wait();

        res.status(200).json({ message: 'NFT sold successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
