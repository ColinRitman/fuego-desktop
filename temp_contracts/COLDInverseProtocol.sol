// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title COLDInverseProtocol
 * @dev Protocol to maintain COLD as an inverse asset to XFG
 * @notice Implements multiple mechanisms to ensure COLD moves inversely to XFG price movements
 */
contract COLDInverseProtocol is Ownable, ReentrancyGuard {

    // Core tokens
    IERC20 public immutable coldToken;
    IERC20 public immutable xfgToken;
    IERC20 public immutable heatToken;

    // Protocol parameters
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_REBALANCE_THRESHOLD = 500; // 5%
    uint256 public constant MIN_REBALANCE_THRESHOLD = 100; // 1%

    // Inverse correlation parameters
    uint256 public basePrice = 1e18; // Base price for COLD (1 USD in wei)
    uint256 public correlationFactor = 1e18; // 100% inverse correlation by default
    uint256 public dampingFactor = 9000; // 90% damping to smooth price movements
    uint256 public rebalanceThreshold = 200; // 2% threshold for rebalancing

    // Treasury and reserves
    address public treasury;
    uint256 public coldReserve;
    uint256 public xfgReserve;
    uint256 public stabilizationFund;

    // Rebalancing state
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 3600; // 1 hour
    bool public autoRebalanceEnabled = true;

    // Price tracking
    uint256 public lastXfgPrice;
    uint256 public lastColdPrice;
    uint256 public xfgBasePrice = 1e18; // Base price for XFG

    // Events
    event InverseRebalance(
        uint256 indexed timestamp,
        uint256 xfgPrice,
        uint256 newColdPrice,
        uint256 coldMinted,
        uint256 coldBurned
    );
    event PriceCorrelationUpdated(uint256 newCorrelationFactor);
    event RebalanceThresholdUpdated(uint256 newThreshold);
    event StabilizationFundDeposit(uint256 amount);
    event EmergencyRebalance(uint256 xfgPrice, uint256 coldPrice, uint256 deviation);
    event PriceUpdate(uint256 xfgPrice, uint256 coldPrice, uint256 targetColdPrice);

    struct RebalanceData {
        uint256 currentXfgPrice;
        uint256 currentColdPrice;
        uint256 targetColdPrice;
        uint256 priceDeviation;
        uint256 requiredAction; // 0 = none, 1 = mint, 2 = burn
        uint256 actionAmount;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || msg.sender == treasury,
            "COLDInverse: Not authorized"
        );
        _;
    }

    constructor(
        address initialOwner,
        address _coldToken,
        address _xfgToken,
        address _heatToken,
        address _treasury
    )  Ownable(initialOwner) {
        coldToken = IERC20(_coldToken);
        xfgToken = IERC20(_xfgToken);
        heatToken = IERC20(_heatToken);
        treasury = _treasury;
        lastRebalanceTime = block.timestamp;
        lastXfgPrice = xfgBasePrice;
        lastColdPrice = basePrice;
    }

    /**
     * @dev Calculate target COLD price based on XFG price movement
     * Formula: targetColdPrice = basePrice * (2 - (xfgPrice/xfgBasePrice))^correlationFactor
     */
    function calculateTargetColdPrice(uint256 xfgPrice) public view returns (uint256) {
        if (xfgPrice == 0) return basePrice;
        
        // Calculate price ratio
        uint256 priceRatio = (xfgPrice * PRECISION) / (xfgBasePrice);
        
        // Inverse correlation: as XFG goes up, COLD should go down
        uint256 inverseRatio;
        if (priceRatio <= PRECISION) {
            // XFG price decreased, COLD should increase
            inverseRatio = PRECISION + ((PRECISION - priceRatio));
        } else {
            // XFG price increased, COLD should decrease
            uint256 increase = (priceRatio - PRECISION);
            inverseRatio = PRECISION > increase ? (PRECISION - increase) : (PRECISION / 10);
        }

        // Apply correlation factor and damping
        uint256 adjustedRatio = PRECISION + (
            (inverseRatio - PRECISION) * (correlationFactor) / (PRECISION)
        );
        
        // Apply damping factor to smooth movements
        uint256 dampedRatio = PRECISION + (
            (adjustedRatio - PRECISION) * (dampingFactor) / (BASIS_POINTS)
        );

        return (basePrice * dampedRatio) / (PRECISION);
    }

    /**
     * @dev Set current prices (called by oracle or authorized addresses)
     */
    function updatePrices(uint256 xfgPrice, uint256 coldPrice) external onlyAuthorized {
        require(xfgPrice > 0 && coldPrice > 0, "COLDInverse: Invalid prices");
        
        lastXfgPrice = xfgPrice;
        lastColdPrice = coldPrice;
        
        uint256 targetColdPrice = calculateTargetColdPrice(xfgPrice);
        
        emit PriceUpdate(xfgPrice, coldPrice, targetColdPrice);
        
        // Auto-rebalance if enabled and needed
        if (autoRebalanceEnabled && shouldRebalance()) {
            _executeRebalance();
        }
    }

    /**
     * @dev Get current prices
     */
    function getCurrentPrices() external view returns (uint256 xfgPrice, uint256 coldPrice) {
        return (lastXfgPrice, lastColdPrice);
    }

    /**
     * @dev Calculate rebalancing requirements
     */
    function calculateRebalanceData() public view returns (RebalanceData memory) {
        RebalanceData memory data;
        
        data.currentXfgPrice = lastXfgPrice;
        data.currentColdPrice = lastColdPrice;
        data.targetColdPrice = calculateTargetColdPrice(data.currentXfgPrice);
        
        // Calculate deviation
        if (data.currentColdPrice > data.targetColdPrice) {
            data.priceDeviation = data.currentColdPrice - (data.targetColdPrice)
                 * (BASIS_POINTS) / (data.targetColdPrice);
        } else {
            data.priceDeviation = data.targetColdPrice - (data.currentColdPrice)
                 * (BASIS_POINTS) / (data.targetColdPrice);
        }

        // Determine required action
        if (data.priceDeviation > rebalanceThreshold) {
            if (data.currentColdPrice > data.targetColdPrice) {
                // COLD too expensive, need to increase supply (mint)
                data.requiredAction = 1;
                data.actionAmount = calculateMintAmount(data.currentColdPrice, data.targetColdPrice);
            } else {
                // COLD too cheap, need to decrease supply (burn)
                data.requiredAction = 2;
                data.actionAmount = calculateBurnAmount(data.currentColdPrice, data.targetColdPrice);
            }
        }

        return data;
    }

    /**
     * @dev Check if rebalancing is needed
     */
    function shouldRebalance() public view returns (bool) {
        RebalanceData memory data = calculateRebalanceData();
        return data.requiredAction > 0 && 
               block.timestamp >= (lastRebalanceTime + rebalanceInterval);
    }

    /**
     * @dev Calculate amount to mint to bring price down
     */
    function calculateMintAmount(uint256 currentPrice, uint256 targetPrice) internal view returns (uint256) {
        if (currentPrice <= targetPrice) return 0;
        
        uint256 currentSupply = coldToken.totalSupply();
        uint256 priceRatio = (currentPrice * PRECISION) / (targetPrice);
        
        // Simplified model: new_supply = current_supply * price_ratio
        uint256 targetSupply = (currentSupply * priceRatio) / (PRECISION);
        uint256 mintAmount = targetSupply > currentSupply ? (targetSupply - currentSupply) : 0;
        
        // Cap mint amount to prevent excessive inflation
        uint256 maxMint = (currentSupply / 20); // Max 5% of supply per rebalance
        return mintAmount > maxMint ? maxMint : mintAmount;
    }

    /**
     * @dev Calculate amount to burn to bring price up
     */
    function calculateBurnAmount(uint256 currentPrice, uint256 targetPrice) internal view returns (uint256) {
        if (currentPrice >= targetPrice) return 0;
        
        uint256 currentSupply = coldToken.totalSupply();
        uint256 priceRatio = (targetPrice * PRECISION) / (currentPrice);
        
        // Simplified model: new_supply = current_supply / price_ratio
        uint256 targetSupply = (currentSupply * PRECISION) / (priceRatio);
        uint256 burnAmount = currentSupply > targetSupply ? (currentSupply - targetSupply) : 0;
        
        // Cap burn amount to prevent excessive deflation
        uint256 maxBurn = (currentSupply / 20); // Max 5% of supply per rebalance
        return burnAmount > maxBurn ? maxBurn : burnAmount;
    }

    /**
     * @dev Execute rebalancing based on XFG price movements
     */
    function executeRebalance() external onlyAuthorized nonReentrant returns (bool) {
        return _executeRebalance();
    }

    /**
     * @dev Internal rebalance execution
     */
    function _executeRebalance() internal returns (bool) {
        require(shouldRebalance(), "COLDInverse: Rebalancing not needed");

        RebalanceData memory data = calculateRebalanceData();
        
        if (data.requiredAction == 0) {
            return false; // No rebalancing needed
        }

        lastRebalanceTime = block.timestamp;

        if (data.requiredAction == 1) {
            // Mint COLD tokens to decrease price
            _mintColdTokens(data.actionAmount);
        } else if (data.requiredAction == 2) {
            // Burn COLD tokens to increase price
            _burnColdTokens(data.actionAmount);
        }

        emit InverseRebalance(
            block.timestamp,
            data.currentXfgPrice,
            data.targetColdPrice,
            data.requiredAction == 1 ? data.actionAmount : 0,
            data.requiredAction == 2 ? data.actionAmount : 0
        );

        return true;
    }

    /**
     * @dev Mint COLD tokens to protocol reserves
     * @notice This requires COLD token to have minting functionality accessible by this contract
     */
    function _mintColdTokens(uint256 amount) internal {
        // This implementation assumes COLD token has a mint function
        // In practice, this would require the COLD token contract to grant minting rights
        coldReserve = (coldReserve + amount);
        
        // Transfer from reserves to market (simplified - would use DEX integration)
        // The actual implementation would involve DEX liquidity management
    }

    /**
     * @dev Burn COLD tokens from protocol reserves
     * @notice This requires COLD token burn functionality
     */
    function _burnColdTokens(uint256 amount) internal {
        require(coldReserve >= amount, "COLDInverse: Insufficient reserves for burn");
        
        // This implementation assumes COLD token has a burn function
        coldReserve = (coldReserve - amount);
        
        // The actual implementation would burn tokens from circulation
    }

    /**
     * @dev Emergency rebalance when deviation is too high
     */
    function emergencyRebalance() external onlyAuthorized nonReentrant {
        RebalanceData memory data = calculateRebalanceData();
        
        require(
            data.priceDeviation > MAX_REBALANCE_THRESHOLD,
            "COLDInverse: Deviation not high enough for emergency"
        );

        // Execute immediate rebalancing regardless of time constraints
        if (data.requiredAction == 1) {
            _mintColdTokens(data.actionAmount);
        } else if (data.requiredAction == 2) {
            _burnColdTokens(data.actionAmount);
        }

        lastRebalanceTime = block.timestamp;

        emit EmergencyRebalance(
            data.currentXfgPrice,
            data.currentColdPrice,
            data.priceDeviation
        );
    }

    /**
     * @dev Update correlation factor
     */
    function setCorrelationFactor(uint256 _correlationFactor) external onlyOwner {
        require(_correlationFactor <= (PRECISION * 2), "COLDInverse: Factor too high");
        correlationFactor = _correlationFactor;
        emit PriceCorrelationUpdated(_correlationFactor);
    }

    /**
     * @dev Update rebalance threshold
     */
    function setRebalanceThreshold(uint256 _threshold) external onlyOwner {
        require(
            _threshold >= MIN_REBALANCE_THRESHOLD && 
            _threshold <= MAX_REBALANCE_THRESHOLD,
            "COLDInverse: Invalid threshold"
        );
        rebalanceThreshold = _threshold;
        emit RebalanceThresholdUpdated(_threshold);
    }

    /**
     * @dev Set damping factor for price movements
     */
    function setDampingFactor(uint256 _dampingFactor) external onlyOwner {
        require(_dampingFactor <= BASIS_POINTS, "COLDInverse: Invalid damping factor");
        dampingFactor = _dampingFactor;
    }

    /**
     * @dev Set auto-rebalance parameters
     */
    function setAutoRebalance(bool _enabled, uint256 _interval) external onlyOwner {
        autoRebalanceEnabled = _enabled;
        if (_interval >= 300) { // Minimum 5 minutes
            rebalanceInterval = _interval;
        }
    }

    /**
     * @dev Set XFG base price
     */
    function setXfgBasePrice(uint256 _basePrice) external onlyOwner {
        require(_basePrice > 0, "COLDInverse: Invalid base price");
        xfgBasePrice = _basePrice;
    }

    /**
     * @dev Add funds to stabilization fund
     */
    function addToStabilizationFund() external payable {
        stabilizationFund = stabilizationFund + (msg.value);
        emit StabilizationFundDeposit(msg.value);
    }

    /**
     * @dev Add COLD tokens to protocol reserves
     */
    function addColdReserve(uint256 amount) external {
        require(
            coldToken.transferFrom(msg.sender, address(this), amount),
            "COLDInverse: Transfer failed"
        );
        coldReserve = (coldReserve + amount);
    }

    /**
     * @dev Add XFG tokens to protocol reserves
     */
    function addXfgReserve(uint256 amount) external {
        require(
            xfgToken.transferFrom(msg.sender, address(this), amount),
            "COLDInverse: Transfer failed"
        );
        xfgReserve = (xfgReserve + amount);
    }

    /**
     * @dev Get protocol status
     */
    function getProtocolStatus() external view returns (
        uint256 xfgPrice,
        uint256 coldPrice,
        uint256 targetColdPrice,
        uint256 deviation,
        bool rebalanceNeeded,
        uint256 timeToNextRebalance
    ) {
        RebalanceData memory data = calculateRebalanceData();
        
        xfgPrice = data.currentXfgPrice;
        coldPrice = data.currentColdPrice;
        targetColdPrice = data.targetColdPrice;
        deviation = data.priceDeviation;
        rebalanceNeeded = data.requiredAction > 0;
        
        if (block.timestamp >= (lastRebalanceTime + rebalanceInterval)) {
            timeToNextRebalance = 0;
        } else {
            timeToNextRebalance = (lastRebalanceTime + rebalanceInterval) - (block.timestamp);
        }
    }

    /**
     * @dev Get reserve balances
     */
    function getReserves() external view returns (
        uint256 cold,
        uint256 xfg,
        uint256 stabilization
    ) {
        return (coldReserve, xfgReserve, stabilizationFund);
    }

    /**
     * @dev Emergency functions
     */
    function emergencyPause() external onlyOwner {
        autoRebalanceEnabled = false;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "COLDInverse: Transfer failed");
    }
} 