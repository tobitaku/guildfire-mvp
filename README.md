This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

- Node.js `>=20.19` (required by Next.js + Prisma)
- Docker (for local Postgres)
- A Discord OAuth app (for login)

## Setup (Local)

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL`
- `NEXTAUTH_URL` (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`)
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`

3. Configure Discord OAuth redirect URL:

```
http://localhost:3000/api/auth/callback/discord
```

4. Start Postgres:

```bash
docker compose up -d
```

5. Generate Prisma client and push schema:

```bash
npm run db:generate
npm run db:push
```

6. Seed optional demo data:

```bash
npm run db:seed
```

7. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
