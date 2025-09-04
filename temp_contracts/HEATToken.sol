// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HEAT Token
 * @dev The native gas token for COLD L3
 * Features:
 * - Native gas token for L3 transactions
 * - Validator rewards distribution
 * - Fee burning mechanism
 * - Cross-chain bridging
 * - Merge mining rewards
 */
contract HEATToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    // Token constants
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10**18; // 21 million HEAT (Bitcoin-like supply)
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million initial
    
    // L3 Integration
    address public l3Bridge;
    address public coldToken;
    address public feeCollector;
    mapping(address => bool) public l3Validators;
    mapping(address => bool) public mergeMiningPools;
    
    // Gas token mechanics
    uint256 public baseFee = 1000000000; // 1 gwei in wei
    uint256 public feeMultiplier = 100; // 1% of fees burned
    uint256 public totalFeesCollected;
    uint256 public totalFeesBurned;
    
    // Validator rewards
    mapping(address => uint256) public validatorRewards;
    mapping(address => uint256) public lastRewardClaim;
    uint256 public totalValidatorRewards;
    uint256 public validatorRewardRate = 1000; // 10% APY for validators
    
    // Merge mining
    mapping(address => uint256) public mergeMiningRewards;
    uint256 public totalMergeMiningRewards;
    uint256 public mergeMiningRewardPerBlock = 50 * 10**18; // 50 HEAT per block
    
    // Cross-chain bridging
    mapping(bytes32 => bool) public processedWithdrawals;
    mapping(address => uint256) public bridgeDeposits;
    
    event L3BridgeSet(address indexed bridge);
    event ColdTokenSet(address indexed coldToken);
    event FeeCollectorSet(address indexed feeCollector);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event MergeMiningPoolAdded(address indexed pool);
    event MergeMiningPoolRemoved(address indexed pool);
    event FeesBurned(uint256 amount);
    event ValidatorRewardsClaimed(address indexed validator, uint256 amount);
    event MergeMiningRewardsClaimed(address indexed pool, uint256 amount);
    event BridgeDeposit(address indexed user, uint256 amount);
    event BridgeWithdrawal(address indexed user, uint256 amount, bytes32 indexed withdrawalId);
    
    constructor(address initialOwner) ERC20("HEAT Token", "HEAT") Ownable(initialOwner) {
        _mint(msg.sender, INITIAL_SUPPLY);
        feeCollector = msg.sender;
    }
    
    // L3 Integration Functions
    function setL3Bridge(address _l3Bridge) external onlyOwner {
        require(_l3Bridge != address(0), "Invalid bridge address");
        l3Bridge = _l3Bridge;
        emit L3BridgeSet(_l3Bridge);
    }
    
    function setColdToken(address _coldToken) external onlyOwner {
        require(_coldToken != address(0), "Invalid COLD token address");
        coldToken = _coldToken;
        emit ColdTokenSet(_coldToken);
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid fee collector address");
        feeCollector = _feeCollector;
        emit FeeCollectorSet(_feeCollector);
    }
    
    // Validator Management
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator address");
        l3Validators[validator] = true;
        lastRewardClaim[validator] = block.timestamp;
        emit ValidatorAdded(validator);
    }
    
    function removeValidator(address validator) external onlyOwner {
        l3Validators[validator] = false;
        emit ValidatorRemoved(validator);
    }
    
    // Merge Mining Management
    function addMergeMiningPool(address pool) external onlyOwner {
        require(pool != address(0), "Invalid pool address");
        mergeMiningPools[pool] = true;
        emit MergeMiningPoolAdded(pool);
    }
    
    function removeMergeMiningPool(address pool) external onlyOwner {
        mergeMiningPools[pool] = false;
        emit MergeMiningPoolRemoved(pool);
    }
    
    // Gas Token Functions
    function calculateGasFee(uint256 gasUsed) external view returns (uint256) {
        return gasUsed * baseFee;
    }
    
    function collectFees(uint256 amount) external {
        require(msg.sender == feeCollector || l3Validators[msg.sender], "Not authorized");
        require(amount > 0, "Invalid fee amount");
        
        totalFeesCollected += amount;
        
        // Burn a percentage of fees
        uint256 burnAmount = (amount * feeMultiplier) / 10000;
        if (burnAmount > 0) {
            _burn(feeCollector, burnAmount);
            totalFeesBurned += burnAmount;
            emit FeesBurned(burnAmount);
        }
    }
    
    function setBaseFee(uint256 newBaseFee) external onlyOwner {
        baseFee = newBaseFee;
    }
    
    function setFeeMultiplier(uint256 newMultiplier) external onlyOwner {
        require(newMultiplier <= 1000, "Fee multiplier too high"); // Max 10%
        feeMultiplier = newMultiplier;
    }
    
    // Validator Rewards
    function claimValidatorRewards() external nonReentrant {
        require(l3Validators[msg.sender], "Not a validator");
        
        uint256 timeValidating = block.timestamp - lastRewardClaim[msg.sender];
        uint256 rewards = (validatorRewards[msg.sender] * validatorRewardRate * timeValidating) / (365 days * 10000);
        
        if (rewards > 0 && totalSupply() + rewards <= MAX_SUPPLY) {
            _mint(msg.sender, rewards);
            validatorRewards[msg.sender] += rewards;
            totalValidatorRewards += rewards;
            lastRewardClaim[msg.sender] = block.timestamp;
            
            emit ValidatorRewardsClaimed(msg.sender, rewards);
        }
    }
    
    function distributeValidatorRewards(address[] calldata validators, uint256[] calldata amounts) external onlyOwner {
        require(validators.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < validators.length; i++) {
            if (l3Validators[validators[i]]) {
                validatorRewards[validators[i]] += amounts[i];
                totalValidatorRewards += amounts[i];
            }
        }
    }
    
    // Merge Mining Rewards
    function claimMergeMiningRewards() external nonReentrant {
        require(mergeMiningPools[msg.sender], "Not a merge mining pool");
        
        uint256 rewards = mergeMiningRewards[msg.sender];
        if (rewards > 0) {
            mergeMiningRewards[msg.sender] = 0;
            _mint(msg.sender, rewards);
            
            emit MergeMiningRewardsClaimed(msg.sender, rewards);
        }
    }
    
    function distributeMergeMiningRewards(address[] calldata pools, uint256[] calldata amounts) external onlyOwner {
        require(pools.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < pools.length; i++) {
            if (mergeMiningPools[pools[i]]) {
                mergeMiningRewards[pools[i]] += amounts[i];
                totalMergeMiningRewards += amounts[i];
            }
        }
    }
    
    function setMergeMiningRewardPerBlock(uint256 newReward) external onlyOwner {
        mergeMiningRewardPerBlock = newReward;
    }
    
    // Cross-chain Bridging
    function bridgeDeposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid deposit amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        bridgeDeposits[msg.sender] += amount;
        
        emit BridgeDeposit(msg.sender, amount);
    }
    
    function bridgeWithdraw(address user, uint256 amount, bytes32 withdrawalId) external {
        require(msg.sender == l3Bridge, "Not authorized");
        require(!processedWithdrawals[withdrawalId], "Already processed");
        require(amount > 0, "Invalid withdrawal amount");
        
        processedWithdrawals[withdrawalId] = true;
        _transfer(address(this), user, amount);
        
        emit BridgeWithdrawal(user, amount, withdrawalId);
    }
    
    // Utility Functions
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    // View Functions
    function getValidatorInfo(address validator) external view returns (
        bool isValidator,
        uint256 rewards,
        uint256 lastClaim,
        uint256 pendingRewards
    ) {
        isValidator = l3Validators[validator];
        rewards = validatorRewards[validator];
        lastClaim = lastRewardClaim[validator];
        
        if (isValidator && rewards > 0) {
            uint256 timeValidating = block.timestamp - lastClaim;
            pendingRewards = (rewards * validatorRewardRate * timeValidating) / (365 days * 10000);
        }
    }
    
    function getMergeMiningInfo(address pool) external view returns (
        bool isPool,
        uint256 rewards
    ) {
        isPool = mergeMiningPools[pool];
        rewards = mergeMiningRewards[pool];
    }
    
    function getTokenomics() external view returns (
        uint256 currentSupply,
        uint256 maxSupply,
        uint256 totalBurned,
        uint256 totalValidatorRewardsDistributed,
        uint256 totalMergeMiningRewardsDistributed,
        uint256 totalFeesCollectedAmount,
        uint256 totalFeesBurnedAmount
    ) {
        currentSupply = totalSupply();
        maxSupply = MAX_SUPPLY;
        totalBurned = MAX_SUPPLY - currentSupply; // Approximation
        totalValidatorRewardsDistributed = totalValidatorRewards;
        totalMergeMiningRewardsDistributed = totalMergeMiningRewards;
        totalFeesCollectedAmount = totalFeesCollected;
        totalFeesBurnedAmount = totalFeesBurned;
    }
    
    // L3 Gas Token Interface
    function transfer(address to, uint256 amount) public override returns (bool) {
        // If being used as gas token, allow L3 bridge to transfer
        if (msg.sender == l3Bridge) {
            _transfer(l3Bridge, to, amount);
            return true;
        }
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        // If being used as gas token, allow L3 bridge to transfer
        if (msg.sender == l3Bridge) {
            _transfer(from, to, amount);
            return true;
        }
        return super.transferFrom(from, to, amount);
    }
} 