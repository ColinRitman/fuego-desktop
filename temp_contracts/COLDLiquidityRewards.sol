// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title COLD Liquidity Rewards
 * @dev Incentivizes liquidity provision for HEAT/O token pairs
 */
contract COLDLiquidityRewards is ReentrancyGuard, Ownable {
    
    struct LiquidityProvider {
        uint256 heatOLPStaked;
        uint256 oETHLPStaked;
        uint256 lastRewardClaim;
        uint256 totalRewardsEarned;
    }
    
    mapping(address => LiquidityProvider) public providers;
    
    IERC20 public oToken;
    IERC20 public heatToken;
    IERC20 public heatOLP;  // HEAT/O LP token
    IERC20 public oETHLP;   // O/ETH LP token
    
    uint256 public rewardRate = 2000; // 20% APY
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    
    event LiquidityStaked(address indexed provider, uint256 heatOAmount, uint256 oETHAmount);
    event RewardsClaimed(address indexed provider, uint256 amount);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    function stakeLiquidity(uint256 heatOAmount, uint256 oETHAmount) external nonReentrant {
        require(heatOAmount > 0 || oETHAmount > 0, "Must stake some LP");
        
        claimRewards(); // Claim existing rewards first
        
        if (heatOAmount > 0) {
            heatOLP.transferFrom(msg.sender, address(this), heatOAmount);
            providers[msg.sender].heatOLPStaked += heatOAmount;
        }
        
        if (oETHAmount > 0) {
            oETHLP.transferFrom(msg.sender, address(this), oETHAmount);
            providers[msg.sender].oETHLPStaked += oETHAmount;
        }
        
        providers[msg.sender].lastRewardClaim = block.timestamp;
        totalStaked += heatOAmount + oETHAmount;
        
        emit LiquidityStaked(msg.sender, heatOAmount, oETHAmount);
    }
    
    function claimRewards() public nonReentrant {
        LiquidityProvider storage provider = providers[msg.sender];
        uint256 totalLP = provider.heatOLPStaked + provider.oETHLPStaked;
        
        if (totalLP > 0) {
            uint256 timeStaked = block.timestamp - provider.lastRewardClaim;
            uint256 rewards = (totalLP * rewardRate * timeStaked) / (365 days * 10000);
            
            if (rewards > 0) {
                provider.totalRewardsEarned += rewards;
                provider.lastRewardClaim = block.timestamp;
                totalRewardsDistributed += rewards;
                
                // Mint O tokens as rewards
                (bool success,) = address(oToken).call(
                    abi.encodeWithSignature("mint(address,uint256)", msg.sender, rewards)
                );
                require(success, "Reward mint failed");
                
                emit RewardsClaimed(msg.sender, rewards);
            }
        }
    }
    
    function setTokens(address _oToken, address _heatToken, address _heatOLP, address _oETHLP) 
        external onlyOwner 
    {
        oToken = IERC20(_oToken);
        heatToken = IERC20(_heatToken);
        heatOLP = IERC20(_heatOLP);
        oETHLP = IERC20(_oETHLP);
    }
    
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 5000, "Rate too high"); // Max 50%
        rewardRate = newRate;
    }
} 