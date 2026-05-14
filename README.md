# PinHigh | Elite Golf Score Tracker

PinHigh is a precision performance tracking application designed for the modern golfer. It combines a high-end UI with authoritative data and cloud persistence.

## Features

- **Authoritative Data**: Integrated with AI (Genkit) to retrieve verified USGA Course Ratings and Slope data.
- **Precision Indexing**: Dynamic Handicap Index calculation based on your best recorded rounds.
- **Cloud Sync**: All rounds are persisted securely using Firebase Firestore.
- **Secure Auth**: Sign in with Google via Firebase Authentication.
- **Modern UI**: Built with Next.js 15, ShadCN UI, and Tailwind CSS for a glassmorphism aesthetic.
- **Cloudflare Ready**: Includes `wrangler.toml` for seamless deployment to Cloudflare Pages.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google)
- **AI/GenAI**: Genkit with Google Gemini
- **Styling**: Tailwind CSS, Lucide icons, ShadCN components
- **Deployment**: Cloudflare Pages

## Getting Started

### 1. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file with your `GEMINI_API_KEY`.
3. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Firebase Configuration

Ensure you have a Firebase project set up. Update `src/firebase/config.ts` with your project's configuration if needed. Enable Google Auth and Firestore in the Firebase Console.

### 3. Deployment to Cloudflare

This project is configured for Cloudflare Pages.
1. Push your code to GitHub.
2. Connect your GitHub repository to Cloudflare Pages.
3. Ensure you set the `GEMINI_API_KEY` as an environment variable in the Cloudflare dashboard.
