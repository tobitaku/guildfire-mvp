import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GuildPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GuildPage({ params }: GuildPageProps) {
  const { slug } = await params;
  const guild = await prisma.guild.findUnique({
    where: { slug },
    include: {
      channels: {
        orderBy: [{ position: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!guild) {
    return (
      <main className="min-h-screen bg-[#14151f] text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md border-border/60 bg-[#202233]/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Guild not found</CardTitle>
              <CardDescription>The requested community could not be located.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#14151f] text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <Card className="border-border/60 bg-[#202233]/90 backdrop-blur">
          <CardHeader>
            <CardTitle>{guild.name}</CardTitle>
            <CardDescription>Channels overview</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {guild.channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No channels yet.</p>
            ) : (
              guild.channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/channels/${channel.id}`}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-[#1b1d2b] px-4 py-3 text-sm text-foreground transition hover:bg-[#232539]"
                >
                  <span className="font-medium">#{channel.name}</span>
                  <span className="text-xs text-muted-foreground">View threads</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
