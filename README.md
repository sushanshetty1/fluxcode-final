<div align="center">
  <img src="public/favicon.svg" alt="FluxCode" width="100" />
  
  # FluxCode
  **Master DSA through long-term competitive contests**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
  [![tRPC](https://img.shields.io/badge/tRPC-11.0-2596be?logo=trpc)](https://trpc.io)
  [![Prisma](https://img.shields.io/badge/Prisma-7.3-2D3748?logo=prisma)](https://prisma.io)
</div>
---

## ✨ Features

- 🏆 **Long-term Contests** — Join month-long coding challenges with structured curricula
- ⚡ **LeetCode Integration** — Automatic verification of problem submissions
- 📊 **Live Leaderboards** — Real-time rankings with streak tracking
- 🎯 **Weekend Tests** — Performance checkpoints with penalty system
- 🔥 **Streak System** — Daily coding habit tracking with midnight delimiter
- 💳 **Payment Integration** — Razorpay-powered contest entry and penalties
- 🎨 **Modern UI** — Beautiful interface with Framer Motion animations

## � How It Works

1. **Sign Up & Join** — Create account, link LeetCode username, and join a contest
2. **Daily Practice** — Solve assigned daily problems (Easy/Medium/Hard) to maintain your streak
3. **Weekend Tests** — Complete 3 problems every Saturday-Sunday before midnight IST
4. **Auto Verification** — Submit on LeetCode, we verify and update your progress automatically
5. **Pay or Progress** — Miss weekend tests? Pay penalty. Complete everything? Stay in the game!
6. **Compete & Win** — Climb the leaderboard with points from materials, homework, and weekend tests

## �🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start database
./start-database.sh

# Run migrations
npm run db:generate

# Start dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework** — Next.js 15 with App Router
- **Language** — TypeScript
- **API** — tRPC for type-safe endpoints
- **Database** — PostgreSQL with Prisma ORM
- **Auth** — Supabase Authentication
- **Payments** — Razorpay
- **UI** — Tailwind CSS, Framer Motion, Lucide Icons
- **Real-time** — Pusher

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AUTH_SECRET=

# Database
DATABASE_URL=

# OpenAI
OPENAI_API_KEY=

# Pusher (Real-time updates)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Razorpay (Payments)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# SMTP (Email notifications)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# Cron (Scheduled tasks)
CRON_SECRET=
```

## 📜 License

MIT License - see [LICENSE](LICENSE)

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/ashtonmths">
        <img src="https://github.com/ashtonmths.png" width="100px;" alt="subtilizer28"/>
        <br />
        <sub><b>Ashton Mathias</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/sushanshetty1">
        <img src="https://github.com/sushanshetty1.png" width="100px;" alt="sushanshetty1"/>
        <br />
        <sub><b>Sushan Shetty</b></sub>
      </a>
    </td>
  </tr>
</table>

---

<div align="center">
  Built with 💜 by the FluxCode team
</div>
