// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test, console2 } from "forge-std/Test.sol";
import { AbstractStreamChannel } from "../src/AbstractStreamChannel.sol";
import { IAbstractStreamChannel } from "../src/interfaces/IAbstractStreamChannel.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Simple ERC-20 mock for testing.
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract AbstractStreamChannelTest is Test {
    AbstractStreamChannel public escrow;
    MockERC20 public token;

    address public payer = makeAddr("payer");
    address public payee = makeAddr("payee");
    uint256 public payerKey;

    bytes32 internal constant VOUCHER_TYPEHASH =
        keccak256("Voucher(bytes32 channelId,uint128 cumulativeAmount)");

    function setUp() public {
        // Give payer a deterministic key so we can sign vouchers
        payerKey = 0xA11CE;
        payer = vm.addr(payerKey);

        escrow = new AbstractStreamChannel();
        token = new MockERC20();

        // Fund payer
        token.mint(payer, 1_000e6);
        vm.prank(payer);
        token.approve(address(escrow), type(uint256).max);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    function _openChannel(uint128 deposit, bytes32 salt)
        internal
        returns (bytes32 channelId)
    {
        vm.prank(payer);
        channelId = escrow.open(payee, address(token), deposit, salt, address(0));
    }

    function _signVoucher(bytes32 channelId, uint128 cumulativeAmount)
        internal
        view
        returns (bytes memory sig)
    {
        bytes32 domainSep = escrow.domainSeparator();
        bytes32 structHash = keccak256(abi.encode(VOUCHER_TYPEHASH, channelId, cumulativeAmount));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(payerKey, digest);
        sig = abi.encodePacked(r, s, v);
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    function test_DomainName() public view {
        // VOUCHER_TYPEHASH must match
        assertEq(escrow.VOUCHER_TYPEHASH(), VOUCHER_TYPEHASH);
    }

    function test_Open() public {
        bytes32 salt = keccak256("salt1");
        uint128 deposit = 100e6;

        bytes32 channelId = _openChannel(deposit, salt);

        IAbstractStreamChannel.Channel memory ch = escrow.getChannel(channelId);
        assertEq(ch.payer, payer);
        assertEq(ch.payee, payee);
        assertEq(ch.token, address(token));
        assertEq(ch.deposit, deposit);
        assertEq(ch.settled, 0);
        assertFalse(ch.finalized);

        // Token moved to escrow
        assertEq(token.balanceOf(address(escrow)), deposit);
    }

    function test_Open_RevertZeroDeposit() public {
        vm.prank(payer);
        vm.expectRevert(IAbstractStreamChannel.ZeroDeposit.selector);
        escrow.open(payee, address(token), 0, bytes32(0), address(0));
    }

    function test_Open_RevertZeroPayee() public {
        vm.prank(payer);
        vm.expectRevert(IAbstractStreamChannel.InvalidPayee.selector);
        escrow.open(address(0), address(token), 100e6, bytes32(0), address(0));
    }

    function test_Open_RevertInvalidToken() public {
        vm.prank(payer);
        vm.expectRevert("invalid token");
        escrow.open(payee, address(0), 100e6, bytes32(0), address(0));
    }

    function test_Open_RevertDuplicate() public {
        bytes32 salt = keccak256("dup");
        _openChannel(100e6, salt);
        // Same salt → same channelId → should revert
        vm.prank(payer);
        vm.expectRevert(IAbstractStreamChannel.ChannelAlreadyExists.selector);
        escrow.open(payee, address(token), 50e6, salt, address(0));
    }

    function test_Settle() public {
        bytes32 channelId = _openChannel(100e6, keccak256("settle-test"));
        uint128 cumulative = 30e6;
        bytes memory sig = _signVoucher(channelId, cumulative);

        uint256 payeeBefore = token.balanceOf(payee);

        vm.prank(payee);
        escrow.settle(channelId, cumulative, sig);

        assertEq(token.balanceOf(payee), payeeBefore + cumulative);

        IAbstractStreamChannel.Channel memory ch = escrow.getChannel(channelId);
        assertEq(ch.settled, cumulative);
        assertFalse(ch.finalized);
    }

    function test_Settle_Incremental() public {
        bytes32 channelId = _openChannel(100e6, keccak256("incremental"));

        bytes memory sig1 = _signVoucher(channelId, 20e6);
        vm.prank(payee);
        escrow.settle(channelId, 20e6, sig1);

        bytes memory sig2 = _signVoucher(channelId, 50e6);
        vm.prank(payee);
        escrow.settle(channelId, 50e6, sig2);

        assertEq(token.balanceOf(payee), 50e6);
        assertEq(escrow.getChannel(channelId).settled, 50e6);
    }

    function test_Settle_RevertNotIncreasing() public {
        bytes32 channelId = _openChannel(100e6, keccak256("not-inc"));
        bytes memory sig = _signVoucher(channelId, 10e6);
        vm.prank(payee);
        escrow.settle(channelId, 10e6, sig);

        // Same amount — should revert
        vm.prank(payee);
        vm.expectRevert(IAbstractStreamChannel.AmountNotIncreasing.selector);
        escrow.settle(channelId, 10e6, sig);
    }

    function test_Settle_RevertBadSig() public {
        bytes32 channelId = _openChannel(100e6, keccak256("bad-sig"));
        bytes memory fakeSig = new bytes(65);
        vm.prank(payee);
        // Will either revert InvalidSignature or ECDSA error
        vm.expectRevert();
        escrow.settle(channelId, 10e6, fakeSig);
    }

    function test_TopUp() public {
        bytes32 channelId = _openChannel(50e6, keccak256("topup"));
        uint256 additional = 25e6;

        vm.prank(payer);
        escrow.topUp(channelId, additional);

        IAbstractStreamChannel.Channel memory ch = escrow.getChannel(channelId);
        assertEq(ch.deposit, 75e6);
        assertEq(token.balanceOf(address(escrow)), 75e6);
    }

    function test_Close_ByPayee() public {
        bytes32 channelId = _openChannel(100e6, keccak256("close-payee"));
        uint128 cumulative = 40e6;
        bytes memory sig = _signVoucher(channelId, cumulative);

        uint256 payeeBefore = token.balanceOf(payee);
        uint256 payerBefore = token.balanceOf(payer);

        vm.prank(payee);
        escrow.close(channelId, cumulative, sig);

        assertEq(token.balanceOf(payee), payeeBefore + cumulative);
        assertEq(token.balanceOf(payer), payerBefore + (100e6 - cumulative));
        assertTrue(escrow.getChannel(channelId).finalized);
    }

    function test_Close_ZeroAmount() public {
        bytes32 channelId = _openChannel(100e6, keccak256("close-zero"));
        vm.prank(payee);
        escrow.close(channelId, 0, "");
        assertTrue(escrow.getChannel(channelId).finalized);
        assertEq(token.balanceOf(payer), 1_000e6); // full refund
    }

    function test_RequestClose_And_Withdraw() public {
        bytes32 channelId = _openChannel(100e6, keccak256("withdraw"));

        vm.prank(payer);
        escrow.requestClose(channelId);

        IAbstractStreamChannel.Channel memory ch = escrow.getChannel(channelId);
        assertGt(ch.closeRequestedAt, 0);

        // Try to withdraw immediately — should revert
        vm.prank(payer);
        vm.expectRevert(IAbstractStreamChannel.CloseNotReady.selector);
        escrow.withdraw(channelId);

        // Fast-forward past grace period
        vm.warp(block.timestamp + escrow.CLOSE_GRACE_PERIOD() + 1);

        uint256 payerBefore = token.balanceOf(payer);
        vm.prank(payer);
        escrow.withdraw(channelId);
        assertEq(token.balanceOf(payer), payerBefore + 100e6);
        assertTrue(escrow.getChannel(channelId).finalized);
    }

    function test_ComputeChannelId_Deterministic() public view {
        bytes32 salt = keccak256("det");
        bytes32 id1 = escrow.computeChannelId(payer, payee, address(token), salt, address(0));
        bytes32 id2 = escrow.computeChannelId(payer, payee, address(token), salt, address(0));
        assertEq(id1, id2);
    }

    function test_GetChannelsBatch() public {
        bytes32 id1 = _openChannel(10e6, keccak256("b1"));
        bytes32 id2 = _openChannel(20e6, keccak256("b2"));

        bytes32[] memory ids = new bytes32[](2);
        ids[0] = id1;
        ids[1] = id2;

        IAbstractStreamChannel.Channel[] memory channels = escrow.getChannelsBatch(ids);
        assertEq(channels[0].deposit, 10e6);
        assertEq(channels[1].deposit, 20e6);
    }

    function test_GetVoucherDigest() public {
        bytes32 channelId = _openChannel(100e6, keccak256("digest"));
        bytes32 digest = escrow.getVoucherDigest(channelId, 50e6);
        assertNotEq(digest, bytes32(0));
    }
}
