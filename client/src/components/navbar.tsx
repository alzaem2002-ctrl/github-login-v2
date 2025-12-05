import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Settings, BookOpen, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link href="/">
            <a className="flex items-center gap-2 text-xl font-bold text-foreground" data-testid="link-home">
              <BookOpen className="h-6 w-6 text-primary" />
              <span>منصة علوم الذكية</span>
            </a>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                className="gap-2"
                data-testid="link-dashboard"
              >
                <LayoutDashboard className="h-4 w-4" />
                لوحة التحكم
              </Button>
            </Link>
            
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant={location === "/admin" ? "secondary" : "ghost"}
                  className="gap-2"
                  data-testid="link-admin"
                >
                  <Settings className="h-4 w-4" />
                  الإدارة
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span data-testid="text-welcome">مرحباً،</span>
            <span className="font-medium text-foreground" data-testid="text-username">
              {user.displayName || user.username}
            </span>
            {isAdmin && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                مشرف
              </span>
            )}
          </div>
          
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
