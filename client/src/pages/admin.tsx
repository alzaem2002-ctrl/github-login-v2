import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Problem, User, Submission } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  BookOpen, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  TrendingUp,
  Activity,
  KeyRound
} from "lucide-react";

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend
}: { 
  title: string; 
  value: string | number; 
  icon: typeof Users;
  description?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid={`admin-stat-${title}`}>{value}</p>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
          </div>
          {trend && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3 ml-1" />
              {trend}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-3">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: problems, isLoading: problemsLoading } = useQuery<Problem[]>({
    queryKey: ["/api/problems"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const { data: allSubmissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/admin/submissions"],
    enabled: isAdmin,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/admin/reset-password", { userId, newPassword });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      setResetDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تغيير كلمة المرور",
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
  };

  const openResetDialog = (student: User) => {
    setSelectedUser(student);
    setNewPassword("");
    setResetDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground mb-4">ليس لديك صلاحية الوصول لهذه الصفحة</p>
              <Link href="/">
                <Button>العودة للرئيسية</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const totalStudents = users?.filter(u => u.role === "student").length || 0;
  const totalProblems = problems?.length || 0;
  const totalSubmissions = allSubmissions?.length || 0;
  const successfulSubmissions = allSubmissions?.filter(s => s.passed).length || 0;
  const successRate = totalSubmissions > 0 
    ? Math.round((successfulSubmissions / totalSubmissions) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-admin-title">
                <Settings className="h-8 w-8 text-primary" />
                لوحة الإدارة
              </h1>
              <p className="text-muted-foreground">
                إدارة المنصة والطلاب والتمارين
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="إجمالي الطلاب"
              value={totalStudents}
              icon={Users}
            />
            <StatsCard
              title="التمارين المتاحة"
              value={totalProblems}
              icon={BookOpen}
            />
            <StatsCard
              title="إجمالي المحاولات"
              value={totalSubmissions}
              icon={Activity}
            />
            <StatsCard
              title="نسبة النجاح"
              value={`${successRate}%`}
              icon={BarChart3}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="students" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="students" data-testid="tab-students">الطلاب</TabsTrigger>
              <TabsTrigger value="problems" data-testid="tab-problems">التمارين</TabsTrigger>
              <TabsTrigger value="submissions" data-testid="tab-submissions">المحاولات</TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    قائمة الطلاب
                  </CardTitle>
                  <CardDescription>
                    جميع الطلاب المسجلين في المنصة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">اسم المستخدم</TableHead>
                          <TableHead className="text-right">الاسم</TableHead>
                          <TableHead className="text-right">الدور</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.filter(u => u.role === "student").map((student) => (
                          <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                            <TableCell className="font-medium">{student.username}</TableCell>
                            <TableCell>{student.displayName || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">طالب</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openResetDialog(student)}
                                data-testid={`button-reset-password-${student.id}`}
                              >
                                <KeyRound className="h-4 w-4 ml-1" />
                                تغيير كلمة المرور
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {users?.filter(u => u.role === "student").length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              لا يوجد طلاب مسجلين بعد
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Problems Tab */}
            <TabsContent value="problems">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    التمارين البرمجية
                  </CardTitle>
                  <CardDescription>
                    جميع التمارين المتاحة للطلاب
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {problemsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">العنوان</TableHead>
                          <TableHead className="text-right">اللغة</TableHead>
                          <TableHead className="text-right">الصعوبة</TableHead>
                          <TableHead className="text-right">عدد الاختبارات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {problems?.map((problem) => (
                          <TableRow key={problem.id} data-testid={`row-problem-${problem.id}`}>
                            <TableCell className="font-medium">{problem.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {problem.language}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  problem.difficulty === "easy" 
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : problem.difficulty === "hard"
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                }
                              >
                                {problem.difficulty === "easy" ? "سهل" : problem.difficulty === "hard" ? "صعب" : "متوسط"}
                              </Badge>
                            </TableCell>
                            <TableCell>{problem.testCases?.length || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    سجل المحاولات
                  </CardTitle>
                  <CardDescription>
                    جميع محاولات الطلاب لحل التمارين
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submissionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الطالب</TableHead>
                          <TableHead className="text-right">التمرين</TableHead>
                          <TableHead className="text-right">النتيجة</TableHead>
                          <TableHead className="text-right">الاختبارات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSubmissions?.slice(0, 20).map((submission) => {
                          const student = users?.find(u => u.id === submission.userId);
                          const problem = problems?.find(p => p.id === submission.problemId);
                          return (
                            <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                              <TableCell className="font-medium">
                                {student?.displayName || student?.username || "غير معروف"}
                              </TableCell>
                              <TableCell>{problem?.title || submission.problemId}</TableCell>
                              <TableCell>
                                {submission.passed ? (
                                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-3 w-3 ml-1" />
                                    نجاح
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400">
                                    <XCircle className="h-3 w-3 ml-1" />
                                    فشل
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {submission.passedTests}/{submission.totalTests}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {allSubmissions?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              لا توجد محاولات بعد
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
            <DialogDescription>
              تغيير كلمة المرور للطالب: {selectedUser?.displayName || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              data-testid="button-cancel-reset"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || !newPassword}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
