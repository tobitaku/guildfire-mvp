import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createCaller } from "@/lib/trpc/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ChannelPageProps = {
  params: Promise<{ channelId: string }>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const session = await getServerSession(authOptions);

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      guild: true,
      threads: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: true,
          _count: { select: { messages: true } },
        },
      },
    },
  });

  if (!channel) {
    return (
      <main className="min-h-screen bg-[#14151f] text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md border-border/60 bg-[#202233]/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Channel not found</CardTitle>
              <CardDescription>The requested channel does not exist.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  async function createThreadAction(formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;

    const caller = await createCaller();
    await caller.thread.create({ channelId, title });

    revalidatePath(`/channels/${channelId}`);
  }

  return (
    <main className="min-h-screen bg-[#14151f] text-foreground">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-2">
          <Link
            href={`/guilds/${channel.guild.slug}`}
            className="text-xs text-muted-foreground hover:text-white"
          >
            ← Back to channels
          </Link>
          <h1 className="text-3xl font-semibold text-white">#{channel.name}</h1>
          <p className="text-sm text-muted-foreground">Threads in {channel.guild.name}</p>
        </div>

        <Card className="border-border/60 bg-[#202233]/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Threads</CardTitle>
            <CardDescription>Browse or start a discussion.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {session?.user ? (
              <form action={createThreadAction} className="flex flex-col gap-3">
                <Input name="title" placeholder="New thread title" />
                <Button type="submit" className="w-fit">
                  Create thread
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in to create new threads.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {channel.threads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No threads yet.</p>
              ) : (
                channel.threads.map((thread: (typeof channel.threads)[number]) => (
                  <Link
                    key={thread.id}
                    href={`/threads/${thread.id}`}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-[#1b1d2b] px-4 py-3 text-sm text-foreground transition hover:bg-[#232539]"
                  >
                    <div>
                      <p className="font-medium">{thread.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {thread.createdBy.displayName ?? thread.createdBy.username ?? "member"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {thread._count.messages} messages
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
