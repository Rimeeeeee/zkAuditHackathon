import React, {
  useContext,
  createContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { ThirdwebClient, defineChain } from "thirdweb";
import { ethers } from "ethers";
import { createThirdwebClient, getContract } from "thirdweb";
import { createWallet } from "thirdweb/wallets";

// Define your wallets array
const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("com.trustwallet.app"),
  createWallet("me.rainbow"),
];

// Define the context props
interface NFTContextProps {
  contract: any;
  // signer: ethers.Signer | null;
  // provider: ethers.providers.Web3Provider | null;
  connectedAddress: string | null;
  wallets: any;
  client: ThirdwebClient;
  wallet: any;
  account: any;
  zkContract:any;
}

// Create the context
const NFTContext = createContext<NFTContextProps | undefined>(undefined);

// Initialize the thirdweb client
const client: ThirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_CLIENT_ID as string,
});

let account: any;
const wallet = createWallet("io.metamask");

// Connect the wallet
const connectWallet = async () => {
  const acc = await wallet.connect({ client });
  account = acc;
};
connectWallet();

// Create the provider component
interface NFTContextProviderProps {
  children: ReactNode;
}

export const NFTContextProvider = ({ children }: NFTContextProviderProps) => {
  // Initialize state
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null); // Add contract state
  const [zkContract, zksetContract] = useState<any>(null);
  useEffect(() => {
    // Initialize provider and signer
    //const provider = new ethers.providers.Web3Provider(window.ethereum);
    // setProvider(provider);
    // const _signer = _provider.getSigner();
    // setSigner(_signer);
    setConnectedAddress(account); // Set the connected address

    // Initialize contract
    const _contract = getContract({
      client,
      chain: defineChain(Number(import.meta.env.VITE_CHAIN_ID)), // Define the chain ID
      address: import.meta.env.VITE_CONTRACT_ADDRESS as string, // Replace with your contract address
    });
    console.log("Contract:", _contract);
    setContract(_contract); // Set the contract
  // Empty dependency array ensures this runs only once
  const _zkcontract = getContract({
    client,
    chain: defineChain(Number(import.meta.env.VITE_CHAIN_ID)), // Define the chain ID
    address: import.meta.env.VITE_ZKCONTRACT_ADDRESS as string, // Replace with your contract address
  });
  console.log("Contract:", _zkcontract);
  zksetContract(_zkcontract); // Set the contract
}, []);
  return (
    <NFTContext.Provider
      value={{
        contract,
        // signer,
        //   provider,
        connectedAddress,
        wallets,
        client,
        wallet,
        account,
        zkContract
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};

// Custom hook to access the context
export const useNFTContext = () => {
  const context = useContext(NFTContext);
  if (!context) {
    throw new Error("useNFTContext must be used within an NFTContextProvider");
  }
  return context;
};
