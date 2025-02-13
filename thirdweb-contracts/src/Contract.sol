// SPDX-License-Identifier: MIT
import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
pragma solidity ^0.8.13;
error NFTAuction__NotEqualToPlatformFee();
error NFTAuction__PlatformFeeTransferFailed();
error NFTAuction__TransferFailed();
error NFTAuction__NotEnoughTokens();
error NFTAuction__NotApproved();
contract NFTAuction is ERC721URIStorage,ReentrancyGuard {
    address private immutable i_owner;
    uint256 tokenId = 0;
    uint256 totalItemsSold = 0;
    uint256 PLATFORM_FEE = 0.01 ether;
    address permittedContract;
    struct NFT {
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool currentlyListed;
        uint256 creationTime;//considering block.timestamp 
        uint256 auctionDuration;//time when auction will occur
        uint256 revealDuration;//say abt 15 mins/days

    }

    NFT[] public allListedNFTs;
    mapping(address => NFT[]) public NFTListedByAddress;
    mapping(address => NFT[]) public NFTOwnedByAddress;
    mapping(uint256 => NFT) public idToNFT;
    mapping(uint256=>NFT) public NFTInAuction;
    mapping(uint256=>mapping(address=>uint256)) public NFTCommitment;
    mapping(uint256=>mapping(address=>bool)) public approved;
    mapping(uint256=>address) public maxBid;
    mapping(uint256=>uint256) public maxBidAmount;
    // events
    event TokenListedEvent(
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        bool currentlyListed,
        uint256 creationTime,
        uint256 auctionDuration,
        uint256 revealDuration
    );

    constructor() ERC721("NFTAuction", "ZKNFT") {
        i_owner = payable(msg.sender);
    }

    function createToken(
        string memory tokenURI,
        uint256 price,
        uint256 auctionDuration,
        uint256 revealDuration
    ) public payable nonReentrant {
        if (msg.value < PLATFORM_FEE)
            revert NFTAuction__NotEqualToPlatformFee();
        // make approve in the frontend
         (bool success,) = payable(i_owner).call{value: PLATFORM_FEE}("");
        if (!success) revert  NFTAuction__PlatformFeeTransferFailed();
       // if (!pay(i_owner, PLATFORM_FEE)) revert NFTAuction__PlatformFeeTransferFailed();

        tokenId++;
        uint256 newTokenId = tokenId;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        NFT memory newNFT = NFT(
            newTokenId,
            payable(msg.sender),
            price,
            true,
            block.timestamp,
            auctionDuration,
            revealDuration

        );

        idToNFT[newTokenId] = newNFT;
        allListedNFTs.push(newNFT);
        NFTListedByAddress[msg.sender].push(newNFT);
        NFTInAuction[newTokenId]=newNFT;

        _transfer(msg.sender, address(this), newTokenId);

        emit TokenListedEvent(
            newTokenId,
            msg.sender,
            price,
            true,
            block.timestamp,
            auctionDuration,
            revealDuration
        );
    }

    function changePlatformFee(uint256 fee) public onlyOwner {
        PLATFORM_FEE = fee;
    }

    function getPlatformFee() public view returns (uint256) {
        return PLATFORM_FEE;
    }

    function getNFTListedByAddress(
        address a
    ) public view returns (NFT[] memory) {
        return NFTListedByAddress[a];
    }
    function setContractPermission(address _contract)public onlyOwner{
        permittedContract=_contract;
    }
    function getNFTOwnedByAddress(
        address a
    ) public view returns (NFT[] memory) {
        return NFTOwnedByAddress[a];
    }
    function updateApproval(uint256 _tokenId,address a)public onlyPermittedContract{
        approved[_tokenId][a]=true;
    }
    function sellNFT(uint256 _tokenId,address buyer) public payable checkRevealPhase(_tokenId) nonReentrant{
        require(buyer==maxBid[_tokenId],"Only Max Bidder can buy this NFT");
        if(approved[_tokenId][msg.sender]==false){
            revert NFTAuction__NotApproved();
        }
        uint256 price = maxBid[_tokenId];
        address seller = idToNFT[_tokenId].seller;
       // if (tokenValue * (10 ** icsToken.decimals()) != price)
            //revert NotEnoughTokens();

        // pay and approve as needed with the frontend
       // bool success = pay(seller, tokenValue);
        (bool success,) = payable(seller).call{value: price}("");
        if (!success) revert NFTAuction__TransferFailed();

        // Actually transfer the token to the new owner
        _transfer(address(this), buyer, _tokenId);

        // approve the marketplace to sell NFTs on your behalf
        approve(address(this), _tokenId);

        idToNFT[_tokenId].currentlyListed = false;
        idToNFT[_tokenId].seller = payable(buyer);

        // Update the NFT mappings
        removeNFTFromOwner(seller, _tokenId);
        addNFTToOwner(buyer, idToNFT[_tokenId]);

        totalItemsSold++;
    }

    // Internal functions to update the mappings
    function addNFTToOwner(address owner, NFT memory nft) internal {
        NFTOwnedByAddress[owner].push(nft);
    }

    function removeNFTFromOwner(address owner, uint256 _tokenId) internal {
        NFT[] storage ownedNFTs = NFTOwnedByAddress[owner];
        for (uint256 i = 0; i < ownedNFTs.length; i++) {
            if (ownedNFTs[i].tokenId == _tokenId) {
                ownedNFTs[i] = ownedNFTs[ownedNFTs.length - 1];
                ownedNFTs.pop();
                break;
            }
        }
    }

    // token payment but pay needs approval (msg.sender to address.this in the ICS itself) which will be done in the frontend


    // same needs approval
   

    function getAllNFTs() public view returns (NFT[] memory) {
        return allListedNFTs;
    }
    function setCommitmentForNFT(uint256 _tokenId,uint256 _commitment) public checkNFTInCommitPhase(_tokenId){
       NFTCommitment[_tokenId][msg.sender]=_commitment; 
    }//get commit by checking whether it is in reveal phase
    function revealCommitmentForNFT(uint256 _tokenId) public checkNFTInRevealPhase(_tokenId)view returns(uint256){
        return NFTCommitment[_tokenId][msg.sender];
    }
    function checkNFTInReveal(uint256 _tokenId)public view returns(bool){
         uint256 x=NFTInAuction[_tokenId].auctionDuration+NFTInAuction[_tokenId].creationTime;
        uint256 y=NFTInAuction[_tokenId].auctionDuration+NFTInAuction[_tokenId].revealDuration+NFTInAuction[_tokenId].creationTime;
        if(x<block.timestamp&&block.timestamp<=y){
            return true;
        }
        else{
            return false;
        }
    }
    function updateMaxBidder(uint256 _tokenId,uint256 _bid,address _bidder)public onlyPermittedContract{
        if(_bid>maxBidAmount[_tokenId]){
            maxBidAmount[_tokenId]=_bid;
            maxBid[_tokenId]=_bidder;
        }
    }
    function getMaxBidAndBidder(uint256 _tokenId)public view checkRevealPhase(_tokenId) returns(uint256,address){
        return (maxBidAmount[_tokenId],maxBid[_tokenId]);
    }
    function checkNFTInCommit(uint256 _tokenId)public view returns(bool){
        uint256 x=NFTInAuction[_tokenId].auctionDuration+NFTInAuction[_tokenId].creationTime;
        if(x>=block.timestamp){
            return true;
        }
        else{
            return false;
        }
    }
    modifier onlyOwner() {
        require(msg.sender == i_owner, "Only Owner can Access This");
        _;
    }
    modifier checkNFTInCommitPhase(uint256 _tokenId){
        uint256 x=NFTInAuction[_tokenId].auctionDuration+NFTInAuction[_tokenId].creationTime;
        require(x>=block.timestamp,"NFT is not in commit phase");
        _;
    }
    modifier checkNFTInRevealPhase(uint256 _tokenId){
        uint256 x=NFTInAuction[_tokenId].auctionDuration+NFTInAuction[_tokenId].creationTime;
        uint256 y=NFTInAuction[_tokenId].auctionDuration+NFTInAuction[_tokenId].revealDuration+NFTInAuction[_tokenId].creationTime;
        require(x<block.timestamp&&block.timestamp<=y,"NFT is not in reveal phase");
        _;
    }
    modifier checkRevealPhase(uint256 _tokenId){
        uint256 y=NFTInAuction[_tokenId].auctionDuration+NFTInAuction[_tokenId].revealDuration+NFTInAuction[_tokenId].creationTime;
        require(block.timestamp>y,"NFT is still in reveal phase");
        _;
    }
    modifier onlyPermittedContract(){
        require(msg.sender==permittedContract,"Only Permitted Contract can Access This");
        _;
    }
}
contract ZkvAttestationContract {
    /// The hash of the identifier of the proving system used (groth16 in this case)
    bytes32 public constant PROVING_SYSTEM_ID =
        keccak256(abi.encodePacked("groth16"));

    /// The address of the ZkvAttestationContract
    address public immutable zkvContract;
    /// The hash of the verification key of the circuit
    bytes32 public immutable vkHash;
    NFTAuction public immutable nftContract;
    /// A mapping for recording the addresses which have submitted valid proofs
    mapping(address => bool) public hasSubmittedValidProof;

    event SuccessfulProofSubmission(address indexed from);

    constructor(address _zkvContract, bytes32 _vkHash,address _nftContract) {
        zkvContract = _zkvContract;
        vkHash = _vkHash;
        nftContract=NFTAuction(_nftContract);
    }

    function proveYouCanCommit(
        uint256 attestationId,
        bytes32[] calldata merklePath,
        uint256 leafCount,
        uint256 index,
        uint256 commitment,
        uint256 tokenId,
        uint256 bid
    ) external {
        require(
            _verifyProofHasBeenPostedToZkv(
                attestationId,
                msg.sender,
                merklePath,
                leafCount,
                index,
                commitment
            )
        );
        /// If a valid proof has been posted to zkVerify, then perform app-specific logic (e.g. mint a NFT).
        /// In this simple example, we just record the address of the sender inside a map and emit an event.
        hasSubmittedValidProof[msg.sender] = true;
        nftContract.updateApproval(tokenId, msg.sender);
        nftContract.updateMaxBidder(tokenId, bid,msg.sender);
        emit SuccessfulProofSubmission(msg.sender);
    }

    function _verifyProofHasBeenPostedToZkv(
        uint256 attestationId,
        address inputAddress,
        bytes32[] calldata merklePath,
        uint256 leafCount,
        uint256 index,
        uint256 commitment
    ) internal view returns (bool) {
        bytes memory encodedInput = abi.encodePacked(
            _changeEndianess(commitment)
        );
        bytes32 leaf = keccak256(
            abi.encodePacked(PROVING_SYSTEM_ID, vkHash, keccak256(encodedInput))
        );

        (bool callSuccessful, bytes memory validProof) = zkvContract.staticcall(
            abi.encodeWithSignature(
                "verifyProofAttestation(uint256,bytes32,bytes32[],uint256,uint256)",
                attestationId,
                leaf,
                merklePath,
                leafCount,
                index
            )
        );

        require(callSuccessful);

        return abi.decode(validProof, (bool));
    }

    /// Utility function to efficiently change the endianess of its input (zkVerify groth16
    /// pallet uses big-endian encoding of public inputs, but EVM uses little-endian encoding).
    function _changeEndianess(uint256 input) internal pure returns (uint256 v) {
        v = input;
        // swap bytes
        v =
            ((v &
                0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >>
                8) |
            ((v &
                0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) <<
                8);
        // swap 2-byte long pairs
        v =
            ((v &
                0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >>
                16) |
            ((v &
                0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) <<
                16);
        // swap 4-byte long pairs
        v =
            ((v &
                0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >>
                32) |
            ((v &
                0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) <<
                32);
        // swap 8-byte long pairs
        v =
            ((v &
                0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >>
                64) |
            ((v &
                0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) <<
                64);
        // swap 16-byte long pairs
        v = (v >> 128) | (v << 128);
    }
}