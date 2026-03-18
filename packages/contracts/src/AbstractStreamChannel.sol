// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAbstractStreamChannel } from "./interfaces/IAbstractStreamChannel.sol";
import { ECDSA } from "solady/utils/ECDSA.sol";
import { EIP712 } from "solady/utils/EIP712.sol";

/**
 * @title AbstractStreamChannel
 * @notice Unidirectional payment channel escrow for streaming payments on Abstract.
 * @dev Port of TempoStreamChannel.sol with the following changes:
 *      1. ITIP20 replaced with OpenZeppelin IERC20.
 *      2. TempoUtilities.isTIP20() replaced with `require(token != address(0))`.
 *      3. EIP-712 domain name changed to "Abstract Stream Channel".
 *      4. All logic, function signatures, events, and errors are identical.
 *
 *      Users deposit ERC-20 tokens (e.g., USDC.e), sign cumulative vouchers
 *      off-chain, and servers call settle() / close() to collect payments.
 *      Channels have no expiry — closed cooperatively by the server or after a
 *      grace period following a payer's requestClose().
 */
contract AbstractStreamChannel is IAbstractStreamChannel, EIP712 {

    // --- Constants ---

    bytes32 public constant VOUCHER_TYPEHASH =
        keccak256("Voucher(bytes32 channelId,uint128 cumulativeAmount)");

    uint64 public constant CLOSE_GRACE_PERIOD = 15 minutes;

    // --- State ---

    mapping(bytes32 => Channel) public channels;

    // --- EIP-712 Domain ---

    function _domainNameAndVersion()
        internal
        pure
        override
        returns (string memory name, string memory version)
    {
        name = "Abstract Stream Channel";
        version = "1";
    }

    // --- External Functions ---

    /**
     * @notice Open a new payment channel with escrowed funds.
     * @param payee Address authorized to withdraw (server)
     * @param token ERC-20 token address (must be non-zero)
     * @param deposit Amount to deposit
     * @param salt Random salt for channel ID generation
     * @param authorizedSigner Address authorized to sign vouchers (address(0) = use msg.sender)
     * @return channelId The unique channel identifier
     */
    function open(
        address payee,
        address token,
        uint128 deposit,
        bytes32 salt,
        address authorizedSigner
    )
        external
        override
        returns (bytes32 channelId)
    {
        if (payee == address(0)) {
            revert InvalidPayee();
        }
        // Replace TempoUtilities.isTIP20(token) with a simple zero-address check.
        // Any standard ERC-20 is valid — no TIP-20 interface detection required.
        require(token != address(0), "invalid token");
        if (deposit == 0) {
            revert ZeroDeposit();
        }

        channelId = computeChannelId(msg.sender, payee, token, salt, authorizedSigner);

        if (channels[channelId].payer != address(0) || channels[channelId].finalized) {
            revert ChannelAlreadyExists();
        }

        channels[channelId] = Channel({
            payer: msg.sender,
            payee: payee,
            token: token,
            authorizedSigner: authorizedSigner,
            deposit: deposit,
            settled: 0,
            closeRequestedAt: 0,
            finalized: false
        });

        bool success = IERC20(token).transferFrom(msg.sender, address(this), deposit);
        if (!success) {
            revert TransferFailed();
        }

        emit ChannelOpened(channelId, msg.sender, payee, token, authorizedSigner, salt, deposit);
    }

    /**
     * @notice Settle funds using a signed voucher.
     * @param channelId The channel to settle
     * @param cumulativeAmount Total amount authorized by the voucher
     * @param signature EIP-712 signature from the payer / authorizedSigner
     */
    function settle(
        bytes32 channelId,
        uint128 cumulativeAmount,
        bytes calldata signature
    )
        external
        override
    {
        Channel storage channel = channels[channelId];

        if (channel.finalized) {
            revert ChannelFinalized();
        }
        if (channel.payer == address(0)) {
            revert ChannelNotFound();
        }
        if (msg.sender != channel.payee) {
            revert NotPayee();
        }
        if (cumulativeAmount > channel.deposit) {
            revert AmountExceedsDeposit();
        }
        if (cumulativeAmount <= channel.settled) {
            revert AmountNotIncreasing();
        }

        bytes32 structHash = keccak256(abi.encode(VOUCHER_TYPEHASH, channelId, cumulativeAmount));
        bytes32 digest = _hashTypedData(structHash);
        address signer = ECDSA.recoverCalldata(digest, signature);

        address expectedSigner =
            channel.authorizedSigner != address(0) ? channel.authorizedSigner : channel.payer;

        if (signer != expectedSigner) {
            revert InvalidSignature();
        }

        uint128 delta = cumulativeAmount - channel.settled;
        channel.settled = cumulativeAmount;

        bool success = IERC20(channel.token).transfer(channel.payee, delta);
        if (!success) {
            revert TransferFailed();
        }

        emit Settled(
            channelId, channel.payer, channel.payee, cumulativeAmount, delta, channel.settled
        );
    }

    /**
     * @notice Add more funds to a channel.
     * @param channelId The channel to top up
     * @param additionalDeposit Amount to add
     */
    function topUp(bytes32 channelId, uint256 additionalDeposit) external override {
        Channel storage channel = channels[channelId];

        if (channel.finalized) {
            revert ChannelFinalized();
        }
        if (channel.payer == address(0)) {
            revert ChannelNotFound();
        }
        if (msg.sender != channel.payer) {
            revert NotPayer();
        }
        if (additionalDeposit == 0) {
            revert ZeroDeposit();
        }
        if (additionalDeposit > type(uint128).max - channel.deposit) {
            revert DepositOverflow();
        }

        channel.deposit += uint128(additionalDeposit);

        bool success =
            IERC20(channel.token).transferFrom(msg.sender, address(this), additionalDeposit);
        if (!success) {
            revert TransferFailed();
        }

        if (channel.closeRequestedAt != 0) {
            channel.closeRequestedAt = 0;
            emit CloseRequestCancelled(channelId, channel.payer, channel.payee);
        }

        emit TopUp(channelId, channel.payer, channel.payee, additionalDeposit, channel.deposit);
    }

    /**
     * @notice Request early channel closure (payer-initiated).
     * @dev Starts a 15-minute grace period after which the payer can withdraw.
     * @param channelId The channel to close
     */
    function requestClose(bytes32 channelId) external override {
        Channel storage channel = channels[channelId];

        if (channel.finalized) {
            revert ChannelFinalized();
        }
        if (channel.payer == address(0)) {
            revert ChannelNotFound();
        }
        if (msg.sender != channel.payer) {
            revert NotPayer();
        }

        if (channel.closeRequestedAt == 0) {
            channel.closeRequestedAt = uint64(block.timestamp);
            emit CloseRequested(
                channelId, channel.payer, channel.payee, block.timestamp + CLOSE_GRACE_PERIOD
            );
        }
    }

    /**
     * @notice Close a channel immediately (server only).
     * @dev Settles any outstanding voucher and refunds remainder to payer.
     * @param channelId The channel to close
     * @param cumulativeAmount Final cumulative amount (0 if no payments)
     * @param signature EIP-712 signature (empty if cumulativeAmount == 0 or already settled)
     */
    function close(
        bytes32 channelId,
        uint128 cumulativeAmount,
        bytes calldata signature
    )
        external
        override
    {
        Channel storage channel = channels[channelId];

        if (channel.finalized) {
            revert ChannelFinalized();
        }
        if (channel.payer == address(0)) {
            revert ChannelNotFound();
        }
        if (msg.sender != channel.payee) {
            revert NotPayee();
        }

        address token = channel.token;
        address payer = channel.payer;
        address payee = channel.payee;
        uint128 deposit = channel.deposit;
        uint128 settledAmount = channel.settled;
        uint128 delta = 0;

        if (cumulativeAmount > settledAmount) {
            if (cumulativeAmount > channel.deposit) {
                revert AmountExceedsDeposit();
            }

            bytes32 structHash =
                keccak256(abi.encode(VOUCHER_TYPEHASH, channelId, cumulativeAmount));
            bytes32 digest = _hashTypedData(structHash);
            address signer = ECDSA.recoverCalldata(digest, signature);

            address expectedSigner =
                channel.authorizedSigner != address(0) ? channel.authorizedSigner : channel.payer;

            if (signer != expectedSigner) {
                revert InvalidSignature();
            }

            delta = cumulativeAmount - settledAmount;
            settledAmount = cumulativeAmount;
        }

        uint128 refund = deposit - settledAmount;
        _clearAndFinalize(channelId);

        if (delta > 0) {
            bool success = IERC20(token).transfer(payee, delta);
            if (!success) {
                revert TransferFailed();
            }
        }

        if (refund > 0) {
            bool success = IERC20(token).transfer(payer, refund);
            if (!success) {
                revert TransferFailed();
            }
        }

        emit ChannelClosed(channelId, payer, payee, settledAmount, refund);
    }

    /**
     * @notice Withdraw remaining funds after close grace period (payer-initiated).
     * @param channelId The channel to withdraw from
     */
    function withdraw(bytes32 channelId) external override {
        Channel storage channel = channels[channelId];

        if (channel.finalized) {
            revert ChannelFinalized();
        }
        if (channel.payer == address(0)) {
            revert ChannelNotFound();
        }
        if (msg.sender != channel.payer) {
            revert NotPayer();
        }

        bool closeGracePassed = channel.closeRequestedAt != 0
            && block.timestamp >= channel.closeRequestedAt + CLOSE_GRACE_PERIOD;

        if (!closeGracePassed) {
            revert CloseNotReady();
        }

        address token = channel.token;
        address payer = channel.payer;
        address payee = channel.payee;
        uint128 deposit = channel.deposit;
        uint128 settledAmount = channel.settled;
        uint128 refund = deposit - settledAmount;

        _clearAndFinalize(channelId);

        if (refund > 0) {
            bool success = IERC20(token).transfer(payer, refund);
            if (!success) {
                revert TransferFailed();
            }
        }

        emit ChannelExpired(channelId, payer, payee);
        emit ChannelClosed(channelId, payer, payee, settledAmount, refund);
    }

    // --- View Functions ---

    /**
     * @notice Get channel state.
     */
    function getChannel(bytes32 channelId) external view override returns (Channel memory) {
        return channels[channelId];
    }

    /**
     * @notice Compute the channel ID for given parameters.
     */
    function computeChannelId(
        address payer,
        address payee,
        address token,
        bytes32 salt,
        address authorizedSigner
    )
        public
        view
        override
        returns (bytes32)
    {
        return keccak256(
            abi.encode(payer, payee, token, salt, authorizedSigner, address(this), block.chainid)
        );
    }

    /**
     * @notice Get the EIP-712 domain separator.
     */
    function domainSeparator() external view override returns (bytes32) {
        return _domainSeparator();
    }

    /**
     * @notice Compute the EIP-712 digest for a voucher (for off-chain signing).
     */
    function getVoucherDigest(
        bytes32 channelId,
        uint128 cumulativeAmount
    )
        external
        view
        override
        returns (bytes32)
    {
        bytes32 structHash = keccak256(abi.encode(VOUCHER_TYPEHASH, channelId, cumulativeAmount));
        return _hashTypedData(structHash);
    }

    /**
     * @notice Batch-read multiple channel states in a single call.
     * @param channelIds Array of channel IDs to query
     */
    function getChannelsBatch(bytes32[] calldata channelIds)
        external
        view
        override
        returns (Channel[] memory channelStates)
    {
        uint256 length = channelIds.length;
        channelStates = new Channel[](length);
        for (uint256 i = 0; i < length; ++i) {
            channelStates[i] = channels[channelIds[i]];
        }
    }

    // --- Internal ---

    function _clearAndFinalize(bytes32 channelId) internal {
        delete channels[channelId];
        channels[channelId].finalized = true;
    }
}
