import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthButton } from "@/components/auth/auth-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1e1f2a] via-[#202236] to-[#1a1b26] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-sm border-border/60 bg-[#232539]/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to access your account and continue where you left off.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
            <AuthButton className="w-full" />
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to the community guidelines.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
