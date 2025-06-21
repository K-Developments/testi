
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useState, FormEvent, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [showFooter, setShowFooter] = useState(false);
  const [mounted, setMounted] = useState(false);
  const loginPageContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "admin") {
        router.replace("/app/dashboard");
      } else if (currentUser.role === "cashier") {
        router.replace("/app/sales");
      }
    }
  }, [currentUser, router]);

  useEffect(() => {
    setMounted(true);

    const mainElement = loginPageContentRef.current;
    if (!mainElement) return;

    const handleScrollInteraction = () => {
      if (!loginPageContentRef.current || loginPageContentRef.current.clientHeight === 0) {
        setShowFooter(false);
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = mainElement;
      
      const isScrolledToBottom = scrollHeight > clientHeight && (scrollHeight - scrollTop - clientHeight < 5);
      const isContentTooShortToScroll = scrollHeight <= clientHeight;

      setShowFooter(isScrolledToBottom || isContentTooShortToScroll);
    };
    
    const animationFrameId = requestAnimationFrame(handleScrollInteraction);
    
    mainElement.addEventListener('scroll', handleScrollInteraction);
    const resizeObserver = new ResizeObserver(handleScrollInteraction);
    resizeObserver.observe(mainElement);
    if (document.body) {
      resizeObserver.observe(document.body);
    }


    return () => {
      cancelAnimationFrame(animationFrameId);
      mainElement.removeEventListener('scroll', handleScrollInteraction);
      resizeObserver.disconnect();
    };
  }, []); 

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    const success = await login(username, password);
    if (success) {
      // Redirection is handled by the useEffect hook above
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username or password.",
      });
      setPassword("");
    }
    setIsLoggingIn(false);
  };
  
  if (currentUser === undefined) { 
    return <GlobalPreloaderScreen message="Initializing..." />;
  }
  
  if (currentUser) { 
      return <GlobalPreloaderScreen message="Redirecting..." />;
  }

  // Not logged in, show login page
  return (
    <>
      <div 
        ref={loginPageContentRef}
        className="flex min-h-screen flex-col items-center justify-center bg-background p-4 pb-20 overflow-y-auto"
      >
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4">
              <AppLogo />
            </div>
            <CardTitle className="text-3xl font-headline">Welcome to NGroup Products</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="admin or user" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isLoggingIn}
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoggingIn}
                />
              </div>
              <Button type="submit" className="w-full mt-6" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground z-40",
          "transition-all duration-300 ease-in-out",
          (!mounted || !showFooter) ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        style={{
          transform: (mounted && showFooter) ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        Design, Development & Hosting by Limidora
      </footer>
    </>
  );
}
