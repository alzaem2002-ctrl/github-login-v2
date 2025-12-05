import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Problem, Submission } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  CheckCircle2, 
  Code2, 
  Trophy,
  ChevronLeft,
  FlaskConical,
  Zap,
  Activity
} from "lucide-react";

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: "bg-green-500/10 text-green-600 dark:text-green-400",
    medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    hard: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  
  const labels: Record<string, string> = {
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
  };

  return (
    <Badge variant="outline" className={colors[difficulty] || colors.medium}>
      {labels[difficulty] || "متوسط"}
    </Badge>
  );
}

function ProblemCard({ problem, isSolved }: { problem: Problem; isSolved: boolean }) {
  const icons: Record<string, typeof FlaskConical> = {
    density: FlaskConical,
    ohm_law: Zap,
    kinetic_energy: Activity,
  };
  
  const Icon = icons[problem.id] || Code2;

  return (
    <Card className="hover-elevate group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {problem.title}
                {isSolved && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {problem.language === "python" ? "Python" : problem.language}
              </CardDescription>
            </div>
          </div>
          <DifficultyBadge difficulty={problem.difficulty || "medium"} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {problem.description}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {problem.testCases?.length || 0} اختبارات
          </span>
          <Link href={`/problem/${problem.id}`}>
            <Button size="sm" className="gap-1" data-testid={`button-solve-${problem.id}`}>
              حل المسألة
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: typeof Trophy;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold" data-testid={`stat-${title}`}>{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: problems, isLoading: problemsLoading } = useQuery<Problem[]>({
    queryKey: ["/api/problems"],
  });

  const { data: submissions } = useQuery<Submission[]>({
    queryKey: [`/api/submissions/${user?.id}`],
    enabled: !!user,
  });

  const solvedProblems = new Set(
    submissions?.filter((s) => s.passed).map((s) => s.problemId) || []
  );

  const totalProblems = problems?.length || 0;
  const solvedCount = solvedProblems.size;
  const accuracy = submissions?.length 
    ? Math.round((submissions.filter(s => s.passed).length / submissions.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
              مرحباً {user?.displayName || user?.username}
            </h1>
            <p className="text-muted-foreground">
              ابدأ بحل التمارين البرمجية لتطوير مهاراتك في العلوم
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="المسائل المحلولة"
              value={`${solvedCount}/${totalProblems}`}
              icon={CheckCircle2}
            />
            <StatsCard
              title="نسبة النجاح"
              value={`${accuracy}%`}
              icon={Trophy}
            />
            <StatsCard
              title="إجمالي المحاولات"
              value={submissions?.length || 0}
              icon={Code2}
            />
          </div>

          {/* Problems Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                التمارين المتاحة
              </h2>
            </div>

            {problemsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/4 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                      <div className="flex justify-between mt-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : problems?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد تمارين متاحة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {problems?.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    isSolved={solvedProblems.has(problem.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
