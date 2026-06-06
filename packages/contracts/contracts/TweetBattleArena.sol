// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TweetBattleArena is Ownable, Pausable, ReentrancyGuard {
    enum BattleStatus {
        PendingAcceptance,
        Active,
        Voting,
        Finalized,
        Cancelled
    }

    struct Battle {
        address challenger;
        address opponentWallet;
        string challengerHandle;
        string opponentHandle;
        string topic;
        uint256 stakeAmount;
        uint8 tweetsPerPlayer;
        uint64 createdAt;
        uint64 startTime;
        uint64 endTime;
        uint64 votingEndTime;
        uint16 aiWeightBps;
        uint16 communityWeightBps;
        uint256 challengerVotePower;
        uint256 opponentVotePower;
        uint256 votePool;
        address winner;
        BattleStatus status;
        bool rewardClaimed;
        uint64 duration;
        uint64 votingDuration;
    }

    uint256 public constant BASE_VOTE_PRICE = 0.01 ether;
    uint256 public constant ACCEPTANCE_TIMEOUT = 3 days;
    uint256 public nextBattleId = 1;
    address public resolver;

    mapping(uint256 => Battle) public battles;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint8)) public tweetCount;

    event BattleCreated(
        uint256 indexed battleId,
        address indexed challenger,
        string opponentHandle,
        uint256 stakeAmount
    );
    event BattleAccepted(uint256 indexed battleId, address indexed opponent);
    event TweetSubmitted(
        uint256 indexed battleId,
        address indexed player,
        uint8 indexed submissionNumber,
        string tweetUrl
    );
    event VoteCast(
        uint256 indexed battleId,
        address indexed voter,
        bool supportChallenger,
        uint8 votePower,
        uint256 cost
    );
    event BattleMovedToVoting(uint256 indexed battleId, uint64 votingEndTime);
    event BattleFinalized(
        uint256 indexed battleId,
        address indexed winner,
        uint256 challengerFinalScore,
        uint256 opponentFinalScore
    );
    event RewardClaimed(uint256 indexed battleId, address indexed winner, uint256 amount);
    event BattleCancelled(uint256 indexed battleId);
    event ResolverUpdated(address indexed resolver);

    error InvalidBattle();
    error InvalidState();
    error InvalidValue();
    error NotPlayer();
    error Unauthorized();
    error TooEarly();
    error AlreadyVoted();
    error SubmissionLimitReached();

    constructor(address initialResolver) Ownable(msg.sender) {
        resolver = initialResolver == address(0) ? msg.sender : initialResolver;
    }

    modifier battleExists(uint256 battleId) {
        if (battleId == 0 || battleId >= nextBattleId) revert InvalidBattle();
        _;
    }

    function createBattle(
        string calldata opponentHandle,
        string calldata challengerHandle,
        string calldata topic,
        uint8 tweetsPerPlayer,
        uint64 duration,
        uint64 votingDuration,
        uint16 aiWeightBps
    ) external payable whenNotPaused returns (uint256 battleId) {
        if (
            msg.value == 0 ||
            bytes(opponentHandle).length == 0 ||
            bytes(challengerHandle).length == 0 ||
            bytes(topic).length == 0 ||
            tweetsPerPlayer == 0 ||
            tweetsPerPlayer > 3 ||
            duration == 0 ||
            votingDuration == 0 ||
            aiWeightBps > 10_000
        ) revert InvalidValue();

        battleId = nextBattleId++;
        Battle storage battle = battles[battleId];
        battle.challenger = msg.sender;
        battle.challengerHandle = challengerHandle;
        battle.opponentHandle = opponentHandle;
        battle.topic = topic;
        battle.stakeAmount = msg.value;
        battle.tweetsPerPlayer = tweetsPerPlayer;
        battle.createdAt = uint64(block.timestamp);
        battle.aiWeightBps = aiWeightBps;
        battle.communityWeightBps = uint16(10_000 - aiWeightBps);
        battle.status = BattleStatus.PendingAcceptance;
        battle.duration = duration;
        battle.votingDuration = votingDuration;

        emit BattleCreated(battleId, msg.sender, opponentHandle, msg.value);
    }

    function acceptBattle(
        uint256 battleId,
        string calldata opponentHandle
    ) external payable nonReentrant whenNotPaused battleExists(battleId) {
        Battle storage battle = battles[battleId];
        if (battle.status != BattleStatus.PendingAcceptance) revert InvalidState();
        if (msg.sender == battle.challenger) revert NotPlayer();
        if (msg.value != battle.stakeAmount) revert InvalidValue();
        if (
            keccak256(bytes(opponentHandle)) != keccak256(bytes(battle.opponentHandle))
        ) revert InvalidValue();

        battle.opponentWallet = msg.sender;
        battle.startTime = uint64(block.timestamp);
        battle.endTime = uint64(block.timestamp + battle.duration);
        battle.status = BattleStatus.Active;
        emit BattleAccepted(battleId, msg.sender);
    }

    function submitTweet(
        uint256 battleId,
        string calldata tweetUrl
    ) external whenNotPaused battleExists(battleId) {
        Battle storage battle = battles[battleId];
        if (battle.status != BattleStatus.Active || block.timestamp > battle.endTime) {
            revert InvalidState();
        }
        if (msg.sender != battle.challenger && msg.sender != battle.opponentWallet) {
            revert NotPlayer();
        }
        uint8 count = tweetCount[battleId][msg.sender];
        if (count >= battle.tweetsPerPlayer) revert SubmissionLimitReached();
        if (bytes(tweetUrl).length == 0) revert InvalidValue();

        tweetCount[battleId][msg.sender] = count + 1;
        emit TweetSubmitted(battleId, msg.sender, count + 1, tweetUrl);
    }

    function vote(
        uint256 battleId,
        bool supportChallenger,
        uint8 votePower
    ) external payable nonReentrant whenNotPaused battleExists(battleId) {
        Battle storage battle = battles[battleId];
        bool activeWindow =
            battle.status == BattleStatus.Active && block.timestamp <= battle.endTime;
        bool votingWindow =
            battle.status == BattleStatus.Voting &&
            block.timestamp <= battle.votingEndTime;
        if (!activeWindow && !votingWindow) revert InvalidState();
        if (votePower == 0 || votePower > 100) revert InvalidValue();
        if (hasVoted[battleId][msg.sender]) revert AlreadyVoted();
        uint256 cost = BASE_VOTE_PRICE * uint256(votePower) * uint256(votePower);
        if (msg.value != cost) revert InvalidValue();

        hasVoted[battleId][msg.sender] = true;
        battle.votePool += cost;
        if (supportChallenger) {
            battle.challengerVotePower += votePower;
        } else {
            battle.opponentVotePower += votePower;
        }
        emit VoteCast(battleId, msg.sender, supportChallenger, votePower, cost);
    }

    function moveToVoting(uint256 battleId) external battleExists(battleId) {
        Battle storage battle = battles[battleId];
        if (battle.status != BattleStatus.Active) revert InvalidState();
        if (block.timestamp < battle.endTime) revert TooEarly();
        battle.status = BattleStatus.Voting;
        battle.votingEndTime = uint64(block.timestamp + battle.votingDuration);
        emit BattleMovedToVoting(battleId, battle.votingEndTime);
    }

    function finalizeBattle(
        uint256 battleId,
        uint16 challengerAiScore,
        uint16 opponentAiScore
    ) external battleExists(battleId) {
        if (msg.sender != resolver && msg.sender != owner()) revert Unauthorized();
        Battle storage battle = battles[battleId];
        if (battle.status != BattleStatus.Voting) revert InvalidState();
        if (block.timestamp < battle.votingEndTime) revert TooEarly();
        if (challengerAiScore > 10_000 || opponentAiScore > 10_000) {
            revert InvalidValue();
        }

        uint256 totalVotes = battle.challengerVotePower + battle.opponentVotePower;
        uint256 challengerCommunityScore = totalVotes == 0
            ? 5_000
            : (battle.challengerVotePower * 10_000) / totalVotes;
        uint256 opponentCommunityScore = totalVotes == 0
            ? 5_000
            : (battle.opponentVotePower * 10_000) / totalVotes;
        uint256 challengerFinal =
            (challengerCommunityScore * battle.communityWeightBps +
                uint256(challengerAiScore) *
                battle.aiWeightBps) / 10_000;
        uint256 opponentFinal =
            (opponentCommunityScore * battle.communityWeightBps +
                uint256(opponentAiScore) *
                battle.aiWeightBps) / 10_000;

        battle.winner = challengerFinal >= opponentFinal
            ? battle.challenger
            : battle.opponentWallet;
        battle.status = BattleStatus.Finalized;
        emit BattleFinalized(battleId, battle.winner, challengerFinal, opponentFinal);
    }

    function claimReward(
        uint256 battleId
    ) external nonReentrant battleExists(battleId) {
        Battle storage battle = battles[battleId];
        if (battle.status != BattleStatus.Finalized || msg.sender != battle.winner) {
            revert Unauthorized();
        }
        if (battle.rewardClaimed) revert InvalidState();
        battle.rewardClaimed = true;
        uint256 amount = battle.stakeAmount * 2 + battle.votePool;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert InvalidValue();
        emit RewardClaimed(battleId, msg.sender, amount);
    }

    function cancelUnacceptedBattle(
        uint256 battleId
    ) external nonReentrant battleExists(battleId) {
        Battle storage battle = battles[battleId];
        if (
            battle.status != BattleStatus.PendingAcceptance ||
            msg.sender != battle.challenger
        ) revert Unauthorized();
        if (block.timestamp < battle.createdAt + ACCEPTANCE_TIMEOUT) revert TooEarly();
        battle.status = BattleStatus.Cancelled;
        (bool sent, ) = payable(battle.challenger).call{value: battle.stakeAmount}("");
        if (!sent) revert InvalidValue();
        emit BattleCancelled(battleId);
    }

    function emergencyCancel(
        uint256 battleId
    ) external onlyOwner nonReentrant battleExists(battleId) {
        Battle storage battle = battles[battleId];
        if (
            battle.status == BattleStatus.Finalized ||
            battle.status == BattleStatus.Cancelled
        ) revert InvalidState();
        battle.status = BattleStatus.Cancelled;
        uint256 challengerRefund = battle.stakeAmount;
        uint256 opponentRefund = battle.opponentWallet == address(0)
            ? 0
            : battle.stakeAmount;
        (bool challengerSent, ) = payable(battle.challenger).call{
            value: challengerRefund
        }("");
        if (!challengerSent) revert InvalidValue();
        if (opponentRefund > 0) {
            (bool opponentSent, ) = payable(battle.opponentWallet).call{
                value: opponentRefund
            }("");
            if (!opponentSent) revert InvalidValue();
        }
        emit BattleCancelled(battleId);
    }

    function setResolver(address newResolver) external onlyOwner {
        if (newResolver == address(0)) revert InvalidValue();
        resolver = newResolver;
        emit ResolverUpdated(newResolver);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
