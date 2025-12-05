import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import type { Problem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  Play, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Code2,
  FlaskConical,
  Zap,
  Activity,
  Lightbulb
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

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface SubmissionResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  results: TestResult[];
}

export default function ProblemPage() {
  const [, params] = useRoute("/problem/:id");
  const problemId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [code, setCode] = useState("");
  const [results, setResults] = useState<SubmissionResult | null>(null);

  const { data: problem, isLoading } = useQuery<Problem>({
    queryKey: ["/api/problems", problemId],
    enabled: !!problemId,
  });

  const submitMutation = useMutation({
    mutationFn: async (submittedCode: string) => {
      const response = await apiRequest("POST", "/api/submit", {
        problemId,
        code: submittedCode,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data: SubmissionResult) => {
      setResults(data);
      queryClient.invalidateQueries({ queryKey: [`/api/submissions/${user?.id}`] });
      
      if (data.passed) {
        toast({
          title: "تهانينا!",
          description: "لقد اجتزت جميع الاختبارات بنجاح",
        });
      } else {
        toast({
          title: "حاول مرة أخرى",
          description: `نجحت في ${data.passedTests} من ${data.totalTests} اختبارات`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التنفيذ",
        description: error.message || "حدث خطأ أثناء تنفيذ الكود",
        variant: "destructive",
      });
    },
  });

  const icons: Record<string, typeof FlaskConical> = {
    density: FlaskConical,
    ohm_law: Zap,
    kinetic_energy: Activity,
  };
  
  const Icon = problemId ? (icons[problemId] || Code2) : Code2;

  const getStarterCode = (problem: Problem) => {
    if (problem.id === "density") {
      return `def density(mass, volume):
    # اكتب الكود هنا
    pass`;
    }
    if (problem.id === "ohm_law") {
      return `def voltage(current, resistance):
    # اكتب الكود هنا
    pass`;
    }
    if (problem.id === "kinetic_energy") {
      return `def kinetic_energy(mass, velocity):
    # اكتب الكود هنا
    pass`;
    }
    return "# اكتب الكود هنا";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">المسألة غير موجودة</h2>
              <p className="text-muted-foreground mb-4">لم نتمكن من العثور على هذه المسألة</p>
              <Link href="/">
                <Button>العودة للرئيسية</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back">
              <ArrowRight className="h-4 w-4" />
              العودة للمسائل
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Problem Description - Right Side (RTL) */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl" data-testid="text-problem-title">
                      {problem.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {problem.language === "python" ? "Python" : problem.language}
                      </Badge>
                      <DifficultyBadge difficulty={problem.difficulty || "medium"} />
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">الوصف</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-problem-description">
                    {problem.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  أمثلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {problem.testCases?.slice(0, 2).map((testCase, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 rounded-lg p-3 font-mono text-sm space-y-1"
                  >
                    <div className="text-muted-foreground">
                      <span className="text-foreground">المدخل:</span> {testCase.input}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="text-foreground">المخرج:</span> {testCase.output}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Code Editor - Left Side (RTL) */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    محرر الكود
                  </CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    Python
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  dir="ltr"
                  className="min-h-[300px] font-mono text-sm resize-none bg-zinc-950 text-zinc-100 dark:bg-zinc-900"
                  placeholder={getStarterCode(problem)}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  data-testid="textarea-code"
                />
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={() => submitMutation.mutate(code)}
                    disabled={!code.trim() || submitMutation.isPending}
                    className="gap-2"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري التنفيذ...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        إرسال الحل
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {results.passed ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">نجاح!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">لم تنجح بعد</span>
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    نجحت في {results.passedTests} من {results.totalTests} اختبارات
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.results?.map((result, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-3 ${
                          result.passed
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-red-500/30 bg-red-500/5"
                        }`}
                        data-testid={`result-${index}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {result.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium text-sm">
                            اختبار {index + 1}
                          </span>
                        </div>
                        <div className="grid gap-2 text-sm font-mono" dir="ltr">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Input:</span>
                            <span>{result.input}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Expected:</span>
                            <span className="text-green-600 dark:text-green-400">{result.expected}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Actual:</span>
                            <span className={result.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                              {result.actual}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
