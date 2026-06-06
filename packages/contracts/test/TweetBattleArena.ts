import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("TweetBattleArena", function () {
  it("runs the create, accept, vote, finalize, and claim flow", async function () {
    const [owner, challenger, opponent, voter] = await ethers.getSigners();
    const arena = await ethers.deployContract("TweetBattleArena", [
      owner.address,
    ]);
    const stake = ethers.parseEther("1");

    await arena
      .connect(challenger)
      .createBattle("opponent", "challenger", "Monad vs L2s", 2, 60, 60, 3000, {
        value: stake,
      });
    await arena.connect(opponent).acceptBattle(1, "opponent", { value: stake });
    await arena
      .connect(challenger)
      .submitTweet(1, "https://x.com/challenger/status/123");
    await arena.connect(voter).vote(1, true, 3, {
      value: ethers.parseEther("0.09"),
    });

    await time.increase(61);
    await arena.moveToVoting(1);
    await time.increase(61);
    await arena.finalizeBattle(1, 8000, 6000);

    const battle = await arena.battles(1);
    expect(battle.winner).to.equal(challenger.address);
    await expect(
      arena.connect(challenger).claimReward(1),
    ).to.changeEtherBalance(challenger, ethers.parseEther("2.09"));
  });

  it("rejects duplicate voters and excessive tweet submissions", async function () {
    const [owner, challenger, opponent, voter] = await ethers.getSigners();
    const arena = await ethers.deployContract("TweetBattleArena", [
      owner.address,
    ]);
    await arena
      .connect(challenger)
      .createBattle("opponent", "challenger", "A topic", 1, 60, 60, 3000, {
        value: ethers.parseEther("1"),
      });
    await arena
      .connect(opponent)
      .acceptBattle(1, "opponent", { value: ethers.parseEther("1") });
    await arena
      .connect(challenger)
      .submitTweet(1, "https://x.com/challenger/status/123");

    await expect(
      arena
        .connect(challenger)
        .submitTweet(1, "https://x.com/challenger/status/456"),
    ).to.be.revertedWithCustomError(arena, "SubmissionLimitReached");

    await arena.connect(voter).vote(1, false, 1, {
      value: ethers.parseEther("0.01"),
    });
    await expect(
      arena.connect(voter).vote(1, true, 1, {
        value: ethers.parseEther("0.01"),
      }),
    ).to.be.revertedWithCustomError(arena, "AlreadyVoted");
  });
});
