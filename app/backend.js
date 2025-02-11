const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config({ path: [".env", ".env.secrets"] });
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Replace with your Ethereum provider URL (e.g., Infura, Alchemy)
const provider = new ethers.providers.JsonRpcProvider('https://421614.rpc.thirdweb.com');

// Replace with your contract addresses and ABI
const nftAuctionAddress =process.env.NFT_AUCTION_CONTRACT_ADDRESS;
const zkvAttestationAddress = process.env.ETH_APP_CONTRACT_ADDRESS;

const nftAuctionABI = [ /* ABI for NFTAuction contract */ ];
const zkvAttestationABI = [ /* ABI for ZkvAttestationContract */ ];

const nftAuctionContract = new ethers.Contract(nftAuctionAddress, nftAuctionABI, provider);
const zkvAttestationContract = new ethers.Contract(zkvAttestationAddress, zkvAttestationABI, provider);

// API to list an NFT
app.post('/list-nft', async (req, res) => {
    const { tokenURI, price, tokenValue, auctionDuration, revealDuration, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const nftAuctionWithSigner = nftAuctionContract.connect(wallet);

    try {
        const tx = await nftAuctionWithSigner.createToken(tokenURI, price, tokenValue, auctionDuration, revealDuration, { value: ethers.utils.parseEther(tokenValue.toString()) });
        await tx.wait();
        res.status(200).json({ message: 'NFT listed successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to sell an NFT
app.post('/sell-nft', async (req, res) => {
    const { tokenId, buyer, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const nftAuctionWithSigner = nftAuctionContract.connect(wallet);

    try {
        const tx = await nftAuctionWithSigner.sellNFT(tokenId, buyer);
        await tx.wait();
        res.status(200).json({ message: 'NFT sold successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to verify proof and commit to NFT
app.post('/verify-proof', async (req, res) => {
    const { attestationId, merklePath, leafCount, index, commitment, tokenId, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const zkvAttestationWithSigner = zkvAttestationContract.connect(wallet);

    try {
        const tx = await zkvAttestationWithSigner.proveYouCanCommit(attestationId, merklePath, leafCount, index, commitment, tokenId);
        await tx.wait();
        res.status(200).json({ message: 'Proof verified and commitment successful', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get listed NFTs by address
app.get('/listed-nfts/:address', async (req, res) => {
    const address = req.params.address;

    try {
        const listedNFTs = await nftAuctionContract.getNFTListedByAddress(address);
        res.status(200).json({ listedNFTs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to get owned NFTs by address
app.get('/owned-nfts/:address', async (req, res) => {
    const address = req.params.address;

    try {
        const ownedNFTs = await nftAuctionContract.getNFTOwnedByAddress(address);
        res.status(200).json({ ownedNFTs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});