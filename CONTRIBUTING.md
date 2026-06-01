# Contributing to Quid 🦑

Welcome to the Quid codebase!

We are thrilled that you're interested in contributing. Quid isn't just another dApp; it is a critical piece of infrastructure for the Stellar ecosystem. We are solving the "Ghost Town" problem in Web3 product development by creating a liquid marketplace for honest feedback.

Whether you're a Rustacean, a React wizard, or a design pro, there is a place for you here.

## 🚀 The Pitch: Why Build Quid?

### The Problem

Building on-chain is lonely. Founders launch dApps to empty Discord channels. When they do get feedback, it's often low-effort spam from airdrop farmers ("Good project sir!").

- **No Incentive**: Real users have no reason to spend 20 minutes testing your edge cases.
- **No Trust**: Founders can't verify if a user actually used the protocol or just looked at the landing page.

### The Quid Solution

Quid is "Feedback-as-a-Service" (FaaS). We turn feedback into a transaction.

- **For Founders**: It's a Bounty Vault. You lock funds, and you only pay for feedback that actually helps you.
- **For Users**: It's a Job Board. You get paid instantly in USDC/XLM for your time and expertise.

**The "Secret Sauce"**: We use on-chain data (Transaction History, Asset Holdings) to verify that the feedback comes from a real, active human—not a bot.

## ✨ Core Features (Expanded)

These are the pillars of the platform. When you pick up an issue, you are likely building a part of one of these systems.

### 1. The Bounty Vault (Smart Contract)

At the heart of Quid is the QuidStore contract. It replaces the need for "trust."

- **Escrow Logic**: When a Founder creates a Mission, the reward pool (e.g., 500 USDC) is pulled from their wallet and locked in the contract. Users know the money is there.
- **Refund Mechanism**: If a mission expires or is canceled, the contract automatically calculates the remaining funds and refunds the Founder. We never hold user funds hostage.

### 2. Proof-of-Feedback (Hybrid Storage)

We don't clutter the Stellar ledger with paragraphs of text. We use a hybrid approach:

- **Off-Chain (IPFS)**: The actual feedback (long text, screenshots, screen recordings) is hashed and pinned to IPFS.
- **On-Chain (Soroban)**: Only the CID (Content Identifier) is stored in the smart contract. This keeps gas costs low while maintaining data immutability.

### 3. Asset Gating (The Quality Filter)

This is our anti-spam defense. Founders can set requirements for who can enter a mission.

- **Token Gating**: "You must hold at least 50 AQUA to join this mission."
- **NFT Gating**: "Only holders of the 'Early Adopter' NFT can provide feedback."

**Dev Note**: This checks the user's balance on-chain before allowing the `submit_feedback` transaction.

### 4. The Reputation Engine

We track a user's value on-chain.

- **Stats**: Every time a user's submission is "Approved" and paid out, their `successful_missions` counter increments.
- **Trust Score**: Future features will calculate a score based on `Earnings / Submissions`. High-reputation users will eventually get access to exclusive, high-paying missions.

## 🛠️ Development Setup

### 1. Prerequisites

- Rust (Latest Stable)
- Node.js (v18+)
- Soroban CLI
- Freighter Wallet

### 2. Setting up the Monorepo

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/quid.git
cd quid

# Install dependencies for frontend
cd web
npm install
```

### 3. Running the Smart Contracts

We use a Makefile to simplify Soroban commands.

```bash
cd contracts/quid-store

# Build the contract
make build

# Run unit tests (Please run this before pushing!)
make test
```

## 🤝 How to Contribute

### Finding an Issue

Navigate to the **Issues Tab**.

- **good first issue**: Perfect for newcomers. Usually UI tweaks or simple contract helpers.
- **help wanted**: A bit more complex, but we definitely need hands on deck.
- **priority**: Critical features for the MVP.

### The Workflow

1. **Assign Yourself**: Comment on the issue "I'd like to work on this!" so we don't duplicate work.
2. **Branch Out**: Create a branch using the convention: `type/short-description`.
   - `feat/create-mission-form`
   - `fix/wallet-connection`
   - `chore/update-readme`
3. **Commit**: Write clear commit messages.
4. **Pull Request**: Open a PR to `main`.
   - Link the issue (e.g., "Closes #4").
   - Include screenshots if you changed the UI.
   - Include test results if you changed the Contract.

## 📜 Coding Standards

### Rust (Smart Contracts)

- **Safety First**: Never use `.unwrap()` in production code. Always handle errors with `Result<T, E>`.
- **Gas Optimization**: Avoid large loops. Use Persistent storage for main data and Instance storage for counters.
- **Formatting**: Run `cargo fmt` before committing.

### React (Frontend)

- **Components**: Use functional components and Hooks.
- **Styling**: Use Tailwind CSS utility classes. Avoid inline styles.
- **Types**: strict TypeScript mode is on. No `any`!

## ⚖️ Code of Conduct

We are building a community of trust. Harassment, hate speech, or spamming will not be tolerated. Be kind, be constructive, and let's build something amazing together.

Ready to ship? Let's go! 🦑
