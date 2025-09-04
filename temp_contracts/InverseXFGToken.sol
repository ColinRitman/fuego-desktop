// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InverseXFGToken (IXFG)
 * @dev A purpose-built token that maintains inverse price correlation with XFG
 * @notice This token automatically adjusts its supply to maintain inverse price movements to XFG
 * 
 * Key Features:
 * - Algorithmic supply adjustment based on XFG price
 * - Built-in treasury functions for price steering
 * - Governance capabilities for parameter adjustment
 * - Integration with price oracles
 * - Yield generation for holders
 */
contract InverseXFGToken is ERC20, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {

    // Token constants
    string private constant TOKEN_NAME = "Inverse XFG";
    string private constant TOKEN_SYMBOL = "IXFG";
    
    // Precision constants
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_SUPPLY = 1000000000 * 1e18; // 1B max supply

    // Price correlation parameters
    uint256 public xfgBasePrice = 1e18; // $1 USD base price
    uint256 public inverseBasePrice = 1e18; // $1 USD base price
    uint256 public correlationFactor = 1e18; // 100% inverse correlation
    uint256 public dampingFactor = 9000; // 90% damping (basis points)
    uint256 public rebalanceThreshold = 200; // 2% threshold (basis points)

    // Price tracking
    uint256 public lastXfgPrice = 1e18;
    uint256 public lastInversePrice = 1e18;
    uint256 public lastRebalanceTime;
    uint256 public rebalanceInterval = 3600; // 1 hour

    // Treasury and reserves
    address public treasury;
    address public priceOracle;
    uint256 public treasuryReserve;
    uint256 public rebalanceReserve;
    
    // Yield parameters
    uint256 public yieldRate = 500; // 5% APY (basis points)
    uint256 public lastYieldDistribution;
    uint256 public yieldDistributionInterval = 86400; // 24 hours
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public yieldAccrued;

    // Governance parameters
    uint256 public proposalThreshold = 1000000 * 1e18; // 1M tokens to propose
    uint256 public votingPeriod = 17280; // ~3 days in blocks
    mapping(uint256 => bool) public executedProposals;

    // Events
    event PriceRebalance(
        uint256 indexed timestamp,
        uint256 xfgPrice,
        uint256 oldPrice,
        uint256 newTargetPrice,
        uint256 supplyChange,
        bool isInflation
    );
    event YieldDistributed(address indexed holder, uint256 amount);
    event ParametersUpdated(
        uint256 correlationFactor,
        uint256 dampingFactor,
        uint256 rebalanceThreshold
    );
    event TreasuryAction(string action, uint256 amount, uint256 newPrice);
    event OracleUpdated(address newOracle);

    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == priceOracle || msg.sender == owner(), "IXFG: Not authorized oracle");
        _;
    }

    modifier onlyTreasury() {
        require(msg.sender == treasury || msg.sender == owner(), "IXFG: Not treasury");
        _;
    }

    constructor(
        address _treasury,
        address _priceOracle,
        uint256 _initialSupply
    ) ERC20(TOKEN_NAME, TOKEN_SYMBOL) ERC20Permit(TOKEN_NAME) Ownable(msg.sender) {
        require(_treasury != address(0), "IXFG: Invalid treasury");
        require(_initialSupply <= MAX_SUPPLY, "IXFG: Initial supply too high");

        treasury = _treasury;
        priceOracle = _priceOracle;
        lastRebalanceTime = block.timestamp;
        lastYieldDistribution = block.timestamp;

        // Mint initial supply
        _mint(msg.sender, _initialSupply);
        
        // Reserve 10% for treasury and rebalancing
        uint256 reserveAmount = (_initialSupply / 10);
        treasuryReserve = (reserveAmount / 2);
        rebalanceReserve = (reserveAmount / 2);
        _mint(address(this), reserveAmount);
    }

    /**
     * @dev Calculate target price based on XFG price movement
     * Formula: targetPrice = basePrice * (2 - (xfgPrice/xfgBasePrice))^correlationFactor
     */
    function calculateTargetPrice(uint256 xfgPrice) public view returns (uint256) {
        if (xfgPrice == 0) return inverseBasePrice;

        // Calculate XFG price ratio
        uint256 xfgRatio = (xfgPrice * PRECISION) / (xfgBasePrice);
        
        // Calculate inverse ratio: (2 - xfgRatio)
        uint256 inverseRatio;
        if (xfgRatio <= (PRECISION * 2)) {
            inverseRatio = (PRECISION * 2) - (xfgRatio);
        } else {
            // If XFG increased more than 100%, set minimum ratio
            inverseRatio = (PRECISION / 10); // 10% of base price minimum
        }

        // Apply correlation factor
        uint256 correlationAdjustedRatio = PRECISION + (
            (inverseRatio - PRECISION) * (correlationFactor) / (PRECISION)
        );

        // Apply damping factor to smooth price movements
        uint256 dampedRatio = PRECISION + (
            (correlationAdjustedRatio - PRECISION) * (dampingFactor) / (BASIS_POINTS)
        );

        return (inverseBasePrice * dampedRatio) / (PRECISION);
    }

    /**
     * @dev Update XFG price and trigger rebalancing if needed
     */
    function updateXfgPrice(uint256 newXfgPrice) external onlyOracle {
        require(newXfgPrice > 0, "IXFG: Invalid price");
        
        uint256 oldXfgPrice = lastXfgPrice;
        lastXfgPrice = newXfgPrice;

        // Calculate target price
        uint256 targetPrice = calculateTargetPrice(newXfgPrice);
        
        // Check if rebalancing is needed
        uint256 currentPrice = lastInversePrice;
        uint256 deviation = _calculateDeviation(currentPrice, targetPrice);

        if (deviation > rebalanceThreshold && 
            block.timestamp >= (lastRebalanceTime + rebalanceInterval)) {
            _executeRebalance(currentPrice, targetPrice);
        }

        // Distribute yield if time has passed
        if (block.timestamp >= (lastYieldDistribution + yieldDistributionInterval)) {
            _distributeYield();
        }
    }

    /**
     * @dev Execute supply rebalancing to achieve target price
     */
    function _executeRebalance(uint256 currentPrice, uint256 targetPrice) internal {
        uint256 currentSupply = totalSupply();
        uint256 supplyChange;
        bool isInflation;

        if (currentPrice > targetPrice) {
            // Current price too high, increase supply (mint tokens)
            uint256 priceRatio = (currentPrice * PRECISION) / (targetPrice);
            uint256 targetSupply = (currentSupply * priceRatio) / (PRECISION);
            supplyChange = (targetSupply - currentSupply);
            
            // Cap inflation at 5% per rebalance
            uint256 maxInflation = (currentSupply / 20);
            if (supplyChange > maxInflation) {
                supplyChange = maxInflation;
            }
            
            // Mint to treasury for distribution
            _mint(address(this), supplyChange);
            rebalanceReserve = (rebalanceReserve + supplyChange);
            isInflation = true;
            
        } else {
            // Current price too low, decrease supply (burn tokens)
            uint256 priceRatio = (targetPrice * PRECISION) / (currentPrice);
            uint256 targetSupply = (currentSupply * PRECISION) / (priceRatio);
            supplyChange = (currentSupply - targetSupply);
            
            // Cap deflation at 5% per rebalance
            uint256 maxDeflation = (currentSupply / 20);
            if (supplyChange > maxDeflation) {
                supplyChange = maxDeflation;
            }
            
            // Burn from reserves
            if (rebalanceReserve >= supplyChange) {
                _burn(address(this), supplyChange);
                rebalanceReserve = (rebalanceReserve - supplyChange);
            } else {
                supplyChange = rebalanceReserve;
                if (supplyChange > 0) {
                    _burn(address(this), supplyChange);
                    rebalanceReserve = 0;
                }
            }
            isInflation = false;
        }

        lastInversePrice = targetPrice;
        lastRebalanceTime = block.timestamp;

        emit PriceRebalance(
            block.timestamp,
            lastXfgPrice,
            currentPrice,
            targetPrice,
            supplyChange,
            isInflation
        );
    }

    /**
     * @dev Calculate price deviation in basis points
     */
    function _calculateDeviation(uint256 currentPrice, uint256 targetPrice) internal pure returns (uint256) {
        if (currentPrice == targetPrice) return 0;
        
        uint256 difference = currentPrice > targetPrice ? 
            (currentPrice - targetPrice) : (targetPrice - currentPrice);
        
        return (difference * BASIS_POINTS) / (targetPrice);
    }

    /**
     * @dev Distribute yield to token holders
     */
    function _distributeYield() internal {
        uint256 totalYield = totalSupply() * (yieldRate) / (BASIS_POINTS) / (365); // Daily yield
        
        if (treasuryReserve >= totalYield) {
            // Update yield accrual for all holders (simplified - in practice would use more efficient method)
            lastYieldDistribution = block.timestamp;
            
            // Mint yield tokens to treasury for distribution
            _mint(address(this), totalYield);
            treasuryReserve = (treasuryReserve + totalYield);
        }
    }

    /**
     * @dev Claim accumulated yield
     */
    function claimYield() external nonReentrant {
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "IXFG: No balance");

        uint256 timeSinceLastClaim = block.timestamp - (lastClaimTime[msg.sender]);
        if (timeSinceLastClaim == 0) timeSinceLastClaim = (block.timestamp - lastYieldDistribution);

        uint256 yieldAmount = (balance * yieldRate) * (timeSinceLastClaim)
             / (BASIS_POINTS) / (365 days);

        if (yieldAmount > 0 && treasuryReserve >= yieldAmount) {
            treasuryReserve = (treasuryReserve - yieldAmount);
            lastClaimTime[msg.sender] = block.timestamp;
            
            _transfer(address(this), msg.sender, yieldAmount);
            emit YieldDistributed(msg.sender, yieldAmount);
        }
    }

    /**
     * @dev Treasury function to manually adjust price through supply changes
     */
    function treasuryPriceAdjustment(uint256 targetPriceChange, bool increase) external onlyTreasury {
        uint256 currentSupply = totalSupply();
        uint256 supplyChange = (currentSupply * targetPriceChange) / (BASIS_POINTS);
        
        // Cap treasury actions at 2% of supply
        uint256 maxChange = (currentSupply / 50);
        if (supplyChange > maxChange) {
            supplyChange = maxChange;
        }

        if (increase) {
            // Increase price by reducing supply
            require(rebalanceReserve >= supplyChange, "IXFG: Insufficient reserves");
            _burn(address(this), supplyChange);
            rebalanceReserve = (rebalanceReserve - supplyChange);
            emit TreasuryAction("Supply reduction", supplyChange, lastInversePrice);
        } else {
            // Decrease price by increasing supply
            _mint(address(this), supplyChange);
            rebalanceReserve = (rebalanceReserve + supplyChange);
            emit TreasuryAction("Supply increase", supplyChange, lastInversePrice);
        }
    }

    /**
     * @dev Update correlation parameters (governance)
     */
    function updateParameters(
        uint256 _correlationFactor,
        uint256 _dampingFactor,
        uint256 _rebalanceThreshold
    ) external onlyOwner {
        require(_correlationFactor <= (PRECISION * 2), "IXFG: Correlation factor too high");
        require(_dampingFactor <= BASIS_POINTS, "IXFG: Damping factor too high");
        require(_rebalanceThreshold <= 1000, "IXFG: Threshold too high"); // Max 10%

        correlationFactor = _correlationFactor;
        dampingFactor = _dampingFactor;
        rebalanceThreshold = _rebalanceThreshold;

        emit ParametersUpdated(_correlationFactor, _dampingFactor, _rebalanceThreshold);
    }

    /**
     * @dev Update yield rate
     */
    function updateYieldRate(uint256 _yieldRate) external onlyOwner {
        require(_yieldRate <= 2000, "IXFG: Yield rate too high"); // Max 20% APY
        yieldRate = _yieldRate;
    }

    /**
     * @dev Update price oracle
     */
    function updatePriceOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "IXFG: Invalid oracle");
        priceOracle = _newOracle;
        emit OracleUpdated(_newOracle);
    }

    /**
     * @dev Update treasury address
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "IXFG: Invalid treasury");
        treasury = _newTreasury;
    }

    /**
     * @dev Get current token status
     */
    function getTokenStatus() external view returns (
        uint256 currentXfgPrice,
        uint256 currentInversePrice,
        uint256 targetInversePrice,
        uint256 priceDeviation,
        uint256 nextRebalanceTime,
        uint256 currentYieldRate,
        uint256 treasuryBalance,
        uint256 rebalanceBalance
    ) {
        currentXfgPrice = lastXfgPrice;
        currentInversePrice = lastInversePrice;
        targetInversePrice = calculateTargetPrice(lastXfgPrice);
        priceDeviation = _calculateDeviation(currentInversePrice, targetInversePrice);
        nextRebalanceTime = (lastRebalanceTime + rebalanceInterval);
        currentYieldRate = yieldRate;
        treasuryBalance = treasuryReserve;
        rebalanceBalance = rebalanceReserve;
    }

    /**
     * @dev Get user yield information
     */
    function getUserYieldInfo(address user) external view returns (
        uint256 balance,
        uint256 accruedYield,
        uint256 lastClaim,
        uint256 estimatedNextYield
    ) {
        balance = balanceOf(user);
        uint256 timeSinceLastClaim = block.timestamp - (lastClaimTime[user]);
        if (timeSinceLastClaim == 0) timeSinceLastClaim = (block.timestamp - lastYieldDistribution);
        
        accruedYield = (balance * yieldRate) * (timeSinceLastClaim)
             / (BASIS_POINTS) / (365 days);
        lastClaim = lastClaimTime[user];
        estimatedNextYield = (balance * yieldRate) / (BASIS_POINTS) / (365); // Daily yield
    }

    /**
     * @dev Emergency pause function
     */
    function emergencyPause() external onlyOwner {
        // Implement emergency pause logic
        rebalanceInterval = type(uint256).max; // Effectively disable rebalancing
    }

    /**
     * @dev Resume normal operations
     */
    function resumeOperations() external onlyOwner {
        rebalanceInterval = 3600; // Reset to 1 hour
    }

    // Override required by Solidity
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
} 