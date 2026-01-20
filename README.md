# Quid

Quid is a feedback marketplace built on the Stellar blockchain that connects founders who need honest dApp feedback with users who provide valuable insights for USDC rewards.

## The Problem
- Building on Stellar is fast, but getting real feedback is slow.
- Getting early, high-quality feedback is incredibly difficult.

## The Solution
- Quid is a bridge between the builder and the person using the app.
- It turns feedback into a professional service.
- It uses the Stellar ledger to prove a user is a real human, not a script.

## Core Features Of the MVP

The platform is split into two main experiences, depending on your role.

### 1. For Founders (Getting Feedback)

As a Founder, you need to understand if your dApp is hitting the mark. Quid helps you do that efficiently.

-   **Create a Mission:** Easily create a new feedback campaign (a "Mission") by filling out a simple form:
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
