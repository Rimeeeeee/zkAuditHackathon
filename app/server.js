const express = require("express");
const { ethers } = require("ethers");
const { verifyBid } = require("./verifyBid");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }))

// Route to handle bid verification
app.post("/verify-bid", async (req, res) => {
    try {
        const { tokenId,signer,bidAmount,randomness,commitment } = req.body;

        if (!bidAmount || !tokenId || !randomness || !signer||!commitment) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        console.log("Received bid verification request:", { bidAmount, tokenId, randomness,commitment });

        const result = await verifyBid(bidAmount, tokenId, randomness, signer,commitment);

        console.log("Bid verification result:", result);
    } catch (error) {
        console.error("Error processing bid verification:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
