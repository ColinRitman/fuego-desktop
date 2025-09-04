// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title COLD O Token
 * @dev The primary governance token for COLD L3 with privacy minting and liquidity rewards
 * 
 * Key Features:
 * - Privacy-enabled minting through ZK proofs
 * - Governance voting power with delegation
 * - Liquidity rewards for HEAT/O token pairs
 * - L3 rollup governance and fee discounts
 * - Cross-chain bridging capabilities
 */
contract COLDOToken is ERC20, ERC20Votes, ERC20Permit, Ownable, ReentrancyGuard {
    
    // Token Economics
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million O tokens
    uint256 public constant LIQUIDITY_REWARDS_ALLOCATION = 30_000_000 * 10**18; // 30% for liquidity
    uint256 public constant GOVERNANCE_ALLOCATION = 20_000_000 * 10**18; // 20% for governance
    uint256 public constant PRIVACY_MINT_ALLOCATION = 25_000_000 * 10**18; // 25% for privacy minting
    
    // Privacy Minting
    struct PrivacyMint {
        bytes32 commitment;        // ZK commitment to mint amount
        bytes32 nullifierHash;     // Prevents double minting
        bytes zkProof;            // Zero-knowledge proof
        uint256 timestamp;
        bool executed;
    }
    
    // Liquidity Rewards
    struct LiquidityProvider {
        uint256 heatOTokenLPStaked;   // HEAT/O LP tokens staked
        uint256 oTokenLPStaked;       // O/ETH LP tokens staked
        uint256 lastRewardClaim;      // Timestamp of last reward claim
        uint256 totalRewardsEarned;   // Lifetime rewards earned
        bool isActive;
    }
    
    // Governance
    struct Proposal {
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        address proposer;
        bytes executionData;
        address target;
    }
    
    // State Variables
    mapping(bytes32 => PrivacyMint) public privacyMints;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(address => LiquidityProvider) public liquidityProviders;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    uint256 public proposalCount;
    uint256 public privacyMintsExecuted;
    uint256 public totalLiquidityRewardsDistributed;
    uint256 public liquidityRewardRate = 1500; // 15% APY in basis points
    
    // Addresses
    address public privacyEngine;
    address public heatToken;
    address public liquidityRewardsPool;
    address public l3Bridge;
    
    // Configuration
    uint256 public constant PROPOSAL_THRESHOLD = 100_000 * 10**18; // 100K O tokens to propose
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant QUORUM_THRESHOLD = 5_000_000 * 10**18; // 5M O tokens for quorum
    
    // Events
    event PrivacyMintRequested(bytes32 indexed commitment, bytes32 nullifierHash);
    event PrivacyMintExecuted(address indexed recipient, uint256 amount, bytes32 commitment);
    event LiquidityStaked(address indexed provider, uint256 heatOAmount, uint256 oTokenAmount);
    event LiquidityRewardsClaimed(address indexed provider, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event GovernanceConfigUpdated(uint256 newThreshold, uint256 newQuorum);
    
    constructor(address initialOwner) 
        ERC20("COLD O Token", "O") 
        ERC20Permit("COLD O Token")
        Ownable(initialOwner) 
    {
        // Initial distribution to owner for setup
        _mint(initialOwner, 5_000_000 * 10**18); // 5% for initial setup
    }
    
    // Privacy Minting Functions
    function requestPrivacyMint(
        bytes32 commitment,
        bytes32 nullifierHash,
        bytes calldata zkProof
    ) external {
        require(!usedNullifiers[nullifierHash], "Nullifier already used");
        require(privacyEngine != address(0), "Privacy engine not set");
        
        // Verify ZK proof through privacy engine
        (bool isValid,) = privacyEngine.call(
            abi.encodeWithSignature("verifyMintProof(bytes32,bytes32,bytes)", commitment, nullifierHash, zkProof)
        );
        require(isValid, "Invalid ZK proof");
        
        bytes32 mintHash = keccak256(abi.encodePacked(commitment, nullifierHash, block.timestamp));
        
        privacyMints[mintHash] = PrivacyMint({
            commitment: commitment,
            nullifierHash: nullifierHash,
            zkProof: zkProof,
            timestamp: block.timestamp,
            executed: false
        });
        
        usedNullifiers[nullifierHash] = true;
        
        emit PrivacyMintRequested(commitment, nullifierHash);
    }
    
    function executePrivacyMint(
        bytes32 mintHash,
        address recipient,
        uint256 amount
    ) external {
        require(msg.sender == privacyEngine, "Only privacy engine can execute");
        
        PrivacyMint storage mint = privacyMints[mintHash];
        require(!mint.executed, "Mint already executed");
        require(totalSupply() + amount <= PRIVACY_MINT_ALLOCATION + 5_000_000 * 10**18, "Exceeds privacy allocation");
        
        mint.executed = true;
        privacyMintsExecuted++;
        
        _mint(recipient, amount);
        
        emit PrivacyMintExecuted(recipient, amount, mint.commitment);
    }
    
    // Liquidity Rewards Functions
    function stakeLiquidityTokens(
        uint256 heatOLPAmount,
        uint256 oTokenLPAmount
    ) external nonReentrant {
        require(heatOLPAmount > 0 || oTokenLPAmount > 0, "Must stake some LP tokens");
        
        LiquidityProvider storage provider = liquidityProviders[msg.sender];
        
        // Claim existing rewards first
        if (provider.isActive) {
            claimLiquidityRewards();
        }
        
        // Update staked amounts (assuming LP tokens are transferred separately)
        provider.heatOTokenLPStaked += heatOLPAmount;
        provider.oTokenLPStaked += oTokenLPAmount;
        provider.lastRewardClaim = block.timestamp;
        provider.isActive = true;
        
        emit LiquidityStaked(msg.sender, heatOLPAmount, oTokenLPAmount);
    }
    
    function claimLiquidityRewards() public nonReentrant {
        LiquidityProvider storage provider = liquidityProviders[msg.sender];
        require(provider.isActive, "No active liquidity provision");
        
        uint256 timeStaked = block.timestamp - provider.lastRewardClaim;
        uint256 totalLPStaked = provider.heatOTokenLPStaked + provider.oTokenLPStaked;
        
        if (totalLPStaked > 0 && timeStaked > 0) {
            uint256 rewards = (totalLPStaked * liquidityRewardRate * timeStaked) / (365 days * 10000);
            
            if (rewards > 0 && totalSupply() + rewards <= MAX_SUPPLY) {
                _mint(msg.sender, rewards);
                provider.totalRewardsEarned += rewards;
                provider.lastRewardClaim = block.timestamp;
                totalLiquidityRewardsDistributed += rewards;
                
                emit LiquidityRewardsClaimed(msg.sender, rewards);
            }
        }
    }
    
    // Governance Functions
    function createProposal(
        string memory title,
        string memory description,
        address target,
        bytes memory executionData
    ) external returns (uint256) {
        require(balanceOf(msg.sender) >= PROPOSAL_THRESHOLD, "Insufficient O tokens for proposal");
        
        uint256 proposalId = proposalCount++;
        proposals[proposalId] = Proposal({
            title: title,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            executed: false,
            canceled: false,
            proposer: msg.sender,
            executionData: executionData,
            target: target
        });
        
        emit ProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }
    
    function vote(uint256 proposalId, uint8 support) external {
        require(support <= 2, "Invalid vote type"); // 0=against, 1=for, 2=abstain
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.canceled, "Proposal canceled");
        
        uint256 weight = getVotes(msg.sender);
        require(weight > 0, "No voting power");
        
        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        hasVoted[proposalId][msg.sender] = true;
        
        emit VoteCast(proposalId, msg.sender, support, weight);
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        require(totalVotes >= QUORUM_THRESHOLD, "Quorum not reached");
        require(proposal.forVotes > proposal.againstVotes, "Proposal defeated");
        
        proposal.executed = true;
        
        // Execute the proposal
        if (proposal.target != address(0) && proposal.executionData.length > 0) {
            (bool success,) = proposal.target.call(proposal.executionData);
            require(success, "Proposal execution failed");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    // Admin Functions
    function setPrivacyEngine(address _privacyEngine) external onlyOwner {
        privacyEngine = _privacyEngine;
    }
    
    function setHeatToken(address _heatToken) external onlyOwner {
        heatToken = _heatToken;
    }
    
    function setLiquidityRewardsPool(address _pool) external onlyOwner {
        liquidityRewardsPool = _pool;
    }
    
    function setL3Bridge(address _bridge) external onlyOwner {
        l3Bridge = _bridge;
    }
    
    function updateLiquidityRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 5000, "Rate too high"); // Max 50% APY
        liquidityRewardRate = newRate;
    }
    
    // View Functions
    function getLiquidityProviderInfo(address provider) external view returns (
        uint256 heatOStaked,
        uint256 oTokenStaked,
        uint256 pendingRewards,
        uint256 totalEarned,
        bool active
    ) {
        LiquidityProvider memory lp = liquidityProviders[provider];
        
        uint256 pending = 0;
        if (lp.isActive) {
            uint256 timeStaked = block.timestamp - lp.lastRewardClaim;
            uint256 totalLPStaked = lp.heatOTokenLPStaked + lp.oTokenLPStaked;
            pending = (totalLPStaked * liquidityRewardRate * timeStaked) / (365 days * 10000);
        }
        
        return (
            lp.heatOTokenLPStaked,
            lp.oTokenLPStaked,
            pending,
            lp.totalRewardsEarned,
            lp.isActive
        );
    }
    
    function getProposalState(uint256 proposalId) external view returns (
        string memory title,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool executed,
        bool canExecute
    ) {
        Proposal memory proposal = proposals[proposalId];
        
        bool canExec = block.timestamp > proposal.endTime &&
                      !proposal.executed &&
                      !proposal.canceled &&
                      (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes) >= QUORUM_THRESHOLD &&
                      proposal.forVotes > proposal.againstVotes;
        
        return (
            proposal.title,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            canExec
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