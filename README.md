
<img width="161" height="87" alt="image" src="https://github.com/user-attachments/assets/70d1ce77-641c-445b-911d-971a8908593d" />


Quid is a feedback marketplace built on the Stellar blockchain that connects founders who need honest dApp feedback with users who provide valuable insights for USDC rewards.

## The Problem
Building in Web3 is hard. Getting early, high-quality feedback is even harder.
- **Founders** struggle to find real users to test their dApps.
- **Users** have no incentive to provide detailed, constructive criticism.
- **Feedback** is often lost in Discord channels or is spam from bots.

## The Solution
Quid creates a trustless **"Bounty Vault"** for feedback.
1. **Founders** create a Mission and lock funds (USDC/XLM) in a smart contract.
2. **Hunters** submit proof of work (screenshots/feedback) via IPFS.
3. **Smart Contracts** handle the payout only when feedback is approved.

##  Core Features

### 1. The Bounty Vault
Funds are escrowed on-chain the moment a mission is created. Users can see the balance in the smart contract, guaranteeing that the money exists before they start working.

### 2. Hybrid Storage (Proof-of-Feedback)
We utilize a gas-efficient architecture. Large data (feedback text, screenshots, recordings) is pinned to IPFS, while only the cryptographic hash (CID) is stored on the Stellar ledger.

### 3. Asset Gating (Anti-Spam)
Founders can filter for quality by requiring hunters to hold specific assets.
* *Example:* "Only users holding > 500 AQUA can join this mission."
* *Example:* "Must hold the 'Early Adopter' NFT."

### 4. Reputation Engine
Quid tracks a user's history on-chain. Every approved submission increments a user's "Successful Missions" counter, building a verifiable resume of high-quality contributions.

---
The platform is split into two main experiences, depending on your role.

### 1. For Founders (Getting Feedback)

As a Founder, you need to understand if your dApp is hitting the mark. Quid helps you do that efficiently.

-   **Create a Mission:** Easily create a new feedback campaign (a "Mission") by filling out a simple form and more to come 🥂:
    -   **Title:** A clear name for your feedback request.
    -   **dApp URL:** The link to the project you want feedback on.
    -   **Reward per user:** How much USDC you'll pay each user for their feedback.
    -   **Max Participants:** The maximum number of users you need.
-   **Track Your Missions:** The Founder Dashboard displays all your active missions, showing how many responses you've received out of the total you requested.


### 2. For Users (Giving Feedback)

As a User, you can leverage your experience with dApps to earn rewards.

-   **The Mission Board:** This is where you find all available feedback opportunities.
-   **Browse and Start Missions:** View a grid of available missions, see the reward for each, and simply click "Start Mission" to begin.
-   **Submit Feedback:** On the mission detail page, you get:
    -   Clear instructions from the Founder.
    -   A text area to write down your thoughts.
    -   An uploader for screenshots or recordings as proof.
-   **Get Paid:** Once you submit, your feedback is sent to the Founder, and you're in line to receive your USDC reward.


### 3. Wallet Connection

-   **Connect Your Wallet:** The application uses a "Connect Wallet" button, simulating a connection to a Stellar wallet like Freighter.
-   **Identity:** Once connected, your wallet address (e.g., `G...ABCD`) is shown, acting as your identity on the platform.

## Tech Stack

-   **Framework:** React with TypeScript for a robust and scalable frontend.
-   **Styling:** Tailwind CSS for a utility-first, clean, and responsive design. The components will use `Shadcn/UI` library.
-   **Icons:** `Lucide-React` icons.
-   **Blockchain:** Stellar + Soroban (Smart Contracts).
-   **Identity:** Freighter Wallet + On-chain transaction history.
-   **Payments:** USDC (Stellar Assets).

## How to Start
1. Connect your Stellar wallet.
2. If you are a founder, deposit a bounty and post a mission.
3. If you are a user, pick a mission and share your thoughts.
4. Get paid.
