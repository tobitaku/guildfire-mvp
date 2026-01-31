import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createCaller } from "@/lib/trpc/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageItem } from "@/app/threads/[threadId]/message-item";

type ThreadPageProps = {
  params: Promise<{ threadId: string }>;
};

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params;
  const session = await getServerSession(authOptions);

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      channel: {
        include: {
          guild: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          author: true,
        },
      },
    },
  });

  if (!thread) {
    return (
      <main className="min-h-screen bg-[#14151f] text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md border-border/60 bg-[#202233]/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Thread not found</CardTitle>
              <CardDescription>The requested thread does not exist.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  type ThreadMessage = (typeof thread.messages)[number];
  const messageIds = thread.messages.map((message: ThreadMessage) => message.id);

  async function createMessageAction(formData: FormData) {
    "use server";
    const content = String(formData.get("content") ?? "").trim();
    if (!content) return;

    const caller = await createCaller();
    await caller.message.create({ threadId, content });

    revalidatePath(`/threads/${threadId}`);
  }

  async function editMessageAction(formData: FormData) {
    "use server";
    const messageId = String(formData.get("messageId") ?? "");
    const content = String(formData.get("content") ?? "").trim();
    if (!messageId || !content) return;

    const caller = await createCaller();
    await caller.message.update({ messageId, content });

    revalidatePath(`/threads/${threadId}`);
  }

  async function deleteMessageAction(formData: FormData) {
    "use server";
    const messageId = String(formData.get("messageId") ?? "");
    if (!messageId) return;

    const caller = await createCaller();
    await caller.message.delete({ messageId });

    revalidatePath(`/threads/${threadId}`);
  }

  async function toggleReactionAction(formData: FormData) {
    "use server";
    const messageId = String(formData.get("messageId") ?? "");
    const emoji = String(formData.get("emoji") ?? "").trim();
    if (!messageId || !emoji) return;

    const caller = await createCaller();
    await caller.reaction.toggle({ messageId, emoji });

    revalidatePath(`/threads/${threadId}`);
  }

  async function toggleLockAction(formData: FormData) {
    "use server";
    const locked = formData.get("locked") === "true";
    const caller = await createCaller();
    await caller.thread.toggleLock({ threadId, locked });
    revalidatePath(`/threads/${threadId}`);
  }

  const reactions = await prisma.messageReaction.groupBy({
    by: ["messageId", "emoji"],
    _count: { emoji: true },
    where: {
      messageId: {
        in: messageIds,
      },
    },
  });

  const reactionsByMessage = reactions.reduce<Record<string, { emoji: string; count: number }[]>>(
    (acc, reaction) => {
      acc[reaction.messageId] ??= [];
      acc[reaction.messageId].push({
        emoji: reaction.emoji,
        count: reaction._count.emoji,
      });
      return acc;
    },
    {}
  );

  const userReactionKeys = new Set<string>();
  if (session?.user?.id) {
    const userReactions = await prisma.messageReaction.findMany({
      where: {
        userId: session.user.id,
        messageId: {
          in: messageIds,
        },
      },
      select: { messageId: true, emoji: true },
    });

    for (const reaction of userReactions) {
      userReactionKeys.add(`${reaction.messageId}:${reaction.emoji}`);
    }
  }

  const isAdmin = session?.user?.id
    ? Boolean(
        await prisma.memberRole.findFirst({
          where: {
            userId: session.user.id,
            guildId: thread.channel.guildId,
            role: { name: "Admin" },
          },
          select: { roleId: true },
        })
      )
    : false;

  return (
    <main className="min-h-screen bg-[#14151f] text-foreground">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-2">
          <Link
            href={`/channels/${thread.channelId}`}
            className="text-xs text-muted-foreground hover:text-white"
          >
            ← Back to threads
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-white">{thread.title}</h1>
            {isAdmin ? (
              <form action={toggleLockAction}>
                <input type="hidden" name="locked" value={String(!thread.isLocked)} />
                <Button type="submit" size="sm" variant={thread.isLocked ? "secondary" : "default"}>
                  {thread.isLocked ? "Unlock thread" : "Lock thread"}
                </Button>
              </form>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            #{thread.channel.name} · {thread.channel.guild.name}
            {thread.isLocked ? " · Locked" : ""}
          </p>
        </div>

        <Card className="border-border/60 bg-[#202233]/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Conversation in this thread.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {thread.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {thread.messages.map((message: ThreadMessage) => (
                  <MessageItem
                    key={message.id}
                    id={message.id}
                    authorLabel={
                      message.author.displayName ?? message.author.username ?? "member"
                    }
                    createdAtLabel={message.createdAt.toLocaleString()}
                    content={message.content}
                    editedAtLabel={message.editedAt?.toLocaleString() ?? null}
                    deletedAtLabel={message.deletedAt?.toLocaleString() ?? null}
                    canEdit={session?.user?.id === message.authorId}
                    onEdit={editMessageAction}
                    onDelete={deleteMessageAction}
                    onToggleReaction={toggleReactionAction}
                    reactions={reactionsByMessage[message.id] ?? []}
                    userReactionKeys={userReactionKeys}
                  />
                ))}
              </div>
            )}

            {session?.user && (!thread.isLocked || isAdmin) ? (
              <form action={createMessageAction} className="flex flex-col gap-3">
                <Textarea name="content" placeholder="Write a message..." />
                <Button type="submit" className="w-fit">
                  Send message
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                {session?.user
                  ? "This thread is locked. Only admins can post."
                  : "Sign in to send messages."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
