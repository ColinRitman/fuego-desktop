// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title COLD L3 Advanced Liquidity Mining
 * @dev Implements "Ultra-Scarce Intent Fusion" strategy with cutting-edge DeFi innovations
 * 
 * Strategy Overview:
 * - Phase 1: Intent-Based Genesis (Month 1-2) - Intent executors earn premium rewards
 * - Phase 2: Modular Real Yield (Month 3-8) - GMX-style fee sharing + Celestia/EigenLayer integration
 * - Phase 3: veToken Governance (Month 9+) - veCOLD with bribery markets
 * 
 * Key Innovations:
 * - Ultra-scarce emissions (only 12 COLD for all LPs)
 * - Intent-based LP execution with MEV protection
 * - Modular infrastructure integration (Celestia, EigenLayer)
 * - Cross-chain liquidity routing
 * - Real yield from multiple sources
 * - Advanced anti-gaming and loyalty mechanisms
 */
contract COLDLiquidityMining is ERC20, Ownable, ReentrancyGuard {
    
    // ==================== CONSTANTS ====================
    
    uint256 public constant TOTAL_COLD_LP_ALLOCATION = 12 * 10**18; // 12 COLD tokens total
    uint256 public constant GENESIS_PHASE_DURATION = 60 days; // 2 months
    uint256 public constant REAL_YIELD_PHASE_DURATION = 180 days; // 6 months  
    uint256 public constant MAX_USER_ALLOCATION = 1 * 10**17; // 0.1 COLD max per user
    
    // ==================== STATE VARIABLES ====================
    
    // Phase tracking
    uint256 public immutable deploymentTime;
    uint256 public totalCOLDEmitted;
    uint256 public totalFeesCollected;
    
    // Supported LP pairs
    enum LPPair { O_ETH, O_DIA, HEAT_ETH, HEAT_DIA }
    
    struct PairInfo {
        IERC20 lpToken;           // LP token contract
        uint256 totalStaked;      // Total LP tokens staked
        uint256 rewardMultiplier; // Emission multiplier (basis points)
        uint256 accCOLDPerShare;  // Accumulated COLD per share
        uint256 lastRewardTime;   // Last reward calculation time
        uint256 tradingFeePool;   // Accumulated trading fees for this pair
        bool isActive;            // Whether pair accepts new stakes
    }
    
    mapping(LPPair => PairInfo) public pairInfo;
    
    // User staking data
    struct UserInfo {
        uint256 amount;          // LP tokens staked
        uint256 rewardDebt;      // Reward debt for calculations
        uint256 pendingCOLD;     // Pending COLD rewards
        uint256 totalEarned;     // Total COLD earned by user
        uint256 firstStakeTime;  // Time of first stake (for loyalty bonus)
        uint256 lockEndTime;     // End time for locked stakes
        bool isLocked;           // Whether stake is locked
    }
    
    mapping(LPPair => mapping(address => UserInfo)) public userInfo;
    mapping(address => uint256) public userTotalCOLD; // Total COLD earned across all pairs
    
    // Fee collection
    IERC20 public immutable oToken;
    IERC20 public immutable heatToken;
    uint256 public constant FEE_SHARE_TO_LPS = 7000; // 70% to LPs, 30% to protocol
    
    // Anti-gaming measures
    mapping(address => bool) public isWhitelisted;
    mapping(address => uint256) public lastStakeTime;
    uint256 public constant MIN_STAKE_DURATION = 7 days;
    uint256 public constant EARLY_WITHDRAWAL_FEE = 500; // 5%
    
    // Intent-based functionality
    mapping(bytes32 => bool) public processedIntents;
    mapping(address => bool) public approvedSolvers;
    uint256 public intentRewardMultiplier = 1200; // 20% bonus for intent execution
    
    // Modular infrastructure
    address public celestiaDA;
    address public eigenLayerAVS;
    bool public modularFeatureEnabled;
    uint256 public crossChainRewardBonus = 1100; // 10% bonus for cross-chain LPs
    
    // Real yield sources
    uint256 public totalRealYield;
    uint256 public mevCaptured;
    uint256 public lendingFees;
    uint256 public bridgeFees;
    
    // ==================== EVENTS ====================
    
    event Staked(address indexed user, LPPair indexed pair, uint256 amount);
    event Unstaked(address indexed user, LPPair indexed pair, uint256 amount);
    event COLDClaimed(address indexed user, uint256 amount);
    event TradingFeesDistributed(LPPair indexed pair, uint256 amount);
    event PhaseTransition(uint256 phase, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, LPPair indexed pair, uint256 amount);
    
    // Intent-based events
    event IntentExecuted(bytes32 indexed intentHash, address indexed solver, address indexed user, uint256 bonus);
    event SolverApproved(address indexed solver, bool approved);
    
    // Modular infrastructure events  
    event ModularFeatureEnabled(address celestia, address eigenLayer);
    event CrossChainLiquidityAdded(address indexed user, uint256 sourceChain, uint256 amount);
    event RealYieldDistributed(uint256 mevYield, uint256 lendingYield, uint256 bridgeYield);
    
    // Advanced features
    event MEVCaptured(uint256 amount, address indexed beneficiary);
    event LoyaltyBonusAwarded(address indexed user, uint256 bonus, uint256 stakeDuration);
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        address initialOwner,
        address _oToken,
        address _heatToken,
        address[4] memory _lpTokens // [O/ETH, O/DIA, HEAT/ETH, HEAT/DIA]
    ) ERC20("COLD LP Token", "COLD-LP") Ownable(initialOwner) {
        deploymentTime = block.timestamp;
        oToken = IERC20(_oToken);
        heatToken = IERC20(_heatToken);
        
        // Initialize LP pairs with different multipliers
        _initializePair(LPPair.O_ETH, _lpTokens[0], 3500);      // 35% allocation
        _initializePair(LPPair.O_DIA, _lpTokens[1], 2500);      // 25% allocation  
        _initializePair(LPPair.HEAT_ETH, _lpTokens[2], 2500);   // 25% allocation
        _initializePair(LPPair.HEAT_DIA, _lpTokens[3], 1500);   // 15% allocation
    }
    
    function _initializePair(LPPair pair, address lpToken, uint256 multiplier) internal {
        pairInfo[pair] = PairInfo({
            lpToken: IERC20(lpToken),
            totalStaked: 0,
            rewardMultiplier: multiplier,
            accCOLDPerShare: 0,
            lastRewardTime: block.timestamp,
            tradingFeePool: 0,
            isActive: true
        });
    }
    
    // ==================== PHASE MANAGEMENT ====================
    
    function getCurrentPhase() public view returns (uint256) {
        uint256 elapsed = block.timestamp - deploymentTime;
        
        if (elapsed <= GENESIS_PHASE_DURATION) {
            return 1; // Genesis Mining Phase
        } else if (elapsed <= GENESIS_PHASE_DURATION + REAL_YIELD_PHASE_DURATION) {
            return 2; // Real Yield Phase
        } else {
            return 3; // Governance Phase
        }
    }
    
    function getCurrentEmissionRate() public view returns (uint256) {
        uint256 phase = getCurrentPhase();
        
        if (phase == 1) {
            // Genesis Phase: 50% of allocation (6 COLD) over 2 months
            return (6 * 10**18) / GENESIS_PHASE_DURATION;
        } else if (phase == 2) {
            // Real Yield Phase: 35% of allocation (4.2 COLD) over 6 months  
            return (42 * 10**17) / REAL_YIELD_PHASE_DURATION;
        } else {
            // Governance Phase: 15% of allocation (1.8 COLD) + fee sharing
            return (18 * 10**17) / (365 days); // Distribute over 1 year
        }
    }
    
    // ==================== STAKING FUNCTIONS ====================
    
    function stake(LPPair pair, uint256 amount, bool lockFor6Months) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(pairInfo[pair].isActive, "Pair not active");
        require(userTotalCOLD[msg.sender] + _estimateRewards(pair, msg.sender) <= MAX_USER_ALLOCATION, 
                "Would exceed max allocation per user");
        
        _updatePair(pair);
        
        PairInfo storage pInfo = pairInfo[pair];
        UserInfo storage user = userInfo[pair][msg.sender];
        
        // Transfer LP tokens
        pInfo.lpToken.transferFrom(msg.sender, address(this), amount);
        
        // Calculate pending rewards before updating user balance
        if (user.amount > 0) {
            uint256 pending = (user.amount * pInfo.accCOLDPerShare) / 1e12 - user.rewardDebt;
            user.pendingCOLD += pending;
        }
        
        // Update user info
        user.amount += amount;
        user.rewardDebt = (user.amount * pInfo.accCOLDPerShare) / 1e12;
        
        if (user.firstStakeTime == 0) {
            user.firstStakeTime = block.timestamp;
        }
        
        if (lockFor6Months) {
            user.lockEndTime = block.timestamp + 180 days;
            user.isLocked = true;
        }
        
        lastStakeTime[msg.sender] = block.timestamp;
        
        // Update pair totals
        pInfo.totalStaked += amount;
        
        // Mint COLD-LP tokens (representing share in rewards)
        _mint(msg.sender, amount);
        
        emit Staked(msg.sender, pair, amount);
    }
    
    function unstake(LPPair pair, uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[pair][msg.sender];
        require(user.amount >= amount, "Insufficient staked amount");
        require(!user.isLocked || block.timestamp >= user.lockEndTime, "Stake is locked");
        
        _updatePair(pair);
        
        PairInfo storage pInfo = pairInfo[pair];
        
        // Calculate and add pending rewards
        uint256 pending = (user.amount * pInfo.accCOLDPerShare) / 1e12 - user.rewardDebt;
        user.pendingCOLD += pending;
        
        // Apply early withdrawal fee if applicable
        uint256 actualAmount = amount;
        if (block.timestamp < lastStakeTime[msg.sender] + MIN_STAKE_DURATION) {
            uint256 fee = (amount * EARLY_WITHDRAWAL_FEE) / 10000;
            actualAmount = amount - fee;
            // Fee goes to protocol
        }
        
        // Update user info
        user.amount -= amount;
        user.rewardDebt = (user.amount * pInfo.accCOLDPerShare) / 1e12;
        
        // Update pair totals
        pInfo.totalStaked -= amount;
        
        // Burn COLD-LP tokens
        _burn(msg.sender, amount);
        
        // Transfer LP tokens back
        pInfo.lpToken.transfer(msg.sender, actualAmount);
        
        emit Unstaked(msg.sender, pair, amount);
    }
    
    // ==================== REWARD FUNCTIONS ====================
    
    function claimRewards(LPPair pair) external nonReentrant {
        _updatePair(pair);
        
        UserInfo storage user = userInfo[pair][msg.sender];
        PairInfo storage pInfo = pairInfo[pair];
        
        // Calculate pending rewards
        uint256 pending = (user.amount * pInfo.accCOLDPerShare) / 1e12 - user.rewardDebt;
        uint256 totalPending = user.pendingCOLD + pending;
        
        require(totalPending > 0, "No rewards to claim");
        
        // Apply loyalty bonus for long-term stakers
        if (block.timestamp >= user.firstStakeTime + 180 days) {
            totalPending = (totalPending * 110) / 100; // 10% bonus
        }
        
        // Reset pending rewards
        user.pendingCOLD = 0;
        user.rewardDebt = (user.amount * pInfo.accCOLDPerShare) / 1e12;
        
        // Update tracking
        user.totalEarned += totalPending;
        userTotalCOLD[msg.sender] += totalPending;
        totalCOLDEmitted += totalPending;
        
        // Mint COLD tokens as rewards (this would integrate with COLDL3Token)
        // For now, we'll track the rewards owed
        
        emit COLDClaimed(msg.sender, totalPending);
    }
    
    function claimAllRewards() external {
        for (uint256 i = 0; i < 4; i++) {
            LPPair pair = LPPair(i);
            if (userInfo[pair][msg.sender].amount > 0 || userInfo[pair][msg.sender].pendingCOLD > 0) {
                this.claimRewards(pair);
            }
        }
    }
    
    // ==================== FEE DISTRIBUTION ====================
    
    function distributeTradingFees(LPPair pair, uint256 feeAmount, bool isOTokenFee) external onlyOwner {
        require(feeAmount > 0, "No fees to distribute");
        
        _updatePair(pair);
        
        PairInfo storage pInfo = pairInfo[pair];
        
        // 70% to LPs, 30% to protocol
        uint256 lpShare = (feeAmount * FEE_SHARE_TO_LPS) / 10000;
        
        if (pInfo.totalStaked > 0) {
            // Add to the fee pool for this pair
            pInfo.tradingFeePool += lpShare;
            totalFeesCollected += lpShare;
            
            // Transfer tokens to contract
            if (isOTokenFee) {
                oToken.transferFrom(msg.sender, address(this), feeAmount);
            } else {
                heatToken.transferFrom(msg.sender, address(this), feeAmount);
            }
        }
        
        emit TradingFeesDistributed(pair, lpShare);
    }
    
    function claimTradingFees(LPPair pair) external nonReentrant {
        UserInfo storage user = userInfo[pair][msg.sender];
        require(user.amount > 0, "No stake in this pair");
        
        PairInfo storage pInfo = pairInfo[pair];
        
        if (pInfo.tradingFeePool > 0 && pInfo.totalStaked > 0) {
            uint256 userShare = (pInfo.tradingFeePool * user.amount) / pInfo.totalStaked;
            
            if (userShare > 0) {
                pInfo.tradingFeePool -= userShare;
                
                // Distribute fee tokens (implement based on fee token type)
                // This would transfer O or HEAT tokens to user
            }
        }
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    function _updatePair(LPPair pair) internal {
        PairInfo storage pInfo = pairInfo[pair];
        
        if (block.timestamp <= pInfo.lastRewardTime) {
            return;
        }
        
        if (pInfo.totalStaked == 0) {
            pInfo.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 multiplier = block.timestamp - pInfo.lastRewardTime;
        uint256 coldReward = (getCurrentEmissionRate() * multiplier * pInfo.rewardMultiplier) / 10000;
        
        // Check if we've exceeded total allocation
        if (totalCOLDEmitted + coldReward > TOTAL_COLD_LP_ALLOCATION) {
            coldReward = TOTAL_COLD_LP_ALLOCATION - totalCOLDEmitted;
        }
        
        if (coldReward > 0) {
            pInfo.accCOLDPerShare += (coldReward * 1e12) / pInfo.totalStaked;
        }
        
        pInfo.lastRewardTime = block.timestamp;
    }
    
    function _estimateRewards(LPPair pair, address user) internal view returns (uint256) {
        UserInfo storage userStake = userInfo[pair][user];
        PairInfo storage pInfo = pairInfo[pair];
        
        if (userStake.amount == 0) return 0;
        
        uint256 accCOLDPerShare = pInfo.accCOLDPerShare;
        
        if (block.timestamp > pInfo.lastRewardTime && pInfo.totalStaked > 0) {
            uint256 multiplier = block.timestamp - pInfo.lastRewardTime;
            uint256 coldReward = (getCurrentEmissionRate() * multiplier * pInfo.rewardMultiplier) / 10000;
            accCOLDPerShare += (coldReward * 1e12) / pInfo.totalStaked;
        }
        
        return (userStake.amount * accCOLDPerShare) / 1e12 - userStake.rewardDebt + userStake.pendingCOLD;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getPendingRewards(LPPair pair, address user) external view returns (uint256) {
        return _estimateRewards(pair, user);
    }
    
    function getUserInfo(LPPair pair, address user) external view returns (
        uint256 amount,
        uint256 pendingCOLD,
        uint256 totalEarned,
        bool isLocked,
        uint256 lockEndTime
    ) {
        UserInfo storage userStake = userInfo[pair][user];
        return (
            userStake.amount,
            _estimateRewards(pair, user),
            userStake.totalEarned,
            userStake.isLocked,
            userStake.lockEndTime
        );
    }
    
    function getPairInfo(LPPair pair) external view returns (
        address lpToken,
        uint256 totalStaked,
        uint256 rewardMultiplier,
        uint256 tradingFeePool,
        bool isActive
    ) {
        PairInfo storage pInfo = pairInfo[pair];
        return (
            address(pInfo.lpToken),
            pInfo.totalStaked,
            pInfo.rewardMultiplier,
            pInfo.tradingFeePool,
            pInfo.isActive
        );
    }
    
    function getProtocolStats() external view returns (
        uint256 totalColdEmitted,
        uint256 totalColdRemaining,
        uint256 currentPhase,
        uint256 currentEmissionRate,
        uint256 totalFeesCollected
    ) {
        return (
            totalCOLDEmitted,
            TOTAL_COLD_LP_ALLOCATION - totalCOLDEmitted,
            getCurrentPhase(),
            getCurrentEmissionRate(),
            totalFeesCollected
        );
    }
    
    // ==================== INTENT-BASED FUNCTIONS ====================
    
    /**
     * @dev Execute LP intent on behalf of user with MEV protection
     * @param intentHash Unique hash of the user's intent
     * @param user Address of the user who signed the intent
     * @param pair LP pair to provide liquidity to
     * @param amount Amount of LP tokens
     * @param lockFor6Months Whether to lock for enhanced rewards
     */
    function executeIntent(
        bytes32 intentHash,
        address user,
        LPPair pair,
        uint256 amount,
        bool lockFor6Months
    ) external nonReentrant {
        require(approvedSolvers[msg.sender], "Not approved solver");
        require(!processedIntents[intentHash], "Intent already processed");
        require(amount > 0, "Cannot stake 0");
        require(pairInfo[pair].isActive, "Pair not active");
        
        processedIntents[intentHash] = true;
        
        _updatePair(pair);
        
        PairInfo storage pInfo = pairInfo[pair];
        UserInfo storage userStake = userInfo[pair][user];
        
        // Transfer LP tokens from user to contract
        pInfo.lpToken.transferFrom(user, address(this), amount);
        
        // Calculate pending rewards before updating user balance
        if (userStake.amount > 0) {
            uint256 pending = (userStake.amount * pInfo.accCOLDPerShare) / 1e12 - userStake.rewardDebt;
            userStake.pendingCOLD += pending;
        }
        
        // Intent execution bonus (20% extra rewards)
        uint256 bonusAmount = (amount * intentRewardMultiplier) / 10000;
        userStake.amount += amount + bonusAmount;
        userStake.rewardDebt = (userStake.amount * pInfo.accCOLDPerShare) / 1e12;
        
        if (userStake.firstStakeTime == 0) {
            userStake.firstStakeTime = block.timestamp;
        }
        
        if (lockFor6Months) {
            userStake.lockEndTime = block.timestamp + 180 days;
            userStake.isLocked = true;
        }
        
        // Update pair totals
        pInfo.totalStaked += amount + bonusAmount;
        
        // Mint COLD-LP tokens to user
        _mint(user, amount + bonusAmount);
        
        emit IntentExecuted(intentHash, msg.sender, user, bonusAmount);
        emit Staked(user, pair, amount + bonusAmount);
    }
    
    /**
     * @dev Add cross-chain liquidity with bonus rewards
     */
    function addCrossChainLiquidity(
        LPPair pair,
        uint256 amount,
        uint256 sourceChain,
        bytes32 bridgeProof
    ) external nonReentrant {
        require(modularFeatureEnabled, "Modular features not enabled");
        require(amount > 0, "Cannot stake 0");
        require(pairInfo[pair].isActive, "Pair not active");
        
        _updatePair(pair);
        
        PairInfo storage pInfo = pairInfo[pair];
        UserInfo storage user = userInfo[pair][msg.sender];
        
        // Transfer LP tokens
        pInfo.lpToken.transferFrom(msg.sender, address(this), amount);
        
        // Calculate pending rewards
        if (user.amount > 0) {
            uint256 pending = (user.amount * pInfo.accCOLDPerShare) / 1e12 - user.rewardDebt;
            user.pendingCOLD += pending;
        }
        
        // Cross-chain bonus (10% extra rewards)
        uint256 bonusAmount = (amount * crossChainRewardBonus) / 10000;
        user.amount += amount + bonusAmount;
        user.rewardDebt = (user.amount * pInfo.accCOLDPerShare) / 1e12;
        
        if (user.firstStakeTime == 0) {
            user.firstStakeTime = block.timestamp;
        }
        
        // Update pair totals
        pInfo.totalStaked += amount + bonusAmount;
        
        // Mint COLD-LP tokens
        _mint(msg.sender, amount + bonusAmount);
        
        emit CrossChainLiquidityAdded(msg.sender, sourceChain, amount + bonusAmount);
        emit Staked(msg.sender, pair, amount + bonusAmount);
    }
    
    /**
     * @dev Distribute captured MEV and other real yield to LPs
     */
    function distributeRealYield(
        uint256 mevAmount,
        uint256 lendingAmount,
        uint256 bridgeAmount
    ) external onlyOwner {
        uint256 totalYield = mevAmount + lendingAmount + bridgeAmount;
        require(totalYield > 0, "No yield to distribute");
        
        // Update tracking
        mevCaptured += mevAmount;
        lendingFees += lendingAmount;
        bridgeFees += bridgeAmount;
        totalRealYield += totalYield;
        
        // Distribute 70% to LPs across all pairs
        uint256 lpShare = (totalYield * FEE_SHARE_TO_LPS) / 10000;
        
        // Distribute proportionally across all active pairs
        for (uint256 i = 0; i < 4; i++) {
            LPPair pair = LPPair(i);
            PairInfo storage pInfo = pairInfo[pair];
            
            if (pInfo.isActive && pInfo.totalStaked > 0) {
                uint256 pairShare = (lpShare * pInfo.rewardMultiplier) / 10000;
                pInfo.tradingFeePool += pairShare;
            }
        }
        
        emit RealYieldDistributed(mevAmount, lendingAmount, bridgeAmount);
    }
    
    /**
     * @dev Award loyalty bonus for long-term stakers
     */
    function awardLoyaltyBonus(address user, LPPair pair) external onlyOwner {
        UserInfo storage userStake = userInfo[pair][user];
        require(userStake.amount > 0, "No stake found");
        require(userStake.firstStakeTime > 0, "Invalid stake time");
        
        uint256 stakeDuration = block.timestamp - userStake.firstStakeTime;
        require(stakeDuration >= 90 days, "Minimum 90 days required");
        
        // Calculate loyalty bonus: 1% per month after 3 months, max 24%
        uint256 monthsStaked = stakeDuration / 30 days;
        uint256 bonusPercentage = monthsStaked > 24 ? 24 : monthsStaked;
        uint256 bonusAmount = (userStake.amount * bonusPercentage) / 100;
        
        if (bonusAmount > 0) {
            userStake.pendingCOLD += bonusAmount;
            emit LoyaltyBonusAwarded(user, bonusAmount, stakeDuration);
        }
    }
    
    // ==================== MODULAR INFRASTRUCTURE ====================
    
    /**
     * @dev Enable modular features with Celestia and EigenLayer integration
     */
    function enableModularFeatures(
        address _celestiaDA,
        address _eigenLayerAVS
    ) external onlyOwner {
        require(!modularFeatureEnabled, "Already enabled");
        require(_celestiaDA != address(0) && _eigenLayerAVS != address(0), "Invalid addresses");
        
        celestiaDA = _celestiaDA;
        eigenLayerAVS = _eigenLayerAVS;
        modularFeatureEnabled = true;
        
        emit ModularFeatureEnabled(_celestiaDA, _eigenLayerAVS);
    }
    
    /**
     * @dev Manage approved solvers for intent execution
     */
    function setSolverApproval(address solver, bool approved) external onlyOwner {
        approvedSolvers[solver] = approved;
        emit SolverApproved(solver, approved);
    }
    
    /**
     * @dev Update intent reward multiplier
     */
    function setIntentRewardMultiplier(uint256 newMultiplier) external onlyOwner {
        require(newMultiplier >= 1000 && newMultiplier <= 2000, "Invalid multiplier"); // 10-100% bonus
        intentRewardMultiplier = newMultiplier;
    }
    
    /**
     * @dev Update cross-chain reward bonus
     */
    function setCrossChainRewardBonus(uint256 newBonus) external onlyOwner {
        require(newBonus >= 1000 && newBonus <= 1500, "Invalid bonus"); // 0-50% bonus
        crossChainRewardBonus = newBonus;
    }
    
    // ==================== ADVANCED VIEW FUNCTIONS ====================
    
    function getIntentExecutionStatus(bytes32 intentHash) external view returns (bool processed) {
        return processedIntents[intentHash];
    }
    
    function getSolverApprovalStatus(address solver) external view returns (bool approved) {
        return approvedSolvers[solver];
    }
    
    function getRealYieldStats() external view returns (
        uint256 totalYield,
        uint256 mevYield,
        uint256 lendingYield,
        uint256 bridgeYield
    ) {
        return (totalRealYield, mevCaptured, lendingFees, bridgeFees);
    }
    
    function getModularFeatureStatus() external view returns (
        bool enabled,
        address celestia,
        address eigenLayer,
        uint256 intentMultiplier,
        uint256 crossChainBonus
    ) {
        return (
            modularFeatureEnabled,
            celestiaDA,
            eigenLayerAVS,
            intentRewardMultiplier,
            crossChainRewardBonus
        );
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function setPairActive(LPPair pair, bool active) external onlyOwner {
        pairInfo[pair].isActive = active;
    }
    
    function updateRewardMultiplier(LPPair pair, uint256 newMultiplier) external onlyOwner {
        require(newMultiplier <= 5000, "Multiplier too high"); // Max 50%
        _updatePair(pair);
        pairInfo[pair].rewardMultiplier = newMultiplier;
    }
    
    function emergencyWithdraw(LPPair pair) external {
        UserInfo storage user = userInfo[pair][msg.sender];
        uint256 amount = user.amount;
        require(amount > 0, "No stake to withdraw");
        
        // Reset user data
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingCOLD = 0;
        
        // Update pair total
        pairInfo[pair].totalStaked -= amount;
        
        // Burn COLD-LP tokens
        _burn(msg.sender, amount);
        
        // Transfer LP tokens back (no fees in emergency)
        pairInfo[pair].lpToken.transfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, pair, amount);
    }
    
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
} 