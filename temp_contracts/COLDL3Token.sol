// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title COLD L3 Token
 * @dev Ultra-scarce governance token for COLD L3 with only 20 total supply
 * 
 * Distribution:
 * - 12 COLD: Reserved for LP rewards (O/ETH, O/DIA, HEAT/ETH, HEAT/DIA)
 * - 8 COLD: Privacy minting through XFG deposits (ZK process)
 * 
 * Features:
 * - Ultimate scarcity (20 total supply)
 * - Governance voting power
 * - LP reward allocation
 * - Privacy minting via XFG deposits
 */
contract COLDL3Token is ERC20, ERC20Votes, ERC20Permit, Ownable, ReentrancyGuard {
    
    // Ultra-scarce supply constants
    uint256 public constant MAX_SUPPLY = 20 * 10**18; // Only 20 COLD tokens ever
    uint256 public constant LP_REWARDS_ALLOCATION = 12 * 10**18; // 12 COLD for LP rewards
    uint256 public constant XFG_PRIVACY_ALLOCATION = 8 * 10**18; // 8 COLD for XFG deposits
    
    // Minting tracking
    uint256 public lpRewardsMinted;
    uint256 public xfgPrivacyMinted;
    
    // Authorized protocol contract (follows established pattern)
    address public protocolContract;
    
    // LP Pair Configuration
    struct LPPair {
        string name;           // e.g., "O/ETH"
        address lpToken;       // LP token contract
        uint256 allocation;    // COLD allocation for this pair
        uint256 minted;        // COLD already minted for this pair
        bool active;           // Whether pair is active for rewards
    }
    
    mapping(string => LPPair) public lpPairs;
    string[] public supportedPairs;
    
    // XFG Privacy Minting (tracking handled by COLDL3Protocol)
    
    // Events
    event LPPairConfigured(string indexed pairName, address lpToken, uint256 allocation);
    event LPRewardMinted(string indexed pairName, address recipient, uint256 amount);
    event XFGPrivacyMinted(address indexed recipient, uint256 amount, bytes32 depositHash);
    event ProtocolContractUpdated(address protocolContract);
    
    constructor(address initialOwner) 
        ERC20("COLD L3 Token", "COLD") 
        ERC20Permit("COLD L3 Token")
        Ownable(initialOwner) 
    {
        // Initialize the 4 supported LP pairs
        _configureLPPair("O/ETH", address(0), 3 * 10**18);   // 3 COLD for O/ETH
        _configureLPPair("O/DIA", address(0), 3 * 10**18);   // 3 COLD for O/DIA  
        _configureLPPair("HEAT/ETH", address(0), 3 * 10**18); // 3 COLD for HEAT/ETH
        _configureLPPair("HEAT/DIA", address(0), 3 * 10**18); // 3 COLD for HEAT/DIA
    }
    
    // LP Rewards Functions
    function _configureLPPair(string memory pairName, address lpToken, uint256 allocation) internal {
        lpPairs[pairName] = LPPair({
            name: pairName,
            lpToken: lpToken,
            allocation: allocation,
            minted: 0,
            active: true
        });
        supportedPairs.push(pairName);
    }
    
    function setLPToken(string memory pairName, address lpToken) external onlyOwner {
        require(lpPairs[pairName].allocation > 0, "Invalid pair");
        lpPairs[pairName].lpToken = lpToken;
        emit LPPairConfigured(pairName, lpToken, lpPairs[pairName].allocation);
    }
    
    function mintLPReward(string memory pairName, address recipient, uint256 amount) 
        external 
        nonReentrant 
    {
        require(msg.sender == protocolContract, "Only COLDL3Protocol can mint");
        
        LPPair storage pair = lpPairs[pairName];
        require(pair.active, "LP pair not active");
        require(pair.minted + amount <= pair.allocation, "Exceeds pair allocation");
        require(lpRewardsMinted + amount <= LP_REWARDS_ALLOCATION, "Exceeds LP allocation");
        
        pair.minted += amount;
        lpRewardsMinted += amount;
        
        _mint(recipient, amount);
        
        emit LPRewardMinted(pairName, recipient, amount);
    }
    
    // XFG Privacy Minting Functions (called by COLDL3Protocol after ZK verification)
    function executeXFGPrivacyMint(
        bytes32 depositHash,
        address recipient,
        uint256 coldReward
    ) external nonReentrant {
        require(msg.sender == protocolContract, "Only COLDL3Protocol can mint");
        require(coldReward > 0, "COLD reward must be positive");
        require(xfgPrivacyMinted + coldReward <= XFG_PRIVACY_ALLOCATION, "Exceeds XFG allocation");
        
        xfgPrivacyMinted += coldReward;
        
        _mint(recipient, coldReward);
        
        emit XFGPrivacyMinted(recipient, coldReward, depositHash);
    }
    
    // Admin Functions
    function setProtocolContract(address _protocolContract) external onlyOwner {
        require(_protocolContract != address(0), "Invalid protocol contract");
        protocolContract = _protocolContract;
        emit ProtocolContractUpdated(_protocolContract);
    }
    
    function setLPPairActive(string memory pairName, bool active) external onlyOwner {
        require(lpPairs[pairName].allocation > 0, "Invalid pair");
        lpPairs[pairName].active = active;
    }
    
    // View Functions
    function getRemainingLPAllocation(string memory pairName) external view returns (uint256) {
        LPPair memory pair = lpPairs[pairName];
        return pair.allocation > pair.minted ? pair.allocation - pair.minted : 0;
    }
    
    function getRemainingXFGAllocation() external view returns (uint256) {
        return XFG_PRIVACY_ALLOCATION > xfgPrivacyMinted ? 
               XFG_PRIVACY_ALLOCATION - xfgPrivacyMinted : 0;
    }
    
    function getTotalRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY > totalSupply() ? MAX_SUPPLY - totalSupply() : 0;
    }
    
    function getLPPairInfo(string memory pairName) external view returns (
        string memory name,
        address lpToken,
        uint256 allocation,
        uint256 minted,
        uint256 remaining,
        bool active
    ) {
        LPPair memory pair = lpPairs[pairName];
        return (
            pair.name,
            pair.lpToken,
            pair.allocation,
            pair.minted,
            pair.allocation > pair.minted ? pair.allocation - pair.minted : 0,
            pair.active
        );
    }
    
    function getAllSupportedPairs() external view returns (string[] memory) {
        return supportedPairs;
    }
    
    // Note: XFG deposit info is now tracked by COLDL3Protocol contract
    
    function getTokenomicsOverview() external view returns (
        uint256 maxSupply,
        uint256 currentSupply,
        uint256 lpAllocation,
        uint256 lpMinted,
        uint256 xfgAllocation,
        uint256 xfgMinted,
        uint256 remainingSupply
    ) {
        return (
            MAX_SUPPLY,
            totalSupply(),
            LP_REWARDS_ALLOCATION,
            lpRewardsMinted,
            XFG_PRIVACY_ALLOCATION,
            xfgPrivacyMinted,
            MAX_SUPPLY > totalSupply() ? MAX_SUPPLY - totalSupply() : 0
        );
    }
    
    // Required overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }
    
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
} 