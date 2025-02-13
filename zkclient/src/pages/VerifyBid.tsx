import { useState } from "react";
import axios from "axios";

const VerifyBidPage = () => {
  const [tokenId, setTokenId] = useState("");
  const [signer, setSigner] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [randomness, setRandomness] = useState("");
  const [commitment, setCommitment] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure all values are present
    if (!tokenId || !signer || !bidAmount || !randomness || !commitment) {
      setResponseMessage("⚠️ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setResponseMessage("");

    try {
      const response = await axios.post("http://localhost:5000/verify-bid", {
        tokenId: tokenId.toString(),
        signer: signer.toString(),
        bidAmount: bidAmount.toString(),
        randomness: randomness.toString(),
        commitment: commitment.toString(),
      });

      setResponseMessage(`✅ Success: ${response.data.message}`);
    } catch (error: any) {
      setResponseMessage(`❌ Error: ${error.response?.data?.error || "Request failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-20 max-w-lg mx-auto mt-10 p-6 bg-gray-800 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Verify Bid</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="w-full p-2 border border-gray-600 rounded bg-gray-900"
        />
        <input
          type="text"
          placeholder="Signer (Wallet Address)"
          value={signer}
          onChange={(e) => setSigner(e.target.value)}
          className="w-full p-2 border border-gray-600 rounded bg-gray-900"
        />
        <input
          type="text"
          placeholder="Bid Amount"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          className="w-full p-2 border border-gray-600 rounded bg-gray-900"
        />
        <input
          type="text"
          placeholder="Randomness (Nonce)"
          value={randomness}
          onChange={(e) => setRandomness(e.target.value)}
          className="w-full p-2 border border-gray-600 rounded bg-gray-900"
        />
        <input
          type="text"
          placeholder="Commitment"
          value={commitment}
          onChange={(e) => setCommitment(e.target.value)}
          className="w-full p-2 border border-gray-600 rounded bg-gray-900"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {responseMessage && <p className="mt-4 text-center">{responseMessage}</p>}
    </div>
  );
};

export default VerifyBidPage;
