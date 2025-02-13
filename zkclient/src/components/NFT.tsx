import React, { useEffect, useState } from "react";
import { prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { useNFTContext } from "../context/context";
import { download } from "thirdweb/storage";
import { useActiveAccount } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
// import { calculateCommitment } from "../utils/hash";
interface NFTProps {
  sellerAddress: string;
  price: number;
  tokenId: number;
  creationTime: number;
  auctionDuration: number;
  revealDuration: number;
}

const NFT: React.FC<NFTProps> = ({
  sellerAddress,
  price,
  tokenId,
  creationTime,
  auctionDuration,
  revealDuration,
}) => {
  const [image, setImage] = useState("");
  const [bid, setBid] = useState<string>("");
  const [nonce, setNonce] = useState<string>("");
  const { contract, client } = useNFTContext();
  const activeAccountAddress = useActiveAccount()?.address;

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const data = await readContract({
          contract,
          method: "function tokenURI(uint256 tokenId) view returns (string)",
          params: [BigInt(tokenId)],
        });

        const response = await download({ client, uri: `${data}` });
        const fileBlob = await response.blob();
        setImage(URL.createObjectURL(fileBlob));
      } catch (error) {
        console.error("Error fetching NFT image:", error);
      }
    };

    fetchImage();
  }, [tokenId, contract, client]);

  const buyNFTs = async (tokenId: number, price: number) => {
    try {
      await approve(price);

      const wallet = createWallet("io.metamask");
      const account = await wallet.connect({ client });

      const transaction = await prepareContractCall({
        contract,
        method: "function sellNFT(uint256 _tokenId, uint256 tokenValue)",
        params: [BigInt(tokenId), BigInt(price)],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });
      console.log("Transaction successful:", transactionHash);
    } catch (error) {
      console.error("Failed to buy NFT:", error);
    }
  };

  const submitBid = async () => {
    if (!bid || !nonce) {
      console.error("Bid and nonce are required.");
      return;
    }
    try {
      // Assuming you have the backend URL set up as 'http://localhost:3000/getExpectedHash'
      const response = await fetch("http://localhost:3000/getExpectedHash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bid, nonce }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Calculated Commitment (Hash):", data.hash);
      } else {
        console.error("Failed to get expected hash from backend");
      }
    } catch (error) {
      console.error("Error submitting bid:", error);
    }
  };

  // Calculate important times
  const auctionStart = new Date(creationTime * 1000).toLocaleString();
  const auctionEnd = new Date(
    (creationTime + auctionDuration) * 1000,
  ).toLocaleString();
  const revealEnd = new Date(
    (creationTime + auctionDuration + revealDuration) * 1000,
  ).toLocaleString();

  return (
    <div className="w-full max-w-xs mx-auto bg-zinc-950 p-4 border-2 border-white rounded-lg shadow-lg text-white">
      <div>
        <img
          src={image}
          alt={`NFT #${tokenId}`}
          className="w-full rounded-md"
        />
      </div>
      <div className="flex flex-col mt-2 border-t-2 pt-2 border-white">
        <p className="text-sm text-gray-400">
          Seller: {sellerAddress?.slice(0, 6)}...{sellerAddress?.slice(-4)}
        </p>

        <p className="text-xl font-bold text-blue-400">
          Base Price: {price / 1e18} ETH
        </p>
      </div>
      <div className="mt-2 text-sm text-gray-300">
        <p>
          <strong>Auction Start:</strong> {auctionStart}
        </p>
        <p>
          <strong>Auction End:</strong> {auctionEnd}
        </p>
        <p>
          <strong>Reveal End:</strong> {revealEnd}
        </p>
      </div>

      {/* Bid Input and Submit Button */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Enter your bid"
          value={bid}
          onChange={(e) => setBid(e.target.value)}
          className="w-full p-2 mb-2 rounded-md border-2 border-white bg-transparent text-white"
        />
        <input
          type="text"
          placeholder="Enter nonce"
          value={nonce}
          onChange={(e) => setNonce(e.target.value)}
          className="w-full p-2 mb-4 rounded-md border-2 border-white bg-transparent text-white"
        />
        <button
          className="w-full py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-md"
          onClick={submitBid}
        >
          Submit Bid
        </button>
      </div>

      {sellerAddress !== activeAccountAddress && (
        <button
          className="w-full py-3 mt-4 bg-gradient-to-r from-teal-400 to-teal-600 text-white font-bold rounded-md"
          onClick={() => buyNFTs(tokenId, price)}
        >
          Buy Now
        </button>
      )}
    </div>
  );
};

export default NFT;
