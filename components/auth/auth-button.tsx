"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type AuthButtonProps = {
  className?: string;
};

export function AuthButton({ className }: AuthButtonProps) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (session?.user) {
    return (
      <Button
        className={className}
        variant="secondary"
        onClick={() => signOut({ callbackUrl: "/" })}
        disabled={isLoading}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    );
  }

  return (
    <Button
      className={className}
      onClick={() => signIn("discord", { callbackUrl: "/" })}
      disabled={isLoading}
    >
      <LogIn className="h-4 w-4" />
      Login with Discord
    </Button>
  );
}
