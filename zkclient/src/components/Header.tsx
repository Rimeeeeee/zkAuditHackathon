import React from "react";
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { client } from "../client"; // Ensure this is properly set up

const TopBar: React.FC = () => {
  const address = useActiveAccount()?.address;

  return (
    <div
      className="w-full h-16 bg-zinc-950 shadow-sm text-white flex items-center
     justify-between px-4 shadow-white fixed top-0 z-40"
    >
      <div>
        <span className="font-bold text-xl sm:text-4xl ml-14 sm:ml-20">
          ZKAuction
        </span>
      </div>
      {/* Connect button */}
      <div className="flex flex-row gap-1">
        <ConnectButton
          client={client} // Ensure `client` is properly configured in ThirdwebProvider
          theme={darkTheme({})}
          connectModal={{ size: "compact" }}
        />
      </div>
    </div>
  );
};

export default TopBar;
