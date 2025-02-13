import React, { useState } from "react";
import { useNFTContext } from "../context/Context.tsx";
import { useActiveAccount } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { ethers } from "ethers";
import { client } from "../client.ts";
import { upload } from "thirdweb/storage";

const CreateToken: React.FC = () => {
  const { connectedAddress, contract } = useNFTContext(); // Replace with your contract address
  const address = useActiveAccount()?.address;

  const [formState, setFormState] = useState({
    token_image: "",
    price: "",
    auctionDuration: "",
    revealDuration: "",
  });

  const [createTokenSuccess, setCreateTokenSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformFee = ethers.parseEther("0.01"); // Example platform fee (0.01 ETH)

  // Handle token creation process
  const handleTokenCreation = async () => {
    try {
      if (
        formState.token_image &&
        formState.auctionDuration &&
        formState.revealDuration &&
        formState.price
      ) {
        // Upload the image to IPFS
        const tokenURI = formState.token_image;

        // Convert auctionDuration, revealDuration, and price to correct types
        const auctionDuration = Number(formState.auctionDuration);
        const revealDuration = Number(formState.revealDuration);
        const price = ethers.parseEther(formState.price); // Convert price to ethers

        // Create a wallet connection for the transaction
        const wallet = createWallet("io.metamask");
        const account = await wallet.connect({ client });

        // Approve the token value before proceeding with the transaction
        //await approve(formState.tokenValue);

        // Prepare the contract call
        const transaction = await prepareContractCall({
          contract: contract,
          method:
            "function createToken(string memory tokenURI, uint256 price,uint256 auctionDuration, uint256 revealDuration)",
          params: [
            tokenURI, // Token URI
            price, // Token price
            auctionDuration,
            revealDuration,
          ],
          value: platformFee,
        });

        // Send the transaction
        const { transactionHash } = await sendTransaction({
          transaction,
          account,
        });

        // Log success and show transaction hash
        console.log(
          "Token creation successful, transaction hash:",
          transactionHash,
        );
        setCreateTokenSuccess(true);
        alert("Token created successfully!");
        setTimeout(() => setCreateTokenSuccess(false), 3000);

        // Reset form state
        setFormState({
          token_image: "",
          price: "",
          auctionDuration: "",
          revealDuration: "",
        });
      } else {
        setError("Please fill all fields correctly.");
      }
    } catch (err) {
      console.error("Error creating token:", err);
      setError("Failed to create token.");
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle file upload for token image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const uris = await upload({
          client,
          files: [file],
        });
        console.log("Uploaded file to IPFS:", uris);
        setFormState((prevState) => ({
          ...prevState,
          token_image: uris, // Set the first URI as token_image
        }));
      } catch (error) {
        console.error("Error uploading file to IPFS:", error);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    handleTokenCreation();
  };

  return (
    <div className="flex items-center justify-center h-[85vh] bg-transparent text-white p-4">
      <div className="bg-transparent hover:bg-zinc-900 bg-opacity-100 border-white border-2 p-4 md:p-8 rounded-lg shadow-lg max-w-sm md:max-w-2xl lg:max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Your Token
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token_image" className="block mb-2">
              Token Image
            </label>
            <input
              type="file"
              id="token_image"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-white bg-gray-800 p-2 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="price" className="block mb-2">
              Price (ETH)
            </label>
            <input
              type="text"
              id="price"
              name="price"
              value={formState.price}
              onChange={handleChange}
              className="block w-full text-sm text-white p-2 rounded-md bg-gray-800"
            />
          </div>

          <div>
            <label htmlFor="auctionDuration" className="block mb-2">
              Auction Duration (seconds)
            </label>
            <input
              type="text"
              id="auctionDuration"
              name="auctionDuration"
              value={formState.auctionDuration}
              onChange={handleChange}
              className="block w-full text-sm text-white p-2 rounded-md bg-gray-800"
            />
          </div>

          <div>
            <label htmlFor="revealDuration" className="block mb-2">
              Reveal Duration (seconds)
            </label>
            <input
              type="text"
              id="revealDuration"
              name="revealDuration"
              value={formState.revealDuration}
              onChange={handleChange}
              className="block w-full text-sm text-white p-2 rounded-md bg-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Create Token
          </button>
        </form>

        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}

        {createTokenSuccess && (
          <div className="mt-4 text-green-600 text-center">
            Token created successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateToken;
