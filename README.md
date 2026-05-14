# PinHigh | Elite Golf Score Tracker

PinHigh is a precision performance tracking application designed for the modern golfer. It combines a high-end UI with authoritative data and cloud persistence.

## Features

- **Authoritative Data**: Integrated with Genkit to retrieve verified USGA Course Ratings and Slope data from national databases.
- **Precision Indexing**: Dynamic Handicap Index calculation based on your top recorded performances.
- **Cloud Persistence**: All rounds are securely synchronized and persisted via Firebase Firestore.
- **Secure Authentication**: Enterprise-grade sign-in with Google via Firebase Auth.
- **Elite Analytics**: Responsive charting for score trajectories and handicap differentials.
- **Glassmorphism UI**: Built with Next.js 15, ShadCN UI, and Tailwind CSS for a premium aesthetic.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google)
- **AI/GenAI**: Genkit with Google Gemini
- **Styling**: Tailwind CSS, Lucide Icons, ShadCN UI
- **Deployment**: Optimized for Cloudflare Pages

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file with your `GEMINI_API_KEY`.
3. Start the development server:
   ```bash
   npm run dev
   ```

### Firebase Setup

1. Enable **Google Authentication** in your Firebase Console.
2. Provision a **Cloud Firestore** database.
3. Update `src/firebase/config.ts` with your specific Firebase Project Configuration.

### Deployment

This project includes a `wrangler.toml` for seamless deployment to **Cloudflare Pages**. 
1. Push your changes to GitHub.
2. Connect the repository in the Cloudflare dashboard.
3. Set your environment variables (e.g., `GEMINI_API_KEY`).

---
*PinHigh - Precision at the Pin.*
