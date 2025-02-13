import React, { useEffect, useState } from "react";
import NFT from "../components/NFT";
import { readContract } from "thirdweb";
import { useNFTContext } from "../context/context";

const AllNFT: React.FC = () => {
  const { contract } = useNFTContext();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Fetching NFTs...");
    const getAllNFTs = async () => {
      if (!contract) {
        console.error("Contract is not initialized.");
        return;
      }

      console.log("Fetching NFTs...");
      try {
        setLoading(true);
        const nftData = await readContract({
          contract,
          method:
            "function getAllNFTs() view returns ((uint256, address, uint256, bool, uint256, uint256, uint256)[])",
          params: [],
        });

        console.log("NFT Data:", nftData);
        setNfts(nftData);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    getAllNFTs();
  }, [contract]);

  return (
    <div className="h-screen p-4">
      {loading ? (
        <p className="text-white text-center mt-10">Loading NFTs...</p>
      ) : nfts.length === 0 ? (
        <p className="text-white text-center mt-10">No NFTs available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 overflow-y-auto no-scrollbar mt-12">
          {nfts.map((nft: any, index: number) => {
            const [
              tokenId,
              sellerAddress,
              price,
              isActive,
              creationTime,
              auctionDuration,
              revealDuration,
            ] = nft;

            return (
              <NFT
                key={index} // Using index here for a unique key, you can replace it with tokenId if guaranteed unique
                creatorAddress={sellerAddress} // Assuming seller is the original creator
                sellerAddress={sellerAddress}
                price={Number(price)} // Convert BigInt price to Number
                tokenId={Number(tokenId)} // Convert BigInt tokenId to Number
                creationTime={Number(creationTime)} // Convert BigInt creationTime to Number
                auctionDuration={Number(auctionDuration)} // Convert BigInt auctionDuration to Number
                revealDuration={Number(revealDuration)} // Convert BigInt revealDuration to Number
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllNFT;
