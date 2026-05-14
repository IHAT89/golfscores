"use client";

// Diagnostic: Force fresh build webhook.
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
  LogIn,
  ShieldCheck,
  AlertCircle,
  Trophy
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
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { 
  useUser, 
  useCollection, 
  useFirestore, 
  useAuth,
  useMemoFirebase 
} from "@/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function PinHighDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [date, setDate] = useState<Date>(new Date());
  const [score, setScore] = useState<string>("");
  const [courseName, setCourseName] = useState<string>("Pebble Beach Golf Links");
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [currentCourseData, setCurrentCourseData] = useState<CourseHandicapOutput | null>(null);

  const roundsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, "users", user.uid, "rounds"),
      orderBy("date", "desc")
    );
  }, [user?.uid, db]);

  const { data: roundsData, loading: roundsLoading } = useCollection(roundsQuery);
  
  const rounds = (roundsData || []).map((r: any) => ({
    ...r,
    date: r.date?.toDate ? r.date.toDate() : new Date(r.date)
  })) as any[];

  useEffect(() => {
    if (user) {
      handleFetchCourseData("Pebble Beach Golf Links");
    }
  }, [user]);

  const handleFetchCourseData = async (name: string) => {
    if (!name || name.length < 3) return;
    setIsLoadingCourse(true);
    try {
      const data = await fetchCourseHandicapData({ courseName: name });
      setCurrentCourseData(data);
    } catch (err) {
      console.error(err);
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
        title: "Access Denied",
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
    if (!user || !db) return;

    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore <= 0) {
      toast({ title: "Score Required", description: "Please enter a valid gross score.", variant: "destructive" });
      return;
    }

    if (!currentCourseData) {
      toast({ title: "Validating...", description: "Please wait for course verification.", variant: "destructive" });
      return;
    }

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
      title: "Performance Recorded",
      description: `Entry saved for ${courseName}.`,
    });
  };

  const handicapIndex = calculateHandicapIndex(rounds.map(r => r.differential));
  
  const chartData = [...rounds].reverse().slice(-10).map(r => ({
    date: format(r.date, "MM/dd"),
    score: r.grossScore,
    diff: r.differential
  }));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full glass-card border-primary/20 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardHeader className="text-center pt-10">
            <h1 className="text-6xl font-headline font-bold text-primary mb-2 tracking-tighter italic">PH</h1>
            <CardTitle className="text-3xl font-headline font-bold">PinHigh</CardTitle>
            <CardDescription className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Elite Performance Tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 pb-10 px-8">
            <Button onClick={handleSignIn} className="w-full h-14 text-lg font-bold rounded-xl gap-3 shadow-xl hover:scale-[1.02] transition-transform">
              <LogIn className="w-5 h-5" /> Sign in with Google
            </Button>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
              <div className="flex-1 h-px bg-white/5" />
              <span>USGA Authoritative Data</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4 md:p-10 space-y-10 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl bg-muted ring-4 ring-primary/5">
             {user.photoURL ? (
               <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center">
                 <UserIcon className="text-primary w-8 h-8" />
               </div>
             )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-5xl font-headline font-bold text-primary tracking-tighter italic">PinHigh V2</h1>
              <div className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest border border-accent/20">PRO</div>
            </div>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Verified Profile: {user.displayName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Handicap Index</div>
            <div className="text-5xl font-headline font-bold text-accent electric-glow tracking-tighter">
              {handicapIndex > 0 ? handicapIndex : "--"}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-12 w-12 rounded-xl hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <Card className="glass-card shadow-2xl border-primary/10 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-white/5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-headline italic">
                <Plus className="w-5 h-5 text-accent" /> Post Performance
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-tight">Syncing with USGA National Course Rating Database</CardDescription>
            </div>
            {currentCourseData && (
              <div className="flex items-center gap-2">
                {currentCourseData.isEstimated ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase border border-yellow-500/20">
                    <AlertCircle className="w-3 h-3" /> Estimate
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">
                    <ShieldCheck className="w-3 h-3" /> Authoritative
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Date of Play</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-14 bg-background/30 rounded-xl border-white/5",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                    {date ? format(date, "PPP") : <span>Select Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/5" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Golf Course</Label>
              <div className="relative">
                <Input
                  className="h-14 pl-12 bg-background/30 rounded-xl border-white/5 focus-visible:ring-accent text-lg font-medium"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  onBlur={() => handleFetchCourseData(courseName)}
                  placeholder="e.g. Pebble Beach"
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              </div>
              {isLoadingCourse && <p className="text-[10px] text-accent animate-pulse font-bold">Querying USGA records...</p>}
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Gross Score</Label>
              <div className="relative">
                <Input
                  type="number"
                  className="h-14 text-3xl font-headline font-bold text-center bg-background/30 rounded-xl border-accent/20 focus-visible:ring-accent"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="--"
                />
                <Trophy className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent opacity-20" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-white/5 gap-6">
            <div className="flex gap-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Course Rating</span>
                <span className="text-2xl font-headline font-bold text-foreground">{currentCourseData?.courseHandicapRating || "--"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Slope Rating</span>
                <span className="text-2xl font-headline font-bold text-foreground">{currentCourseData?.slopeRating || "--"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Source</span>
                <span className="text-[10px] font-bold text-primary truncate max-w-[150px] mt-2">
                  {currentCourseData?.source || "Pending..."}
                </span>
              </div>
            </div>
            <Button onClick={handleAddRound} className="h-14 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl transition-all shadow-xl hover:scale-[1.05] active:scale-95 text-lg">
              Confirm Score
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Score Trajectory (Last 10)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full pt-8 px-2">
            {roundsLoading ? (
               <div className="h-full w-full flex items-center justify-center"><BarChart3 className="animate-pulse text-primary/20 w-10 h-10" /></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide domain={['dataMin - 3', 'dataMax + 3']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorScore)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest font-bold">Historical data required</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> Differential Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full pt-8 px-2">
            {roundsLoading ? (
               <div className="h-full w-full flex items-center justify-center"><BarChart3 className="animate-pulse text-accent/20 w-10 h-10" /></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="diff" stroke="hsl(var(--accent))" strokeWidth={4} dot={{ fill: 'hsl(var(--accent))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest font-bold">Syncing performance metrics...</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-headline font-bold flex items-center gap-3 italic">
            <History className="w-6 h-6 text-primary" /> Performance Log
          </h2>
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-white/5 px-3 py-1 rounded-full">{rounds.length} Total Rounds</span>
        </div>

        <div className="grid gap-4">
          {roundsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 w-full bg-primary/5 animate-pulse rounded-2xl" />
            ))
          ) : rounds.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl border-white/5 bg-white/[0.01] flex flex-col items-center gap-4">
              <BarChart3 className="w-16 h-16 text-muted-foreground/10" />
              <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">No Rounds Recorded. Initializing Collection.</p>
              <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="rounded-full border-primary/20 text-primary">Start Tracking</Button>
            </div>
          ) : (
            rounds.map((round: any) => (
              <Card key={round.id} className="glass-card group hover:border-primary/40 transition-all active:scale-[0.99] border-white/5">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-all group-hover:scale-105">
                      <span className="text-3xl font-headline font-bold text-primary italic">{round.grossScore}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-headline font-bold text-foreground leading-none mb-2">{round.courseName}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                        <span className="text-primary/70">{format(round.date, "MMMM d, yyyy")}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>Differential: <span className="text-accent">{round.differential}</span></span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>CR: {round.rating}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>SL: {round.slope}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
