
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  History, 
  Target, 
  TrendingUp,
  MapPin,
  Plus,
  BarChart3,
  LogOut,
  User as UserIcon,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { fetchCourseHandicapData, type CourseHandicapOutput } from "@/ai/flows/fetch-course-handicap-data";
import { useToast } from "@/hooks/use-toast";
import { calculateDifferential, calculateHandicapIndex } from "@/lib/handicap-utils";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { 
  useUser, 
  useCollection, 
  useFirestore, 
  useAuth 
} from "@/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc 
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const DEFAULT_COURSE = "Seletar Country Club";

export default function PinHighDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [date, setDate] = useState<Date>(new Date());
  const [score, setScore] = useState<string>("");
  const [courseName, setCourseName] = useState<string>(DEFAULT_COURSE);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [currentCourseData, setCurrentCourseData] = useState<CourseHandicapOutput | null>(null);

  // Firestore Queries
  const roundsQuery = user && db ? query(
    collection(db, "users", user.uid, "rounds"),
    orderBy("date", "desc")
  ) : null;

  const { data: roundsData, loading: roundsLoading } = useCollection(roundsQuery);
  const rounds = (roundsData || []).map(r => ({
    ...r,
    date: r.date?.toDate ? r.date.toDate() : new Date(r.date)
  }));

  useEffect(() => {
    handleFetchCourseData(DEFAULT_COURSE);
  }, []);

  const handleFetchCourseData = async (name: string) => {
    if (!name) return;
    setIsLoadingCourse(true);
    try {
      const data = await fetchCourseHandicapData({ courseName: name });
      setCurrentCourseData(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not fetch course handicap information.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const handleSignIn = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const handleAddRound = () => {
    if (!user || !db) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to record rounds.",
        variant: "destructive",
      });
      return;
    }

    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore <= 0) {
      toast({
        title: "Invalid Score",
        description: "Please enter a valid total score.",
        variant: "destructive",
      });
      return;
    }

    if (!currentCourseData) return;

    const diff = calculateDifferential(
      numScore,
      currentCourseData.courseHandicapRating,
      currentCourseData.slopeRating
    );

    const roundsRef = collection(db, "users", user.uid, "rounds");
    const newRoundData = {
      date: date,
      courseName,
      grossScore: numScore,
      rating: currentCourseData.courseHandicapRating,
      slope: currentCourseData.slopeRating,
      differential: Number(diff.toFixed(1)),
      createdAt: serverTimestamp(),
    };

    addDoc(roundsRef, newRoundData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: roundsRef.path,
          operation: 'create',
          requestResourceData: newRoundData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    setScore("");
    toast({
      title: "Round Recorded",
      description: `Saved ${numScore} at ${courseName}.`,
    });
  };

  const handicapIndex = calculateHandicapIndex(rounds.map(r => r.differential));
  
  const chartData = [...rounds].reverse().map(r => ({
    date: format(r.date, "MMM dd"),
    score: r.grossScore,
    diff: r.differential
  }));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full glass-card border-primary/20 shadow-2xl">
          <CardHeader className="text-center">
            <h1 className="text-5xl font-headline font-bold text-primary mb-2">PinHigh</h1>
            <CardDescription className="text-lg">Elite golf performance tracking starts here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button onClick={handleSignIn} className="w-full h-14 text-lg font-bold rounded-xl gap-2">
              <LogIn className="w-5 h-5" /> Sign in with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground px-8">
              Track your handicap index, analyze scoring trends, and master the course with precision data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg">
             {user.photoURL ? (
               <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                 <UserIcon className="text-primary w-6 h-6" />
               </div>
             )}
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-headline font-bold text-primary flex items-center gap-2">
               PinHigh
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Hello, {user.displayName?.split(' ')[0] || 'Golfer'}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Handicap Index</div>
            <div className="text-4xl font-headline font-bold text-accent electric-glow">{handicapIndex || "--"}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
            <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
          </Button>
        </div>
      </header>

      {/* Main Scoring Interface */}
      <Card className="glass-card shadow-2xl overflow-hidden border-primary/20">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Plus className="w-5 h-5 text-accent" /> Record New Round
          </CardTitle>
          <CardDescription>Fast entry for your latest outing</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Date of Play</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 bg-background/50",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Golf Course</Label>
              <div className="relative">
                <Input
                  className="h-12 pl-10 bg-background/50 focus-visible:ring-accent"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  onBlur={() => handleFetchCourseData(courseName)}
                  placeholder="Enter club name..."
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              </div>
              {isLoadingCourse && <p className="text-[10px] text-accent animate-pulse">Syncing course data...</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Total Gross Score</Label>
              <Input
                type="number"
                className="h-12 text-2xl font-headline font-bold text-center bg-background/50 border-accent/20 focus-visible:ring-accent"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="72"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/5 mt-2">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Rating</span>
                <span className="font-headline font-medium text-white">{currentCourseData?.courseHandicapRating || "--"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Slope</span>
                <span className="font-headline font-medium text-white">{currentCourseData?.slopeRating || "--"}</span>
              </div>
            </div>
            <Button onClick={handleAddRound} className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-full">
              Post Score
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] w-full pt-4">
            {roundsLoading ? (
               <div className="h-full w-full flex items-center justify-center"><BarChart3 className="animate-pulse text-primary/20" /></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Not enough data</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> Differential Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] w-full pt-4">
            {roundsLoading ? (
               <div className="h-full w-full flex items-center justify-center"><BarChart3 className="animate-pulse text-accent/20" /></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="diff" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: 'hsl(var(--accent))' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Not enough data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Round History
          </h2>
          <span className="text-xs text-muted-foreground font-medium">{rounds.length} rounds recorded</span>
        </div>

        <div className="space-y-3">
          {roundsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-20 w-full bg-primary/5 animate-pulse rounded-xl" />
            ))
          ) : rounds.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl border-white/5 bg-white/[0.02]">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground">No rounds recorded yet. Time to hit the links!</p>
            </div>
          ) : (
            rounds.map((round: any) => (
              <Card key={round.id} className="glass-card group hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <span className="text-lg font-headline font-bold text-primary">{round.grossScore}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground leading-none mb-1">{round.courseName}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        {format(round.date, "MMMM d, yyyy")} 
                        <span className="inline-block w-1 h-1 rounded-full bg-white/10" />
                        Diff: <span className="text-accent font-bold">{round.differential}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
