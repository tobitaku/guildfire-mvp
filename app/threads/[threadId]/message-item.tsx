"use client";

import { useRef, useState } from "react";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MessageItemProps = {
  id: string;
  authorLabel: string;
  createdAtLabel: string;
  content: string;
  editedAtLabel?: string | null;
  deletedAtLabel?: string | null;
  canEdit: boolean;
  onEdit: (formData: FormData) => void;
  onDelete: (formData: FormData) => void;
  onToggleReaction: (formData: FormData) => void;
  reactions: { emoji: string; count: number }[];
  userReactionKeys: Set<string>;
};

export function MessageItem({
  id,
  authorLabel,
  createdAtLabel,
  content,
  editedAtLabel,
  deletedAtLabel,
  canEdit,
  onEdit,
  onDelete,
  onToggleReaction,
  reactions,
  userReactionKeys,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const deleteFormRef = useRef<HTMLFormElement | null>(null);
  const reactionEmojis = ["👍", "🔥", "🎮", "❤️", "😄"];
  const existingEmojiSet = new Set(reactions.map((reaction) => reaction.emoji));

  return (
    <div className="rounded-md border border-border/60 bg-[#1b1d2b] px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-col">
          <span>{authorLabel}</span>
          <span>{createdAtLabel}</span>
        </div>
        {canEdit && !deletedAtLabel ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => setIsEditing(true)}>Edit message</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => deleteFormRef.current?.requestSubmit()}
                className="text-red-400 focus:text-red-400"
              >
                Delete message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {deletedAtLabel ? (
        <p className="mt-2 italic text-muted-foreground">Message deleted.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-foreground">{content}</p>
          {editedAtLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">Edited</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {reactions.map((reaction) => {
              const isActive = userReactionKeys.has(`${id}:${reaction.emoji}`);
              return (
                <form key={`${id}-${reaction.emoji}`} action={onToggleReaction}>
                  <input type="hidden" name="messageId" value={id} />
                  <input type="hidden" name="emoji" value={reaction.emoji} />
                  <button
                    type="submit"
                    className={`rounded-full border px-2 py-1 text-xs transition ${
                      isActive
                        ? "border-primary/80 bg-primary/20 text-primary-foreground"
                        : "border-border/60 bg-[#232539] text-muted-foreground hover:text-white"
                    }`}
                  >
                    {reaction.emoji} {reaction.count}
                  </button>
                </form>
              );
            })}
            {reactionEmojis.filter((emoji) => !existingEmojiSet.has(emoji)).map((emoji) => {
              const isActive = userReactionKeys.has(`${id}:${emoji}`);
              return (
                <form key={`${id}-${emoji}-toggle`} action={onToggleReaction}>
                  <input type="hidden" name="messageId" value={id} />
                  <input type="hidden" name="emoji" value={emoji} />
                  <button
                    type="submit"
                    className={`rounded-full border px-2 py-1 text-xs transition ${
                      isActive
                        ? "border-primary/80 bg-primary/20 text-primary-foreground"
                        : "border-border/60 bg-[#232539] text-muted-foreground hover:text-white"
                    }`}
                  >
                    {emoji}
                  </button>
                </form>
              );
            })}
          </div>
        </>
      )}

      {isEditing && !deletedAtLabel ? (
        <form action={onEdit} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="messageId" value={id} />
          <Textarea name="content" defaultValue={content} />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Save changes
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <form ref={deleteFormRef} action={onDelete}>
        <input type="hidden" name="messageId" value={id} />
      </form>
    </div>
  );
}
