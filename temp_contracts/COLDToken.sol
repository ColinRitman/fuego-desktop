// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title COLD Token
 * @dev The governance and utility token for the COLD L3 ecosystem
 * Features:
 * - Governance voting power
 * - L3 rollup fee discounts
 * - Privacy feature access
 * - Staking rewards
 * - Cross-chain bridging
 */
contract COLDToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    // Token constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion COLD
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million initial
    
    // L3 Integration
    address public l3Bridge;
    address public heatToken;
    mapping(address => bool) public l3Validators;
    
    // Governance
    mapping(address => uint256) public votingPower;
    mapping(address => uint256) public stakedBalance;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public constant PROPOSAL_THRESHOLD = 1_000_000 * 10**18; // 1M COLD to propose
    
    // Privacy features
    mapping(address => bool) public privacyAccess;
    uint256 public privacyAccessFee = 10_000 * 10**18; // 10K COLD for privacy access
    
    // Staking
    uint256 public totalStaked;
    uint256 public rewardRate = 500; // 5% APY (basis points)
    mapping(address => uint256) public lastRewardClaim;
    
    struct Proposal {
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        address proposer;
    }
    
    event L3BridgeSet(address indexed bridge);
    event HeatTokenSet(address indexed heatToken);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votes);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event PrivacyAccessGranted(address indexed user);
    
    constructor(address initialOwner) ERC20("COLD Token", "COLD")  Ownable(initialOwner) {
        _mint(msg.sender, INITIAL_SUPPLY);
        privacyAccess[msg.sender] = true;
    }
    
    // L3 Integration Functions
    function setL3Bridge(address _l3Bridge) external onlyOwner {
        require(_l3Bridge != address(0), "Invalid bridge address");
        l3Bridge = _l3Bridge;
        emit L3BridgeSet(_l3Bridge);
    }
    
    function setHeatToken(address _heatToken) external onlyOwner {
        require(_heatToken != address(0), "Invalid HEAT token address");
        heatToken = _heatToken;
        emit HeatTokenSet(_heatToken);
    }
    
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator address");
        l3Validators[validator] = true;
        emit ValidatorAdded(validator);
    }
    
    function removeValidator(address validator) external onlyOwner {
        l3Validators[validator] = false;
        emit ValidatorRemoved(validator);
    }
    
    // Governance Functions
    function createProposal(string memory description) external returns (uint256) {
        require(balanceOf(msg.sender) >= PROPOSAL_THRESHOLD, "Insufficient COLD for proposal");
        
        uint256 proposalId = proposalCount++;
        proposals[proposalId] = Proposal({
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + 7 days,
            executed: false,
            proposer: msg.sender
        });
        
        emit ProposalCreated(proposalId, msg.sender);
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        
        uint256 votes = votingPower[msg.sender] > 0 ? votingPower[msg.sender] : balanceOf(msg.sender);
        
        if (support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votes);
    }
    
    // Staking Functions
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim pending rewards first
        claimRewards();
        
        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        votingPower[msg.sender] = stakedBalance[msg.sender];
        lastRewardClaim[msg.sender] = block.timestamp;
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        // Claim pending rewards first
        claimRewards();
        
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        votingPower[msg.sender] = stakedBalance[msg.sender];
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimRewards() public nonReentrant {
        uint256 staked = stakedBalance[msg.sender];
        if (staked == 0) return;
        
        uint256 timeStaked = block.timestamp - lastRewardClaim[msg.sender];
        uint256 rewards = (staked * rewardRate * timeStaked) / (365 days * 10000);
        
        if (rewards > 0 && totalSupply() + rewards <= MAX_SUPPLY) {
            _mint(msg.sender, rewards);
            lastRewardClaim[msg.sender] = block.timestamp;
            emit RewardsClaimed(msg.sender, rewards);
        }
    }
    
    // Privacy Functions
    function grantPrivacyAccess() external {
        require(balanceOf(msg.sender) >= privacyAccessFee, "Insufficient COLD for privacy access");
        require(!privacyAccess[msg.sender], "Already has privacy access");
        
        _burn(msg.sender, privacyAccessFee);
        privacyAccess[msg.sender] = true;
        
        emit PrivacyAccessGranted(msg.sender);
    }
    
    function hasPrivacyAccess(address user) external view returns (bool) {
        return privacyAccess[user];
    }
    
    // L3 Fee Discount
    function getL3FeeDiscount(address user) external view returns (uint256) {
        uint256 balance = balanceOf(user);
        if (balance >= 1_000_000 * 10**18) return 50; // 50% discount for 1M+ COLD
        if (balance >= 100_000 * 10**18) return 25;   // 25% discount for 100K+ COLD
        if (balance >= 10_000 * 10**18) return 10;    // 10% discount for 10K+ COLD
        return 0;
    }
    
    // Admin Functions
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Reward rate too high"); // Max 20% APY
        rewardRate = newRate;
    }
    
    function setPrivacyAccessFee(uint256 newFee) external onlyOwner {
        privacyAccessFee = newFee;
    }
    
    // Override functions
    // View Functions
    function getProposal(uint256 proposalId) external view returns (
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startTime,
        uint256 endTime,
        bool executed,
        address proposer
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.proposer
        );
    }
    
    function getPendingRewards(address user) external view returns (uint256) {
        uint256 staked = stakedBalance[user];
        if (staked == 0) return 0;
        
        uint256 timeStaked = block.timestamp - lastRewardClaim[user];
        return (staked * rewardRate * timeStaked) / (365 days * 10000);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
} 