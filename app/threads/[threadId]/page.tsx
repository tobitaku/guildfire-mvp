import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
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

  async function createMessageAction(formData: FormData) {
    "use server";
    const content = String(formData.get("content") ?? "").trim();
    if (!content) return;

    const currentSession = await getServerSession(authOptions);
    if (!currentSession?.user?.id) return;

    await prisma.message.create({
      data: {
        threadId: thread.id,
        authorId: currentSession.user.id,
        content,
      },
    });

    revalidatePath(`/threads/${thread.id}`);
  }

  async function editMessageAction(formData: FormData) {
    "use server";
    const messageId = String(formData.get("messageId") ?? "");
    const content = String(formData.get("content") ?? "").trim();
    if (!messageId || !content) return;

    const currentSession = await getServerSession(authOptions);
    if (!currentSession?.user?.id) return;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true },
    });

    if (!message || message.authorId !== currentSession.user.id) return;

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        editedAt: new Date(),
      },
    });

    revalidatePath(`/threads/${thread.id}`);
  }

  async function deleteMessageAction(formData: FormData) {
    "use server";
    const messageId = String(formData.get("messageId") ?? "");
    if (!messageId) return;

    const currentSession = await getServerSession(authOptions);
    if (!currentSession?.user?.id) return;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { authorId: true },
    });

    if (!message || message.authorId !== currentSession.user.id) return;

    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedById: currentSession.user.id,
      },
    });

    revalidatePath(`/threads/${thread.id}`);
  }

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
          <h1 className="text-3xl font-semibold text-white">{thread.title}</h1>
          <p className="text-sm text-muted-foreground">
            #{thread.channel.name} · {thread.channel.guild.name}
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
                {thread.messages.map((message) => (
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
                  />
                ))}
              </div>
            )}

            {session?.user ? (
              <form action={createMessageAction} className="flex flex-col gap-3">
                <Textarea name="content" placeholder="Write a message..." />
                <Button type="submit" className="w-fit">
                  Send message
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Sign in to send messages.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
