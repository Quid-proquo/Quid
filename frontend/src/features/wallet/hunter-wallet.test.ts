import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWalletOverview,
  explorerTxUrl,
  normalizeClaimables,
  sortClaimablesByUsd,
  toHistoryItems,
} from "./hunter-wallet";

describe("hunter wallet helpers", () => {
  it("normalizes and sorts claimables by USD value", () => {
    const claimables = normalizeClaimables([
      {
        submissionId: "small",
        missionTitle: "Small mission",
        amount: "5",
        asset: "XLM",
        approvedAt: "2026-11-01T00:00:00Z",
      },
      {
        submissionId: "large",
        missionTitle: "Large mission",
        amount: "12",
        asset: "USDC",
        approvedAt: "2026-11-02T00:00:00Z",
      },
      { submissionId: "broken" },
    ]);

    assert.equal(claimables.length, 2);
    assert.deepEqual(
      sortClaimablesByUsd(claimables).map((item) => item.submissionId),
      ["large", "small"],
    );
  });

  it("combines wallet and claimable value", () => {
    const overview = buildWalletOverview(
      [
        {
          assetType: "native",
          assetCode: "XLM",
          balance: "100",
        },
        {
          assetType: "credit_alphanum4",
          assetCode: "USDC",
          balance: "3",
        },
      ],
      [
        {
          submissionId: "claim-1",
          missionTitle: "Mission",
          amount: "4",
          asset: "USDC",
          approvedAt: "2026-11-01T00:00:00Z",
          usdValue: 4,
        },
      ],
    );

    assert.equal(overview.walletUsd, 13);
    assert.equal(overview.claimableUsd, 4);
    assert.equal(overview.totalUsd, 17);
    assert.equal(overview.xlm, "100");
    assert.equal(overview.usdc, "3");
  });

  it("builds explorer links for payment history", () => {
    const items = toHistoryItems([
      {
        id: "payment-1",
        hash: "tx-hash",
        type: "payment",
        direction: "in",
        counterparty: "GSENDER1234567890",
        amount: "2.5",
        assetCode: "XLM",
        date: "2026-11-01T00:00:00Z",
        successful: true,
      },
    ]);

    assert.equal(
      items[0].href,
      `${process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL ?? "https://stellar.expert/explorer/testnet"}/tx/tx-hash`,
    );
    assert.equal(explorerTxUrl(""), null);
  });
});
