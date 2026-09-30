/**
 * Issue #318 — creator mission escrow flow.
 *
 * Bridges the quest wizard to the on-chain flow:
 *   1. validate the wizard form data
 *   2. verify the reward-token balance / trustline (readable errors, no signature)
 *   3. upload quest metadata to IPFS for a description CID
 *   4. invoke `create_mission` on `quid-store` (single Freighter signature;
 *      the owner transfer is authorized on the contract frame itself)
 *   5. hand back the on-chain mission id for the success screen
 */

import { creatorApiFetch } from "@/lib/creator-api";
import {
  createMission,
  ensureSufficientFunds,
  hasTrustline,
  isQuidStoreConfigured,
  NATIVE_TOKEN_ID,
  QuidStoreError,
  toStroops,
} from "@/lib/soroban/quid-store";
import type { QuestWizardData } from "@/components/creator/quests/wizard/types";

export interface MissionEscrowResult {
  /** On-chain mission id (u64) returned by `create_mission`. */
  missionId: string;
  /** Stellar transaction hash of the create_mission invocation. */
  txHash: string;
  /** IPFS CID of the quest metadata uploaded before escrow. */
  metadataCid: string;
}

export class MissionEscrowError extends Error {
  /** Extra, longer explanation suitable for a modal body. */
  readonly detail: string;
  readonly retryable: boolean;

  constructor(message: string, detail = "", retryable = false) {
    super(message);
    this.name = "MissionEscrowError";
    this.detail = detail;
    this.retryable = retryable;
  }
}

/**
 * Validates the wizard payload before anything touches the wallet or chain.
 * Returns a readable error string, or null when the data is publishable.
 */
export function validateWizardForPublish(data: QuestWizardData): string | null {
  if (!data.basics.title.trim()) return "Give your quest a title before publishing.";
  if (!data.basics.description.trim()) {
    return "Add a short description so hunters know what to test.";
  }
  if (data.rewards.totalRewardBudget <= 0) {
    return "Set a reward budget greater than zero.";
  }
  if (data.rewards.numberOfWinners <= 0) {
    return "Set at least one winner slot.";
  }
  if (data.basics.participantLimit <= 0) {
    return "Set a participant limit greater than zero.";
  }
  return null;
}

/** Total stroops that must be escrowed (reward pool) — protocol fee, when the
 *  store has a fee collector configured, is charged on top by the contract. */
export function escrowAmountStroops(data: QuestWizardData): bigint {
  return toStroops(data.rewards.totalRewardBudget);
}

function userMessage(error: unknown): MissionEscrowError {
  if (error instanceof QuidStoreError) {
    return new MissionEscrowError(error.message, error.detail, error.retryable);
  }
  if (error instanceof Error) {
    return new MissionEscrowError(error.message);
  }
  return new MissionEscrowError("Publishing the quest on-chain failed.");
}

/** Uploads the structured quest metadata and returns the pinned CID. */
async function uploadQuestMetadata(
  data: QuestWizardData,
  creatorAddress: string,
): Promise<string> {
  const payload = {
    kind: "quid.mission.metadata",
    version: 1,
    title: data.basics.title,
    description: data.basics.description,
    questType: data.basics.questType,
    completionDuration: data.basics.completionDuration,
    participantLimit: data.basics.participantLimit,
    visibility: data.basics.visibility,
    eligibility: data.eligibility,
    tasks: data.tasks,
    rewards: {
      method: data.rewards.rewardMethod,
      pool: data.rewards.totalRewardBudget,
      winners: data.rewards.numberOfWinners,
    },
    schedule: data.schedule,
    creator: creatorAddress,
  };

  const response = await creatorApiFetch("/upload/json", creatorAddress, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new MissionEscrowError(
      `Metadata upload failed (status ${response.status}). The quest was not published on-chain.`,
    );
  }

  const body = (await response.json()) as { cid?: string };
  if (!body.cid) {
    throw new MissionEscrowError(
      "Metadata upload did not return a CID. The quest was not published on-chain.",
    );
  }
  return body.cid;
}

/**
 * Runs the full creator escrow flow. Throws {@link MissionEscrowError} with
 * user-readable copy on any failure; the wallet is only prompted once all
 * pre-flight checks pass.
 */
export async function publishMissionOnChain(
  data: QuestWizardData,
  creatorAddress: string,
): Promise<MissionEscrowResult> {
  // 1. Validate the form.
  const validationError = validateWizardForPublish(data);
  if (validationError) {
    throw new MissionEscrowError(validationError);
  }

  if (!creatorAddress) {
    throw new MissionEscrowError("Connect your wallet to publish this quest.");
  }
  if (!isQuidStoreConfigured()) {
    throw new MissionEscrowError(
      "Mission escrow is not configured yet (missing NEXT_PUBLIC_QUID_STORE_ID).",
      "Ask the team to deploy quid-store and set the contract id in the frontend environment.",
    );
  }

  // 2. Pre-flight balance / trustline checks — no signature requested yet.
  const rewardToken = process.env.NEXT_PUBLIC_REWARD_TOKEN_ID || NATIVE_TOKEN_ID;
  const required = escrowAmountStroops(data);

  try {
    await ensureSufficientFunds(rewardToken, creatorAddress, required);
    if (!(await hasTrustline(rewardToken, creatorAddress))) {
      throw new MissionEscrowError(
        "Your wallet needs a trustline for the reward token before you can fund this quest.",
        "Add the asset in Freighter, then try publishing again.",
      );
    }
  } catch (error: unknown) {
    throw userMessage(error);
  }

  // 3. Pin quest metadata to IPFS.
  let metadataCid: string;
  try {
    metadataCid = await uploadQuestMetadata(data, creatorAddress);
  } catch (error: unknown) {
    throw userMessage(error);
  }

  // 4. Escrow rewards + create the mission on-chain.
  try {
    const receipt = await createMission({
      owner: creatorAddress,
      title: data.basics.title.trim(),
      descriptionCid: metadataCid,
      reward: {
        rewardToken,
        rewardAmount: toStroops(
          data.rewards.totalRewardBudget / data.rewards.numberOfWinners,
        ),
      },
      maxParticipants: data.basics.participantLimit,
      minAsset: { minAssetToken: null, minAssetAmount: BigInt(0) },
    });

    if (receipt.missionId <= BigInt(0)) {
      throw new MissionEscrowError(
        "The contract did not return a mission id. Check the transaction in your wallet explorer.",
      );
    }

    // 5. Success.
    return {
      missionId: receipt.missionId.toString(),
      txHash: receipt.txHash,
      metadataCid,
    };
  } catch (error: unknown) {
    throw userMessage(error);
  }
}
