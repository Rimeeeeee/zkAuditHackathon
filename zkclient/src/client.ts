import { createThirdwebClient } from "thirdweb";

// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
const clientId = "efa0a38e3de00710c166234196160456";

export const client = createThirdwebClient({
  clientId: clientId,
});
