// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICOLDL3Token {
    function mintLPReward(string memory pairName, address recipient, uint256 amount) external;
    function getRemainingLPAllocation(string memory pairName) external view returns (uint256);
    function getLPPairInfo(string memory pairName) external view returns (
        string memory name,
        address lpToken,
        uint256 allocation,
        uint256 minted,
        uint256 remaining,
        bool active
    );
}

/**
 * @title COLD L3 Liquidity Rewards
 * @dev Manages LP rewards for O/ETH, O/DIA, HEAT/ETH, HEAT/DIA pairs
 * Distributes ultra-scarce COLD tokens (12 total) to liquidity providers
 */
contract COLDL3LiquidityRewards is ReentrancyGuard, Ownable {
    
    struct LiquidityProvider {
        uint256 oETHLPStaked;      // O/ETH LP tokens staked
        uint256 oDIALPStaked;      // O/DIA LP tokens staked  
        uint256 heatETHLPStaked;   // HEAT/ETH LP tokens staked
        uint256 heatDIALPStaked;   // HEAT/DIA LP tokens staked
        uint256 lastRewardClaim;   // Last time rewards were claimed
        uint256 totalCOLDEarned;   // Total COLD earned (lifetime)
        bool isActive;
    }
    
    struct PairRewards {
        uint256 totalStaked;           // Total LP tokens staked for this pair
        uint256 rewardRate;            // COLD rewards per second per LP token
        uint256 lastRewardUpdate;      // Last time reward rate was updated
        uint256 accCOLDPerShare;       // Accumulated COLD per share
        uint256 totalCOLDDistributed;  // Total COLD distributed for this pair
        bool active;
    }
    
    // State mappings
    mapping(address => LiquidityProvider) public liquidityProviders;
    mapping(string => PairRewards) public pairRewards;
    mapping(string => IERC20) public lpTokens;
    
    // Contract references
    ICOLDL3Token public coldL3Token;
    IERC20 public oToken;
    IERC20 public heatToken;
    
    // Supported pairs
    string[] public supportedPairs = ["O/ETH", "O/DIA", "HEAT/ETH", "HEAT/DIA"];
    
    // Configuration
    uint256 public constant PRECISION = 1e18;
    uint256 public totalUniqueProviders;
    
    // Events
    event LiquidityStaked(
        address indexed provider, 
        string indexed pairName, 
        uint256 amount
    );
    event LiquidityUnstaked(
        address indexed provider,
        string indexed pairName, 
        uint256 amount
    );
    event COLDRewardsClaimed(
        address indexed provider,
        string indexed pairName,
        uint256 coldAmount
    );
    event PairRewardRateUpdated(string indexed pairName, uint256 newRate);
    event LPTokenSet(string indexed pairName, address lpToken);
    
    constructor(address initialOwner, address _coldL3Token) Ownable(initialOwner) {
        coldL3Token = ICOLDL3Token(_coldL3Token);
        
        // Initialize pair rewards with equal distribution
        // 3 COLD per pair / (365 days * 24 hours * 3600 seconds) = rate per second
        uint256 baseRate = (3 * 10**18) / (365 days);
        
        for (uint i = 0; i < supportedPairs.length; i++) {
            pairRewards[supportedPairs[i]] = PairRewards({
                totalStaked: 0,
                rewardRate: baseRate,
                lastRewardUpdate: block.timestamp,
                accCOLDPerShare: 0,
                totalCOLDDistributed: 0,
                active: true
            });
        }
    }
    
    // Staking Functions
    function stakeLiquidity(string memory pairName, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(pairRewards[pairName].active, "Pair not active");
        require(address(lpTokens[pairName]) != address(0), "LP token not set");
        
        // Update rewards before changing stake
        updatePairRewards(pairName);
        claimPairRewards(pairName);
        
        // Transfer LP tokens to contract
        lpTokens[pairName].transferFrom(msg.sender, address(this), amount);
        
        // Update provider stake
        LiquidityProvider storage provider = liquidityProviders[msg.sender];
        if (!provider.isActive) {
            provider.isActive = true;
            totalUniqueProviders++;
        }
        
        // Update specific pair stake
        if (keccak256(bytes(pairName)) == keccak256(bytes("O/ETH"))) {
            provider.oETHLPStaked += amount;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("O/DIA"))) {
            provider.oDIALPStaked += amount;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("HEAT/ETH"))) {
            provider.heatETHLPStaked += amount;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("HEAT/DIA"))) {
            provider.heatDIALPStaked += amount;
        }
        
        provider.lastRewardClaim = block.timestamp;
        pairRewards[pairName].totalStaked += amount;
        
        emit LiquidityStaked(msg.sender, pairName, amount);
    }
    
    function unstakeLiquidity(string memory pairName, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        
        LiquidityProvider storage provider = liquidityProviders[msg.sender];
        uint256 currentStake = getProviderStakeForPair(msg.sender, pairName);
        require(currentStake >= amount, "Insufficient stake");
        
        // Update rewards before changing stake
        updatePairRewards(pairName);
        claimPairRewards(pairName);
        
        // Update specific pair stake
        if (keccak256(bytes(pairName)) == keccak256(bytes("O/ETH"))) {
            provider.oETHLPStaked -= amount;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("O/DIA"))) {
            provider.oDIALPStaked -= amount;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("HEAT/ETH"))) {
            provider.heatETHLPStaked -= amount;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("HEAT/DIA"))) {
            provider.heatDIALPStaked -= amount;
        }
        
        pairRewards[pairName].totalStaked -= amount;
        
        // Transfer LP tokens back to provider
        lpTokens[pairName].transfer(msg.sender, amount);
        
        emit LiquidityUnstaked(msg.sender, pairName, amount);
    }
    
    // Rewards Functions
    function updatePairRewards(string memory pairName) public {
        PairRewards storage pair = pairRewards[pairName];
        
        if (block.timestamp <= pair.lastRewardUpdate || pair.totalStaked == 0) {
            pair.lastRewardUpdate = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pair.lastRewardUpdate;
        uint256 coldReward = timeElapsed * pair.rewardRate;
        
        // Check if we can still distribute COLD for this pair
        uint256 remainingAllocation = coldL3Token.getRemainingLPAllocation(pairName);
        if (coldReward > remainingAllocation) {
            coldReward = remainingAllocation;
        }
        
        if (coldReward > 0) {
            pair.accCOLDPerShare += (coldReward * PRECISION) / pair.totalStaked;
        }
        
        pair.lastRewardUpdate = block.timestamp;
    }
    
    function claimPairRewards(string memory pairName) public nonReentrant {
        updatePairRewards(pairName);
        
        LiquidityProvider storage provider = liquidityProviders[msg.sender];
        uint256 providerStake = getProviderStakeForPair(msg.sender, pairName);
        
        if (providerStake > 0) {
            PairRewards storage pair = pairRewards[pairName];
            uint256 pendingCOLD = (providerStake * pair.accCOLDPerShare) / PRECISION;
            
            if (pendingCOLD > 0) {
                // Mint COLD tokens through the COLD L3 token contract
                coldL3Token.mintLPReward(pairName, msg.sender, pendingCOLD);
                
                provider.totalCOLDEarned += pendingCOLD;
                pair.totalCOLDDistributed += pendingCOLD;
                
                emit COLDRewardsClaimed(msg.sender, pairName, pendingCOLD);
            }
        }
        
        provider.lastRewardClaim = block.timestamp;
    }
    
    function claimAllRewards() external {
        for (uint i = 0; i < supportedPairs.length; i++) {
            string memory pairName = supportedPairs[i];
            if (getProviderStakeForPair(msg.sender, pairName) > 0) {
                claimPairRewards(pairName);
            }
        }
    }
    
    // Admin Functions
    function setLPToken(string memory pairName, address lpTokenAddress) external onlyOwner {
        require(lpTokenAddress != address(0), "Invalid LP token address");
        lpTokens[pairName] = IERC20(lpTokenAddress);
        emit LPTokenSet(pairName, lpTokenAddress);
    }
    
    function setTokens(address _oToken, address _heatToken) external onlyOwner {
        oToken = IERC20(_oToken);
        heatToken = IERC20(_heatToken);
    }
    
    function setPairRewardRate(string memory pairName, uint256 newRate) external onlyOwner {
        updatePairRewards(pairName);
        pairRewards[pairName].rewardRate = newRate;
        emit PairRewardRateUpdated(pairName, newRate);
    }
    
    function setPairActive(string memory pairName, bool active) external onlyOwner {
        pairRewards[pairName].active = active;
    }
    
    // View Functions
    function getProviderStakeForPair(address provider, string memory pairName) 
        public view returns (uint256) 
    {
        LiquidityProvider memory lp = liquidityProviders[provider];
        
        if (keccak256(bytes(pairName)) == keccak256(bytes("O/ETH"))) {
            return lp.oETHLPStaked;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("O/DIA"))) {
            return lp.oDIALPStaked;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("HEAT/ETH"))) {
            return lp.heatETHLPStaked;
        } else if (keccak256(bytes(pairName)) == keccak256(bytes("HEAT/DIA"))) {
            return lp.heatDIALPStaked;
        }
        
        return 0;
    }
    
    function getPendingCOLDRewards(address provider, string memory pairName) 
        external view returns (uint256) 
    {
        uint256 providerStake = getProviderStakeForPair(provider, pairName);
        if (providerStake == 0) return 0;
        
        PairRewards memory pair = pairRewards[pairName];
        uint256 accCOLDPerShare = pair.accCOLDPerShare;
        
        if (block.timestamp > pair.lastRewardUpdate && pair.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - pair.lastRewardUpdate;
            uint256 coldReward = timeElapsed * pair.rewardRate;
            
            // Check remaining allocation
            uint256 remainingAllocation = coldL3Token.getRemainingLPAllocation(pairName);
            if (coldReward > remainingAllocation) {
                coldReward = remainingAllocation;
            }
            
            accCOLDPerShare += (coldReward * PRECISION) / pair.totalStaked;
        }
        
        return (providerStake * accCOLDPerShare) / PRECISION;
    }
    
    function getProviderInfo(address provider) external view returns (
        uint256 oETHStaked,
        uint256 oDIAStaked,
        uint256 heatETHStaked,
        uint256 heatDIAStaked,
        uint256 totalCOLDEarned,
        bool isActive
    ) {
        LiquidityProvider memory lp = liquidityProviders[provider];
        return (
            lp.oETHLPStaked,
            lp.oDIALPStaked,
            lp.heatETHLPStaked,
            lp.heatDIALPStaked,
            lp.totalCOLDEarned,
            lp.isActive
        );
    }
    
    function getPairInfo(string memory pairName) external view returns (
        uint256 totalStaked,
        uint256 rewardRate,
        uint256 totalCOLDDistributed,
        uint256 remainingAllocation,
        bool active
    ) {
        PairRewards memory pair = pairRewards[pairName];
        uint256 remaining = coldL3Token.getRemainingLPAllocation(pairName);
        
        return (
            pair.totalStaked,
            pair.rewardRate,
            pair.totalCOLDDistributed,
            remaining,
            pair.active
        );
    }
    
    function getAllSupportedPairs() external view returns (string[] memory) {
        return supportedPairs;
    }
} 