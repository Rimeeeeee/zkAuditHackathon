import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AllNFT from "./pages/AllNFT";
import { ThirdwebProvider } from "thirdweb/react";
import "./index.css";
import { NFTContextProvider } from "./context/Context.tsx";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThirdwebProvider>
      <NFTContextProvider>
        <App />
      </NFTContextProvider>
    </ThirdwebProvider>
  </React.StrictMode>,
);
