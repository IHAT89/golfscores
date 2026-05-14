"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  History, 
  Trophy, 
  Target, 
  TrendingUp,
  MapPin,
  Plus,
  BarChart3,
  Golf
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface Round {
  id: string;
  date: Date;
  courseName: string;
  grossScore: number;
  rating: number;
  slope: number;
  differential: number;
}

const DEFAULT_COURSE = "Seletar Country Club";

export default function PinHighDashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const [score, setScore] = useState<string>("");
  const [courseName, setCourseName] = useState<string>(DEFAULT_COURSE);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [currentCourseData, setCurrentCourseData] = useState<CourseHandicapOutput | null>(null);
  const { toast } = useToast();

  // Load initial course data for default
  useEffect(() => {
    handleFetchCourseData(DEFAULT_COURSE);
    const saved = localStorage.getItem("pinhigh_rounds");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRounds(parsed.map((r: any) => ({ ...r, date: new Date(r.date) })));
      } catch (e) {
        console.error("Failed to parse rounds", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pinhigh_rounds", JSON.stringify(rounds));
  }, [rounds]);

  const handleFetchCourseData = async (name: string) => {
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

  const handleAddRound = () => {
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

    const newRound: Round = {
      id: Math.random().toString(36).substr(2, 9),
      date,
      courseName,
      grossScore: numScore,
      rating: currentCourseData.courseHandicapRating,
      slope: currentCourseData.slopeRating,
      differential: Number(diff.toFixed(1)),
    };

    setRounds([newRound, ...rounds]);
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

  return (
    <div className="min-h-screen pb-20 p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary flex items-center gap-2">
             PinHigh
          </h1>
          <p className="text-muted-foreground font-medium">Precision Golf Tracking</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Handicap Index</div>
          <div className="text-5xl font-headline font-bold text-accent electric-glow">{handicapIndex || "--"}</div>
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
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> Differential Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="diff" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: 'hsl(var(--accent))' }} />
              </LineChart>
            </ResponsiveContainer>
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
          {rounds.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl border-white/5 bg-white/[0.02]">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground">No rounds recorded yet. Time to hit the links!</p>
            </div>
          ) : (
            rounds.map((round) => (
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