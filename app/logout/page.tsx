"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1e1f2a] via-[#202236] to-[#1a1b26] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-border/60 bg-[#232539]/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Signing out</CardTitle>
            <CardDescription>Routing you back to the lobby…</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">If nothing happens, close this tab.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
