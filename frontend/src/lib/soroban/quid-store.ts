/**
 * Issue #317 — typed Soroban client for the `quid-store` contract.
 *
 * Single source of truth for invoking and reading the mission vault so pages
 * never duplicate invoke logic. Every mutating call simulates first, signs
 * with Freighter, submits via Soroban RPC, and waits for final inclusion.
 * Contract errors are surfaced to callers as {@link QuidStoreError} with the
 * human-readable text from `@/lib/errorMap`.
 *
 * Required env: NEXT_PUBLIC_QUID_STORE_ID
 */

import {
  Account,
  Address,
  Contract,
  Horizon,
  nativeToScVal,
  Networks,
  rpc,
  StellarAssetContract,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { signFreighterTransaction, NETWORK_PASSPHRASE } from "@/lib/freighter-wallet";
import { parseQuidError } from "@/lib/errorMap";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";

/** `quid-store` contract id, e.g. CA... from `stellar contract deploy`. */
export const QUID_STORE_ID = process.env.NEXT_PUBLIC_QUID_STORE_ID || "";

export function isQuidStoreConfigured(): boolean {
  return QUID_STORE_ID.length > 0 && QUID_STORE_ID.startsWith("C");
}

/** Native XLM wrapper contract on testnet. */
export const NATIVE_TOKEN_ID =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/** 7 decimals for XLM and most Stellar assets. */
export const STELLAR_DECIMALS = 7;

/** Maps a decimal amount (e.g. 12.5 XLM) to the integer stroop value (i128). */
export function toStroops(amount: number): bigint {
  const stroops = amount * 10 ** STELLAR_DECIMALS;
  if (!Number.isFinite(stroops) || stroops < 0) {
    throw new Error(`Invalid token amount: ${amount}`);
  }
  return BigInt(Math.round(stroops));
}

/**
 * On-chain mission status enum — mirrors
 * `quid-contract/contracts/quid-store/src/types.rs::MissionStatus`.
 */
export type MissionStatusOnChain =
  | "created"
  | "open"
  | "started"
  | "paused"
  | "completed"
  | "cancelled";

/** On-chain submission status enum — mirrors `SubmissionStatus` in the contract. */
export type SubmissionStatusOnChain = "pending" | "approved" | "paid" | "rejected";

/** Mirrors the contract's `Reward` struct. */
export interface Reward {
  rewardToken: string;
  rewardAmount: bigint;
}

/** Mirrors the contract's `MinAsset` struct (optional hunter balance gate). */
export interface MinAsset {
  minAssetToken?: string | null;
  minAssetAmount: bigint;
}

/** Mirrors the contract's `Mission` struct. */
export interface MissionOnChain {
  id: bigint;
  owner: string;
  title: string;
  descriptionCid: string;
  rewardToken: string;
  rewardAmount: bigint;
  maxParticipants: number;
  participantsCount: number;
  status: MissionStatusOnChain;
  createdAt: bigint;
  minAsset: string | null;
  minAssetAmount: bigint;
}

export interface CreateMissionParams {
  /** Creator's Stellar address (G...) — must match the connected Freighter account. */
  owner: string;
  title: string;
  /** IPFS CID of the mission description / metadata JSON. */
  descriptionCid: string;
  reward: Reward;
  maxParticipants: number;
  minAsset: MinAsset;
}

export interface InvokeReceipt {
  txHash: string;
  success: boolean;
}

export class QuidStoreError extends Error {
  readonly detail: string;
  readonly retryable: boolean;

  constructor(detail: string) {
    const friendly = parseQuidError(detail);
    super(friendly.title);
    this.name = "QuidStoreError";
    this.detail = friendly.description;
    this.retryable = friendly.retryable;
  }
}

// ─── SCVal helpers ───────────────────────────────────────────────────────────

function scValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

/** Unit-variant Rust enum, e.g. `MissionStatus::Open` → `["Open", void]`. */
function scValEnumVariant(name: string): xdr.ScVal {
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(name), xdr.ScVal.scvVoid()]);
}

export function missionStatusToScVal(status: MissionStatusOnChain): xdr.ScVal {
  return scValEnumVariant(status);
}

function enumNameFromScVal(val: xdr.ScVal): string {
  if (val.switch().name !== "scvVec") return "created";
  const variants = val.value() as xdr.ScVal[];
  return variants.length > 0 ? String(variants[0].value()) : "created";
}

function bigIntFromScVal(val?: xdr.ScVal): bigint {
  if (!val) return BigInt(0);
  const raw = val.value();
  if (raw === null || raw === undefined) return BigInt(0);
  if (typeof raw === "bigint") return raw;
  if (typeof raw === "number") return BigInt(Math.trunc(raw));
  if (typeof raw === "string") return BigInt(raw || "0");
  // i128/u128 wrap Buffer-like words; toString covers both across sdk versions.
  return BigInt(String(raw));
}

function addressFromScVal(val?: xdr.ScVal): string {
  if (!val || val.switch().name !== "scvAddress") return "";
  return Address.fromScVal(val).toString();
}

function stringFromScVal(val?: xdr.ScVal): string {
  if (!val || typeof val.value() !== "string") return "";
  return val.value() as string;
}

export function missionFromScVal(val: xdr.ScVal): MissionOnChain {
  const map = val.value() as xdr.ScMapEntry[];
  const field = (name: string): xdr.ScVal | undefined =>
    map.find((entry) => String(entry.key().value()) === name)?.val();

  const minAssetVal = field("min_asset");
  const minAsset =
    minAssetVal && minAssetVal.switch().name === "scvAddress"
      ? Address.fromScVal(minAssetVal).toString()
      : null;

  return {
    id: bigIntFromScVal(field("id")),
    owner: addressFromScVal(field("owner")),
    title: stringFromScVal(field("title")),
    descriptionCid: stringFromScVal(field("description_cid")),
    rewardToken: addressFromScVal(field("reward_token")),
    rewardAmount: bigIntFromScVal(field("reward_amount")),
    maxParticipants: Number(bigIntFromScVal(field("max_participants"))),
    participantsCount: Number(bigIntFromScVal(field("participants_count"))),
    status: enumNameFromScVal(field("status") ?? xdr.ScVal.scvVoid()) as MissionStatusOnChain,
    createdAt: bigIntFromScVal(field("created_at")),
    minAsset,
    minAssetAmount: bigIntFromScVal(field("min_asset_amount")),
  };
}

function u64FromScVal(val: xdr.ScVal): bigint {
  return bigIntFromScVal(val);
}

// ─── Shared invoke plumbing ──────────────────────────────────────────────────

const READ_ONLY_SOURCE =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

interface InvokeOutcome extends InvokeReceipt {
  /** Return value observed during simulation (pre-signature dry run). */
  simRetval?: xdr.ScVal;
}

function describeSimulationError(fnName: string, sim: rpc.Api.SimulateTransactionResponse): string {
  if (rpc.Api.isSimulationError(sim)) {
    return `${fnName} simulation failed: ${sim.error}`;
  }
  const events = sim.events?.length ?? 0;
  return `${fnName} simulation failed: ${JSON.stringify(sim).slice(0, 400)} (events: ${events})`;
}

async function invokeContract(
  fnName: string,
  args: xdr.ScVal[],
  sourceAddress: string,
): Promise<InvokeOutcome> {
  if (!isQuidStoreConfigured()) {
    throw new QuidStoreError(
      "NEXT_PUBLIC_QUID_STORE_ID is not set to a deployed quid-store contract id",
    );
  }
  if (!sourceAddress) {
    throw new QuidStoreError("A connected wallet address is required to sign");
  }

  const rpcServer = new rpc.Server(RPC_URL);
  const horizonServer = new Horizon.Server(HORIZON_URL);
  const contract = new Contract(QUID_STORE_ID);

  const account = await horizonServer.loadAccount(sourceAddress);
  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(180)
    .build();

  // 1. Dry-run to attach footprints / authorize entries.
  const sim = await rpcServer.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new QuidStoreError(describeSimulationError(fnName, sim));
  }
  const simRetval = sim.result?.retval;

  // 2. Assemble (applies Soroban transaction data + auth entries).
  const assembled = rpc.assembleTransaction(tx, sim).build();

  // 3. Sign with Freighter.
  const signedXdr = await signFreighterTransaction(
    assembled.toXDR(),
    sourceAddress,
    NETWORK_PASSPHRASE as Networks,
  );
  const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // 4. Submit and wait for inclusion.
  const sendRes = await rpcServer.sendTransaction(
    signed as unknown as Parameters<typeof rpcServer.sendTransaction>[0],
  );
  if (sendRes.status === "ERROR") {
    throw new QuidStoreError(
      `${fnName} failed: ${JSON.stringify(sendRes.errorResult)}`,
    );
  }

  let status = await rpcServer.getTransaction(sendRes.hash);
  let attempts = 0;
  while (status.status === "NOT_FOUND" && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1_000));
    status = await rpcServer.getTransaction(sendRes.hash);
    attempts++;
  }

  if (status.status === "FAILED") {
    const err = status.resultXdr ? status.resultXdr.toString() : "unknown error";
    throw new QuidStoreError(`${fnName} reverted: ${err}`);
  }

  return { txHash: sendRes.hash, success: status.status === "SUCCESS", simRetval };
}

async function readContract<T>(
  fnName: string,
  args: xdr.ScVal[],
  decode: (val: xdr.ScVal) => T,
): Promise<T> {
  if (!isQuidStoreConfigured()) {
    throw new QuidStoreError(
      "NEXT_PUBLIC_QUID_STORE_ID is not set to a deployed quid-store contract id",
    );
  }

  const rpcServer = new rpc.Server(RPC_URL);
  const contract = new Contract(QUID_STORE_ID);

  const tx = new TransactionBuilder(new Account(READ_ONLY_SOURCE, "0"), {
    fee: "0",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(fnName, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new QuidStoreError(describeSimulationError(fnName, sim));
  }
  if (!sim.result?.retval) {
    throw new QuidStoreError(`${fnName} returned no value`);
  }

  return decode(sim.result.retval);
}

// ─── Write calls ─────────────────────────────────────────────────────────────

/**
 * Invokes `create_mission`: escrows `reward.rewardAmount * maxParticipants`
 * of `reward.rewardToken` into the vault (plus protocol fee when configured)
 * and returns the on-chain mission id.
 *
 * The owner's token `transfer` is authorized inside the contract call itself
 * (`owner.require_auth()` on the create frame covers it), so a single Freighter
 * signature is enough — no separate approve transaction is required.
 */
export async function createMission(
  params: CreateMissionParams,
): Promise<InvokeReceipt & { missionId: bigint }> {
  const { owner, title, descriptionCid, reward, maxParticipants, minAsset } = params;

  if (!owner) throw new Error("Creator address is required");
  if (!title.trim()) throw new Error("Mission title is required");
  if (!descriptionCid) throw new Error("Mission description CID is required");
  if (reward.rewardAmount <= BigInt(0)) {
    throw new Error("Reward amount must be greater than zero");
  }
  if (maxParticipants <= 0) {
    throw new Error("Max participants must be greater than zero");
  }
  if (minAsset.minAssetToken && minAsset.minAssetAmount <= BigInt(0)) {
    throw new Error(
      "Minimum asset amount must be greater than zero when a gate token is set",
    );
  }

  const outcome = await invokeContract(
    "create_mission",
    [
      scValAddress(owner),
      nativeToScVal(title, { type: "string" }),
      nativeToScVal(descriptionCid, { type: "string" }),
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("reward_token"),
          val: scValAddress(reward.rewardToken),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("reward_amount"),
          val: nativeToScVal(reward.rewardAmount, { type: "i128" }),
        }),
      ]),
      nativeToScVal(maxParticipants, { type: "u32" }),
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("min_asset_token"),
          val: minAsset.minAssetToken
            ? scValAddress(minAsset.minAssetToken)
            : xdr.ScVal.scvVoid(),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("min_asset_amount"),
          val: nativeToScVal(minAsset.minAssetAmount, { type: "i128" }),
        }),
      ]),
    ],
    owner,
  );

  // create_mission returns the new u64 mission id — decode from the dry run.
  const missionId = outcome.simRetval ? u64FromScVal(outcome.simRetval) : BigInt(0);
  return { txHash: outcome.txHash, success: outcome.success, missionId };
}

export interface SubmitFeedbackParams {
  missionId: number | bigint;
  hunterAddress: string;
  ipfsCid: string;
  stakeTokenAddress: string;
  stakeAmount: bigint;
}

/** Invokes `submit_feedback` — hunter stake + IPFS CID. */
export async function submitFeedback(
  params: SubmitFeedbackParams,
): Promise<InvokeReceipt> {
  const { missionId, hunterAddress, ipfsCid, stakeTokenAddress, stakeAmount } = params;
  if (!ipfsCid) throw new Error("Cannot submit feedback without a valid IPFS CID");
  if (!hunterAddress) throw new Error("Hunter address is required");

  const outcome = await invokeContract(
    "submit_feedback",
    [
      nativeToScVal(BigInt(missionId), { type: "u64" }),
      scValAddress(hunterAddress),
      nativeToScVal(ipfsCid, { type: "string" }),
      scValAddress(stakeTokenAddress),
      nativeToScVal(stakeAmount, { type: "i128" }),
    ],
    hunterAddress,
  );
  return { txHash: outcome.txHash, success: outcome.success };
}

/** Invokes `payout_participant` — mission owner pays a hunter and refunds stake. */
export async function payoutParticipant(
  missionId: number | bigint,
  ownerAddress: string,
  hunterAddress: string,
): Promise<InvokeReceipt> {
  const outcome = await invokeContract(
    "payout_participant",
    [
      nativeToScVal(BigInt(missionId), { type: "u64" }),
      scValAddress(hunterAddress),
    ],
    ownerAddress,
  );
  return { txHash: outcome.txHash, success: outcome.success };
}

/** Invokes `cancel_mission` — refunds unclaimed escrow to the owner. */
export async function cancelMission(
  missionId: number | bigint,
  ownerAddress: string,
): Promise<InvokeReceipt> {
  const outcome = await invokeContract(
    "cancel_mission",
    [nativeToScVal(BigInt(missionId), { type: "u64" })],
    ownerAddress,
  );
  return { txHash: outcome.txHash, success: outcome.success };
}

/** Invokes `pause_mission`. */
export async function pauseMission(
  missionId: number | bigint,
  ownerAddress: string,
): Promise<InvokeReceipt> {
  const outcome = await invokeContract(
    "pause_mission",
    [nativeToScVal(BigInt(missionId), { type: "u64" })],
    ownerAddress,
  );
  return { txHash: outcome.txHash, success: outcome.success };
}

// ─── Read calls ──────────────────────────────────────────────────────────────

/** Reads a single mission from the vault. */
export async function getMission(missionId: number | bigint): Promise<MissionOnChain> {
  return readContract(
    "get_mission",
    [nativeToScVal(BigInt(missionId), { type: "u64" })],
    missionFromScVal,
  );
}

/** Reads the total number of missions created in the store. */
export async function getMissionCount(): Promise<bigint> {
  return readContract("get_mission_count", [], u64FromScVal);
}

/** Checks whether a mission id exists on-chain. */
export async function missionExists(missionId: number | bigint): Promise<boolean> {
  return readContract(
    "mission_exists",
    [nativeToScVal(BigInt(missionId), { type: "u64" })],
    (val) => val.switch().name === "scvBool" && val.value() === true,
  );
}

/** Returns the account's spendable balance of `tokenAddress` in stroops. */
export async function getTokenBalance(
  tokenAddress: string,
  accountAddress: string,
): Promise<bigint> {
  const rpcServer = new rpc.Server(RPC_URL);

  const tx = new TransactionBuilder(new Account(accountAddress || READ_ONLY_SOURCE, "0"), {
    fee: "0",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(tokenAddress).call("balance", scValAddress(accountAddress)))
    .setTimeout(30)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim) || !sim.result?.retval) {
    return BigInt(0);
  }
  return bigIntFromScVal(sim.result.retval);
}

/**
 * Pre-flight check that the creator can actually fund the escrow. Surfaces a
 * readable error before any wallet signature is requested.
 */
export async function ensureSufficientFunds(
  tokenAddress: string,
  ownerAddress: string,
  requiredAmount: bigint,
): Promise<void> {
  const balance = await getTokenBalance(tokenAddress, ownerAddress);
  if (balance < requiredAmount) {
    const shortBy = requiredAmount - balance;
    throw new QuidStoreError(
      `Insufficient funds: wallet holds ${balance} stroops but the escrow needs ` +
        `${requiredAmount} (short by ${shortBy}).`,
    );
  }
}

/**
 * Ensures a trustline exists when the reward token is a token-asset contract
 * (SAC); no-op for the native wrapper. Returns false when the trustline is
 * missing so the UI can prompt the creator before attempting escrow.
 */
export async function hasTrustline(
  tokenAddress: string,
  accountAddress: string,
): Promise<boolean> {
  if (tokenAddress === NATIVE_TOKEN_ID) return true;

  try {
    const asset = new StellarAssetContract(tokenAddress).assetId();
    const horizonServer = new Horizon.Server(HORIZON_URL);
    const account = await horizonServer.loadAccount(accountAddress);
    return account.balances.some(
      (b) =>
        (b as { asset_code?: string }).asset_code === asset.getCode() &&
        (b as { asset_issuer?: string }).asset_issuer === asset.getIssuer(),
    );
  } catch {
    // Not an SAC id (e.g. a custom token contract) or lookup failed — skip gating.
    return true;
  }
}
