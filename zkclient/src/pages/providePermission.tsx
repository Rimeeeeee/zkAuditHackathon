import React, { useState } from "react";
import { useNFTContext } from "../context/Context.tsx";
import { useActiveAccount } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { client } from "../client.ts";

const ProvideContractPermission: React.FC = () => {
  const { contract } = useNFTContext();
  const address = useActiveAccount()?.address;

  const [contractAddress, setContractAddress] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePermissionGrant = async () => {
    try {
      if (!contractAddress) {
        setError("Please enter a valid contract address.");
        return;
      }

      const wallet = createWallet("io.metamask");
      const account = await wallet.connect({ client });

      const transaction = await prepareContractCall({
        contract,
        method: "function setContractPermission(address _contract)",
        params: [contractAddress],
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account,
      });

      console.log("Permission granted, transaction hash:", transactionHash);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setContractAddress("");
    } catch (err) {
      console.error("Error granting permission:", err);
      setError("Failed to grant permission.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
  };

  return (
    <div className="flex items-center justify-center h-[85vh] bg-transparent text-white p-4">
      <div className="bg-transparent hover:bg-zinc-900 border-white border-2 p-4 md:p-8 rounded-lg shadow-lg max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Provide Contract Permission
        </h2>
        <input
          type="text"
          placeholder="Enter contract address"
          value={contractAddress}
          onChange={handleChange}
          className="block w-full text-sm text-white p-2 rounded-md bg-gray-800 mb-4"
        />
        <button
          onClick={handlePermissionGrant}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Grant Permission
        </button>
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        {success && (
          <div className="mt-4 text-green-600 text-center">
            Permission granted successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvideContractPermission;