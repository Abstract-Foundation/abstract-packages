# Bigcoin Game Contracts Reference

## Contents
- Contract Addresses
- Game Contract (MainV2) Interface
- BIG Token Interface
- Facility Tiers
- Mining Mechanics
- Halving Schedule

## Contract Addresses

| Contract | Address | Type |
|----------|---------|------|
| Game (proxy) | `0x89eb96a0a157f935de38d548b79af511d424e33a` | ERC1967Proxy → MainV2 |
| Game (impl) | `0xd3131Be7f20c432774daf3f49c146a1d3149d64a` | MainV2 |
| $BIG Token | `0xdf70075737e9f96b078ab4461eee3e055e061223` | ERC-20, 18 decimals |
| Bigtoshi NFT | `0xb1eefa4f7b3987468441baa339e147a2cfee3d36` | Miner NFTs |

All calls go to the proxy address (`0x89eb96...`), which delegates to the implementation.

## Game Contract Interface

### Player Read Functions

```solidity
// Check unclaimed rewards (18 decimals)
function pendingRewards(address player) external view returns (uint256)

// Player's BIG earnings per block (18 decimals)
function playerBigcoinPerBlock(address player) external view returns (uint256)

// Player's facility info (returns struct)
function ownerToFacility(address player) public view returns (AggregateFacility)

// Paginated miner list
function getPlayerMinersPaginated(address player, uint256 startIndex, uint256 size) external view returns (AggregateMiner[])

// Single miner by ID
function playerMinersId(uint256 minerId) public view returns (AggregateMiner)

// Check if a miner can be placed
function canBuyMiner(address facilityAddress, uint256 minerIndex, uint256 x, uint256 y) external view returns (bool, bytes4)

// Time until next facility upgrade is available
function timeUntilNextFacilityUpgrade(address player) external view returns (uint256)

// Referral tracking
function getReferrals(address referrer) external view returns (address[])
```

### Global Read Functions

```solidity
// Current emission rate per block (18 decimals)
function getBigcoinPerBlock() public view returns (uint256)

// Blocks until next halving
function blocksUntilNextHalving() external view returns (uint256)

// Block where mining started
function startBlock() external view returns (uint256)

// Last block where rewards were distributed
function lastRewardBlock() external view returns (uint256)

// Constants
function HALVING_INTERVAL() external pure returns (uint256)  // 4,200,000
function INITIAL_BIGCOIN_PER_BLOCK() external pure returns (uint256)  // 2.5e18
function REWARDS_PRECISION() external pure returns (uint256)

// Miner info by index
function minerName(uint256 minerIndex) external view returns (string memory)
```

### Player Write Functions

```solidity
// Claim accumulated mining rewards
function claimRewards() public returns (uint256)

// Buy initial facility (one-time ETH payment)
function purchaseInitialFacility(address referrer) external payable

// Upgrade to next facility tier (costs $BIG, 24hr cooldown)
function buyNewFacility() external

// Buy and auto-stake a miner (costs $BIG, needs approval)
function buyMiner(uint256 minerIndex, uint256 x, uint256 y) external

// Buy miner with server signature (for special/limited miners)
function buyMinerWithSignature(uint256 minerIndex, uint256 x, uint256 y, bytes memory signature) public

// Get the free starter miner
function getFreeStarterMiner(uint256 x, uint256 y) external

// Place an owned miner into facility
function installMiner(uint256 minerId, uint256 x, uint256 y) external

// Remove a miner from facility (24hr lockup after install)
function removeMiner(uint256 minerId) external

// Sell a miner back for $BIG (miner is burned)
function sellMiner(uint256 minerId) external
```

### Merge Mining Functions

```solidity
// Claim rewards from a merge-mined token
function claimMergeMiningRewards(address minepad) external

// Sync merge-mined token state
function syncMinepad(address minepad) external

// Deallocate hashrate from merge mining
function deallocateHashrate() external
```

## BIG Token Interface

Standard ERC-20 plus:

```solidity
function mint(address to, uint256 amount) external  // minter only (game contract)
function burn(uint256 value) external
function minter() view returns (address)  // 0x89eb96a0...
function MAX_SUPPLY() view returns (uint256)  // 21,000,000e18
```

## Facility Tiers

| Tier | Name | Cost ($BIG) | Max Miners | Power Output |
|------|------|------------|-----------|--------------|
| 1 | Bedroom | Free (ETH init) | 4 | 28 |
| 2 | Garage | 42 | 8 | 168 |
| 3 | Shed | 106 | 12 | 420 |
| 4 | Cheap Office | 190 | 16 | 1,120 |
| 5 | Nicer Office | 230 | 20 | 7,000 |
| 6 | High Voltage Warehouse | 275 | 20 | 13,125 |
| 7 | Quantum Core Facility | 295 | 24 | 20,000 |
| 8 | The Portal Lab I | 850 | 42 | 40,000 |
| 9 | The Portal Lab II | 1,020 | 42 | 65,000 |

Upgrading has a 24-hour cooldown between tiers. `buyNewFacility()` upgrades to the next tier and costs the listed $BIG amount (75% burned, 25% to treasury).

## Mining Mechanics

### Reward Formula

```
R_i = (h_i / H) × R_b
```

- `h_i` = player's total hashrate (sum of installed miners' GH/s)
- `H` = total network hashrate
- `R_b` = current emission per block

### Halving Schedule

| Halving | Blocks | Emission (BIG/block) |
|---------|--------|---------------------|
| 0 | 0 - 4,199,999 | 2.5 |
| 1 | 4,200,000 - 8,399,999 | 1.25 |
| 2 | 8,400,000 - 12,599,999 | 0.625 |
| 3 | 12,600,000 - 16,799,999 | 0.3125 |
| 4+ | continues | halves again |

Current on-chain value: ~0.039 BIG/block (after 6 halvings).

### Miner Lifecycle

1. Purchase with `buyMiner(minerIndex, x, y)` — requires $BIG approval to game contract
2. Auto-staked into facility at grid position (x, y)
3. 24-hour lockup before removable
4. `removeMiner(minerId)` — unstakes, becomes tradeable ERC-721
5. `installMiner(minerId, x, y)` — re-stakes into facility
6. `sellMiner(minerId)` — sells back for $BIG (miner burned, not all types sellable)

### Power Constraint

Total power consumption of all installed miners cannot exceed facility power output. Check `canBuyMiner()` before purchasing to verify fit.
