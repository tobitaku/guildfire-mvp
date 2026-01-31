import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthButton } from "@/components/auth/auth-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1b1c29] via-[#22243a] to-[#14151f] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center">
        <section className="flex flex-1 flex-col justify-center gap-6">
          <span className="w-fit rounded-full border border-border/50 bg-[#2b2d45] px-4 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Guildfire MVP
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            A focused hub for gaming groups and community discussions.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Organize conversations with channels and threads, and keep feedback lightweight with
            reactions.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="rounded-md bg-[#2a2c44] px-3 py-1">4 channels ready</span>
            <span className="rounded-md bg-[#2a2c44] px-3 py-1">Roles + reactions available</span>
          </div>
        </section>

        <Card className="w-full max-w-sm border-border/60 bg-[#202233]/90 backdrop-blur lg:self-center">
          <CardHeader>
            <CardTitle>{session?.user ? "You are signed in" : "Sign in"}</CardTitle>
            <CardDescription>
              {session?.user
                ? "Manage your sessions and account details."
                : "Authenticate with Discord to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
            {session?.user ? (
              <div className="rounded-lg border border-border/60 bg-[#1b1d2b] px-4 py-3 text-sm">
                <p className="text-muted-foreground">Signed in as</p>
                <p className="text-base font-semibold text-white">
                  {session.user.name ?? session.user.email ?? "Member"}
                </p>
                {session.user.username ? (
                  <p className="text-xs text-muted-foreground">username: {session.user.username}</p>
                ) : null}
              </div>
            ) : null}
            <div className="flex w-full flex-col gap-3">
              <AuthButton className="w-full" />
              <a
                href="/guilds/gaming-hub"
                className="rounded-md border border-border/60 bg-[#1b1d2b] px-4 py-2 text-center text-sm text-muted-foreground transition hover:bg-[#232539] hover:text-white"
              >
                Browse channels
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              The Discord provider requires credentials in your environment variables.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
