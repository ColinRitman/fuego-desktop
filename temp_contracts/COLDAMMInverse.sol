// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./COLDInverseProtocol.sol";

/**
 * @title COLDAMMInverse
 * @dev Automated Market Maker for maintaining COLD as inverse asset to XFG
 * @notice Provides liquidity and algorithmic trading to enforce inverse price correlation
 */
contract COLDAMMInverse is Ownable, ReentrancyGuard {

    // Core contracts
    IERC20 public immutable coldToken;
    IERC20 public immutable xfgToken;
    IERC20 public immutable heatToken;
    COLDInverseProtocol public immutable inverseProtocol;

    // AMM constants
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_LIQUIDITY = 1000;

    // Liquidity pools
    uint256 public coldReserve;
    uint256 public xfgReserve;
    uint256 public heatReserve;
    uint256 public totalLiquidity;

    // Inverse trading parameters
    uint256 public inverseTradingFee = 30; // 0.3% fee
    uint256 public slippageTolerance = 100; // 1% slippage tolerance
    uint256 public maxTradeSize = 1000 * 1e18; // Max trade size
    uint256 public rebalanceThreshold = 50; // 0.5% threshold

    // Price impact parameters
    uint256 public priceImpactFactor = 100; // Price impact scaling
    uint256 public arbitrageFactor = 200; // Arbitrage incentive factor

    // Liquidity provider tracking
    mapping(address => uint256) public liquidityBalance;
    mapping(address => uint256) public lastLiquidityUpdate;
    uint256 public liquidityTokenSupply;

    // Trading statistics
    uint256 public totalVolume;
    uint256 public totalTrades;
    uint256 public totalFees;
    uint256 public lastTradeTime;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 coldAmount,
        uint256 xfgAmount,
        uint256 liquidityTokens
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 coldAmount,
        uint256 xfgAmount,
        uint256 liquidityTokens
    );
    event InverseSwap(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event ArbitrageExecuted(
        uint256 xfgPriceChange,
        uint256 coldAdjustment,
        uint256 profit
    );
    event ParametersUpdated(
        uint256 newFee,
        uint256 newSlippage,
        uint256 newThreshold
    );

    modifier validAmount(uint256 amount) {
        require(amount > 0, "COLDAMM: Amount must be positive");
        _;
    }

    modifier validAddress(address addr) {
        require(addr != address(0), "COLDAMM: Invalid address");
        _;
    }

    constructor(
        address initialOwner,
        address _coldToken,
        address _xfgToken,
        address _heatToken,
        address _inverseProtocol
    ) validAddress(_coldToken) validAddress(_xfgToken) validAddress(_heatToken) validAddress(_inverseProtocol)  Ownable(initialOwner) {
        coldToken = IERC20(_coldToken);
        xfgToken = IERC20(_xfgToken);
        heatToken = IERC20(_heatToken);
        inverseProtocol = COLDInverseProtocol(_inverseProtocol);
    }

    /**
     * @dev Add liquidity to the inverse AMM
     */
    function addLiquidity(
        uint256 coldAmount,
        uint256 xfgAmount
    ) external validAmount(coldAmount) validAmount(xfgAmount) nonReentrant returns (uint256 liquidity) {
        require(
            coldToken.transferFrom(msg.sender, address(this), coldAmount),
            "COLDAMM: COLD transfer failed"
        );
        require(
            xfgToken.transferFrom(msg.sender, address(this), xfgAmount),
            "COLDAMM: XFG transfer failed"
        );

        // Calculate liquidity tokens to mint
        if (totalLiquidity == 0) {
            liquidity = sqrt((coldAmount * xfgAmount));
            require(liquidity > MIN_LIQUIDITY, "COLDAMM: Insufficient liquidity");
            liquidityTokenSupply = (liquidity - MIN_LIQUIDITY);
            liquidityBalance[address(0)] = MIN_LIQUIDITY; // Burn minimum liquidity
        } else {
            uint256 coldLiquidity = (coldAmount * totalLiquidity) / (coldReserve);
            uint256 xfgLiquidity = (xfgAmount * totalLiquidity) / (xfgReserve);
            liquidity = coldLiquidity < xfgLiquidity ? coldLiquidity : xfgLiquidity;
            liquidityTokenSupply = (liquidityTokenSupply + liquidity);
        }

        coldReserve = (coldReserve + coldAmount);
        xfgReserve = (xfgReserve + xfgAmount);
        totalLiquidity = (totalLiquidity + liquidity);
        liquidityBalance[msg.sender] = liquidityBalance[msg.sender] + (liquidity);
        lastLiquidityUpdate[msg.sender] = block.timestamp;

        emit LiquidityAdded(msg.sender, coldAmount, xfgAmount, liquidity);
        return liquidity;
    }

    /**
     * @dev Remove liquidity from the inverse AMM
     */
    function removeLiquidity(
        uint256 liquidity
    ) external validAmount(liquidity) nonReentrant returns (uint256 coldAmount, uint256 xfgAmount) {
        require(
            liquidityBalance[msg.sender] >= liquidity,
            "COLDAMM: Insufficient liquidity balance"
        );

        coldAmount = (liquidity * coldReserve) / (totalLiquidity);
        xfgAmount = (liquidity * xfgReserve) / (totalLiquidity);

        coldReserve = (coldReserve - coldAmount);
        xfgReserve = (xfgReserve - xfgAmount);
        totalLiquidity = (totalLiquidity - liquidity);
        liquidityBalance[msg.sender] = liquidityBalance[msg.sender] - (liquidity);
        liquidityTokenSupply = (liquidityTokenSupply - liquidity);

        require(coldToken.transfer(msg.sender, coldAmount), "COLDAMM: COLD transfer failed");
        require(xfgToken.transfer(msg.sender, xfgAmount), "COLDAMM: XFG transfer failed");

        emit LiquidityRemoved(msg.sender, coldAmount, xfgAmount, liquidity);
        return (coldAmount, xfgAmount);
    }

    /**
     * @dev Execute inverse swap (XFG for COLD or vice versa)
     * @notice Automatically adjusts prices to maintain inverse correlation
     */
    function swapInverse(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external validAmount(amountIn) nonReentrant returns (uint256 amountOut) {
        require(
            (tokenIn == address(coldToken) && tokenOut == address(xfgToken)) ||
            (tokenIn == address(xfgToken) && tokenOut == address(coldToken)),
            "COLDAMM: Invalid token pair"
        );
        require(amountIn <= maxTradeSize, "COLDAMM: Trade size too large");

        // Calculate swap amount with inverse adjustment
        amountOut = calculateInverseSwapOutput(tokenIn, tokenOut, amountIn);
        require(amountOut >= minAmountOut, "COLDAMM: Insufficient output amount");

        // Calculate fee
        uint256 fee = (amountOut * inverseTradingFee) / (BASIS_POINTS);
        amountOut = (amountOut - fee);

        // Execute transfer
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "COLDAMM: Input transfer failed"
        );
        require(
            IERC20(tokenOut).transfer(msg.sender, amountOut),
            "COLDAMM: Output transfer failed"
        );

        // Update reserves
        if (tokenIn == address(coldToken)) {
            coldReserve = (coldReserve + amountIn);
            xfgReserve = xfgReserve - ((amountOut + fee));
        } else {
            xfgReserve = (xfgReserve + amountIn);
            coldReserve = coldReserve - ((amountOut + fee));
        }

        // Update statistics
        totalVolume = (totalVolume + amountIn);
        totalTrades = (totalTrades + 1);
        totalFees = (totalFees + fee);
        lastTradeTime = block.timestamp;

        emit InverseSwap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);

        // Trigger rebalancing if needed
        _checkAndRebalance();

        return amountOut;
    }

    /**
     * @dev Calculate inverse swap output considering price correlation
     */
    function calculateInverseSwapOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256) {
        uint256 currentReserveIn = tokenIn == address(coldToken) ? coldReserve : xfgReserve;
        uint256 currentReserveOut = tokenOut == address(coldToken) ? coldReserve : xfgReserve;

        // Get current and target prices from inverse protocol
        (uint256 xfgPrice, uint256 coldPrice) = inverseProtocol.getCurrentPrices();
        uint256 targetColdPrice = inverseProtocol.calculateTargetColdPrice(xfgPrice);

        // Calculate base swap amount using constant product formula
        uint256 baseAmountOut = getAmountOut(amountIn, currentReserveIn, currentReserveOut);

        // Apply inverse correlation adjustment
        uint256 adjustmentFactor = calculateInverseAdjustment(
            tokenIn,
            tokenOut,
            coldPrice,
            targetColdPrice
        );

        // Apply adjustment
        uint256 adjustedAmountOut = (baseAmountOut * adjustmentFactor) / (PRECISION);

        // Apply price impact
        uint256 priceImpact = calculatePriceImpact(amountIn, currentReserveIn);
        adjustedAmountOut = adjustedAmountOut - (
            (adjustedAmountOut * priceImpact) / (BASIS_POINTS)
        );

        return adjustedAmountOut;
    }

    /**
     * @dev Calculate inverse correlation adjustment factor
     */
    function calculateInverseAdjustment(
        address tokenIn,
        address tokenOut,
        uint256 currentColdPrice,
        uint256 targetColdPrice
    ) internal view returns (uint256) {
        if (currentColdPrice == targetColdPrice) {
            return PRECISION; // No adjustment needed
        }

        uint256 priceDeviation;
        if (currentColdPrice > targetColdPrice) {
            priceDeviation = (currentColdPrice - targetColdPrice) * (BASIS_POINTS) / (targetColdPrice);
        } else {
            priceDeviation = (targetColdPrice - currentColdPrice) * (BASIS_POINTS) / (targetColdPrice);
        }

        // Adjust based on direction of trade
        if (tokenIn == address(xfgToken) && tokenOut == address(coldToken)) {
            // XFG -> COLD: Encourage if COLD is underpriced
            if (currentColdPrice < targetColdPrice) {
                return PRECISION + ((priceDeviation * arbitrageFactor) / (BASIS_POINTS));
            } else {
                return PRECISION - ((priceDeviation * arbitrageFactor) / (BASIS_POINTS));
            }
        } else {
            // COLD -> XFG: Encourage if COLD is overpriced
            if (currentColdPrice > targetColdPrice) {
                return PRECISION + ((priceDeviation * arbitrageFactor) / (BASIS_POINTS));
            } else {
                return PRECISION - ((priceDeviation * arbitrageFactor) / (BASIS_POINTS));
            }
        }
    }

    /**
     * @dev Calculate price impact of trade
     */
    function calculatePriceImpact(uint256 amountIn, uint256 reserveIn) internal view returns (uint256) {
        uint256 impact = (amountIn * BASIS_POINTS) / (reserveIn);
        return (impact * priceImpactFactor) / (BASIS_POINTS);
    }

    /**
     * @dev Standard AMM swap calculation (constant product)
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256) {
        require(amountIn > 0, "COLDAMM: Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "COLDAMM: Insufficient liquidity");

        uint256 amountInWithFee = (amountIn * 997); // 0.3% fee
        uint256 numerator = (amountInWithFee * reserveOut);
        uint256 denominator = (reserveIn * 1000) + (amountInWithFee);

        return (numerator / denominator);
    }

    /**
     * @dev Execute arbitrage to maintain inverse correlation
     */
    function executeArbitrage() external onlyOwner nonReentrant {
        (uint256 xfgPrice, uint256 coldPrice) = inverseProtocol.getCurrentPrices();
        uint256 targetColdPrice = inverseProtocol.calculateTargetColdPrice(xfgPrice);

        if (coldPrice == targetColdPrice) {
            return; // No arbitrage opportunity
        }

        uint256 tradeAmount;
        uint256 profit;

        if (coldPrice > targetColdPrice) {
            // COLD is overpriced, sell COLD for XFG
            tradeAmount = calculateArbitrageAmount(coldPrice, targetColdPrice, coldReserve);
            profit = _executeColdToXfgArbitrage(tradeAmount);
        } else {
            // COLD is underpriced, buy COLD with XFG
            tradeAmount = calculateArbitrageAmount(targetColdPrice, coldPrice, xfgReserve);
            profit = _executeXfgToColdArbitrage(tradeAmount);
        }

        emit ArbitrageExecuted(xfgPrice, targetColdPrice, profit);
    }

    /**
     * @dev Calculate optimal arbitrage amount
     */
    function calculateArbitrageAmount(
        uint256 higherPrice,
        uint256 lowerPrice,
        uint256 reserve
    ) internal pure returns (uint256) {
        uint256 priceDiff = (higherPrice - lowerPrice);
        uint256 priceRatio = (priceDiff * PRECISION) / (lowerPrice);
        
        // Limit arbitrage to 5% of reserve
        uint256 maxArbitrage = (reserve / 20);
        uint256 calculatedAmount = (reserve * priceRatio) / ((PRECISION * 4));
        
        return calculatedAmount > maxArbitrage ? maxArbitrage : calculatedAmount;
    }

    /**
     * @dev Execute COLD to XFG arbitrage
     */
    function _executeColdToXfgArbitrage(uint256 coldAmount) internal returns (uint256 profit) {
        if (coldAmount > (coldReserve / 10)) {
            coldAmount = (coldReserve / 10); // Limit to 10% of reserve
        }

        uint256 xfgOut = getAmountOut(coldAmount, coldReserve, xfgReserve);
        coldReserve = (coldReserve + coldAmount);
        xfgReserve = (xfgReserve - xfgOut);

        // Profit calculation (simplified)
        profit = (xfgOut / 100); // 1% profit assumption
        return profit;
    }

    /**
     * @dev Execute XFG to COLD arbitrage
     */
    function _executeXfgToColdArbitrage(uint256 xfgAmount) internal returns (uint256 profit) {
        if (xfgAmount > (xfgReserve / 10)) {
            xfgAmount = (xfgReserve / 10); // Limit to 10% of reserve
        }

        uint256 coldOut = getAmountOut(xfgAmount, xfgReserve, coldReserve);
        xfgReserve = (xfgReserve + xfgAmount);
        coldReserve = (coldReserve - coldOut);

        // Profit calculation (simplified)
        profit = (coldOut / 100); // 1% profit assumption
        return profit;
    }

    /**
     * @dev Check and trigger rebalancing if needed
     */
    function _checkAndRebalance() internal {
        (uint256 xfgPrice, uint256 coldPrice) = inverseProtocol.getCurrentPrices();
        uint256 targetColdPrice = inverseProtocol.calculateTargetColdPrice(xfgPrice);

        uint256 deviation;
        if (coldPrice > targetColdPrice) {
            deviation = (coldPrice - targetColdPrice) * (BASIS_POINTS) / (targetColdPrice);
        } else {
            deviation = (targetColdPrice - coldPrice) * (BASIS_POINTS) / (targetColdPrice);
        }

        if (deviation > rebalanceThreshold) {
            // Trigger rebalancing in inverse protocol
            try inverseProtocol.executeRebalance() {} catch {}
        }
    }

    /**
     * @dev Update AMM parameters
     */
    function updateParameters(
        uint256 _tradingFee,
        uint256 _slippageTolerance,
        uint256 _rebalanceThreshold
    ) external onlyOwner {
        require(_tradingFee <= 500, "COLDAMM: Fee too high"); // Max 5%
        require(_slippageTolerance <= 1000, "COLDAMM: Slippage too high"); // Max 10%
        require(_rebalanceThreshold <= 500, "COLDAMM: Threshold too high"); // Max 5%

        inverseTradingFee = _tradingFee;
        slippageTolerance = _slippageTolerance;
        rebalanceThreshold = _rebalanceThreshold;

        emit ParametersUpdated(_tradingFee, _slippageTolerance, _rebalanceThreshold);
    }

    /**
     * @dev Get AMM statistics
     */
    function getAMMStats() external view returns (
        uint256 coldRes,
        uint256 xfgRes,
        uint256 totalLiq,
        uint256 volume,
        uint256 trades,
        uint256 fees
    ) {
        return (
            coldReserve,
            xfgReserve,
            totalLiquidity,
            totalVolume,
            totalTrades,
            totalFees
        );
    }

    /**
     * @dev Get quote for swap
     */
    function getSwapQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut, uint256 fee, uint256 priceImpact) {
        amountOut = calculateInverseSwapOutput(tokenIn, tokenOut, amountIn);
        fee = (amountOut * inverseTradingFee) / (BASIS_POINTS);
        
        uint256 reserveIn = tokenIn == address(coldToken) ? coldReserve : xfgReserve;
        priceImpact = calculatePriceImpact(amountIn, reserveIn);
        
        amountOut = (amountOut - fee);
    }

    /**
     * @dev Square root calculation
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / (2);
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z) + (z) / (2);
        }
        return y;
    }

    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "COLDAMM: Transfer failed");
    }
} 