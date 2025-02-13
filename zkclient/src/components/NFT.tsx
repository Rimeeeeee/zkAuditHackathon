import React, { useEffect, useState } from "react";
import { prepareContractCall, readContract, sendTransaction } from "thirdweb";
import { useNFTContext } from "../context/context";
import { download } from "thirdweb/storage";
import { useActiveAccount } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
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

  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [isRevealPhase, setIsRevealPhase] = useState<boolean>(false);

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

  // Calculate important times
  const auctionStart = new Date(creationTime * 1000).toLocaleString();
  const auctionEnd = new Date(
    (creationTime + auctionDuration) * 1000,
  ).toLocaleString();
  const revealEnd = new Date(
    (creationTime + auctionDuration + revealDuration) * 1000,
  ).toLocaleString();

  useEffect(() => {
    const currentTime = Date.now();
    const auctionEndTime = creationTime * 1000 + auctionDuration * 1000;
    const revealEndTime =
      creationTime * 1000 + auctionDuration * 1000 + revealDuration * 1000;

    if (currentTime > revealEndTime) {
      setIsEnded(true); // Both auction and reveal phases are over
    } else if (currentTime > auctionEndTime) {
      setIsEnded(false); // Auction ended, but reveal phase still ongoing
      setIsRevealPhase(true); // Reveal phase active
    } else {
      setIsEnded(false); // Auction still ongoing
      setIsRevealPhase(false); // Reveal phase inactive
    }
  }, [creationTime, auctionDuration, revealDuration]);

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
    //!get hash

    const wallet = createWallet("io.metamask");
    const account = await wallet.connect({ client });
    const transaction = await prepareContractCall({
      contract: contract,
      method:
        " function setCommitmentForNFT(uint256 _tokenId,uint256 _commitment)",
      params: [
        BigInt(tokenId),
        //! BigInt(commitment)),
      ],
    });

    // Send the transaction
    const { transactionHash } = await sendTransaction({
      transaction,
      account,
    });

    // Log success and show transaction hash
    console.log(
      "Commitment Submission successful, transaction hash:",
      transactionHash,
    );
  };

  const revealBid = async () => {
    // Logic to reveal bid and nonce
    //! call the verification here
    console.log("Revealing bid and nonce...");
  };

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

      {/* Ended tag */}
      {isEnded && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-sm px-2 py-1 rounded-full">
          Ended
        </div>
      )}

      {/* Button for Submit Bid, only visible if auction is ongoing */}
      {!isEnded && !isRevealPhase && (
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
      )}

      {/* Button for Reveal Bid, only visible if auction ended but reveal phase active */}
      {isRevealPhase && (
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
            className="w-full py-2 bg-yellow-500 hover:bg-yellow-700 text-white font-bold rounded-md"
            onClick={revealBid}
          >
            Reveal Bid and Nonce
          </button>
        </div>
      )}

      {/* Auction Ended message */}
      {isEnded && !isRevealPhase && (
        <p className="font-bold text-red-600 text-3xl m-auto text-center p-2">
          Auction Ended
        </p>
      )}

      {/* "Buy Now" button remains visible */}
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
