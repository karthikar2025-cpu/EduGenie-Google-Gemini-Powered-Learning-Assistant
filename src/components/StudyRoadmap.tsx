import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Award,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Printer,
  Copy,
  Check,
  ArrowRight,
  HelpCircle,
  GraduationCap,
  Layers,
  AlertCircle,
  Bookmark
} from 'lucide-react';
import { StudyPlanData, SubjectCategory, GradeLevel } from '../types';

interface StudyRoadmapProps {
  subject: SubjectCategory;
  gradeLevel: GradeLevel;
  onLaunchQuiz?: (topic: string) => void;
  onLaunchChat?: (topic: string) => void;
  onLaunchFlashcards?: (topic: string) => void;
}

export const StudyRoadmap: React.FC<StudyRoadmapProps> = ({
  subject,
  gradeLevel,
  onLaunchQuiz,
  onLaunchChat,
  onLaunchFlashcards,
}) => {
  // Goal and Personalization State
  const [goal, setGoal] = useState('Master Dynamic Programming & Graph Algorithms');
  const [targetOutcome, setTargetOutcome] = useState('Score 95%+ / Grade A');
  const [weakAreas, setWeakAreas] = useState('Memoization tables, recursion trees');
  const [durationWeeks, setDurationWeeks] = useState(3);
  const [dailyHours, setDailyHours] = useState(2);
  const [currentLevel, setCurrentLevel] = useState('Intermediate');
  const [schedulePreference, setSchedulePreference] = useState('5 days/week');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});

  // Subject specific goal presets
  const sampleGoals: Record<string, string[]> = {
    Mathematics: [
      'Calculus: Derivatives, Integrals & Series Mastery',
      'Linear Algebra: Eigenvalues, Diagonalization & SVD',
      'Differential Equations: Separation of Variables & Laplace Transforms'
    ],
    Science: [
      'Physics: Newton’s Laws, Energy & Rotational Dynamics',
      'Organic Chemistry: Reaction Mechanisms, SN1/SN2 & Stereochemistry',
      'Cell Biology: Cellular Respiration, Photosynthesis & Genetics'
    ],
    ComputerScience: [
      'Master Dynamic Programming, Graphs & Trees for Technical Interviews',
      'Computer Systems: Memory Hierarchy, Pointers & Assembly',
      'Full Stack Web Development: REST APIs, Databases & React'
    ],
    Humanities: [
      'Macroeconomics: Monetary Policy, Inflation & GDP Analysis',
      'Cognitive Psychology: Memory Models & Attention Systems',
      'World History: Major Revolutions & Economic Consequences'
    ]
  };

  // Load completed tasks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('edugenie_tasks');
      if (saved) setCompletedTasks(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleGenerate = async (presetGoal?: string) => {
    const targetGoal = (presetGoal || goal).trim();
    if (!targetGoal || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: targetGoal,
          subject,
          gradeLevel,
          durationWeeks,
          dailyHours,
          currentLevel,
          targetOutcome,
          weakAreas: weakAreas.trim(),
          schedulePreference
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StudyPlanData = await res.json();
      setPlan(data);
      setGoal(data.title || targetGoal);
    } catch (err) {
      console.error(err);
      alert('Could not generate personalized study plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem('edugenie_tasks', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const toggleWeekCollapse = (weekNum: number) => {
    setCollapsedWeeks((prev) => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  // Calculate task completion progress
  const allTasksCount =
    plan?.weeks.reduce((acc, w) => acc + w.days.length, 0) || 0;
  const completedCount =
    plan?.weeks.reduce(
      (acc, w) =>
        acc +
        w.days.filter((d) => completedTasks[`w${w.weekNumber}-d${d.dayNumber}`])
          .length,
      0
    ) || 0;

  const progressPercentage =
    allTasksCount > 0 ? Math.round((completedCount / allTasksCount) * 100) : 0;

  const handleCopyPlan = () => {
    if (!plan) return;
    let text = `📅 PERSONALIZED STUDY PLAN: ${plan.title}\n`;
    text += `Target: ${targetOutcome} | Total Hours: ~${plan.estimatedHoursTotal} hrs\n\n`;
    plan.weeks.forEach((w) => {
      text += `=== WEEK ${w.weekNumber}: ${w.theme} ===\nGoal: ${w.weeklyGoal}\n`;
      w.days.forEach((d) => {
        text += `  Day ${d.dayNumber}: ${d.title} (${d.estimatedMinutes} min) - Focus: ${d.focus}\n`;
      });
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Personalized Study Plan &amp; Schedule</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Tailored Roadmap
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalized day-by-day learning schedule tailored to your subject, specific exam goal, weak areas, and daily availability.
            </p>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Goal Input */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Your Primary Learning Goal or Exam Target:
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Master Linear Algebra & Pass Midterms"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70"
            />
          </div>

          {/* Target Outcome */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Target Outcome:
            </label>
            <select
              value={targetOutcome}
              onChange={(e) => setTargetOutcome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70 cursor-pointer"
            >
              <option value="Score 95%+ / Grade A">Score 95%+ / Grade A</option>
              <option value="Solid Mastery (B+ to A-)">Solid Mastery (B+ to A-)</option>
              <option value="Overcome Weaknesses & Catch Up">Catch Up &amp; Pass</option>
              <option value="Competition / Interview Readiness">Technical Interview / Olympiad</option>
            </select>
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Timeline:
            </label>
            <select
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70 cursor-pointer"
            >
              <option value={1}>1 Week (Intensive Sprint)</option>
              <option value={2}>2 Weeks</option>
              <option value={3}>3 Weeks</option>
              <option value={4}>4 Weeks (1 Month)</option>
              <option value={6}>6 Weeks</option>
              <option value={8}>8 Weeks (Full Term)</option>
            </select>
          </div>

          {/* Weak Areas Input */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Specific Weak Topics / Stumbling Blocks (Optional):
            </label>
            <input
              type="text"
              value={weakAreas}
              onChange={(e) => setWeakAreas(e.target.value)}
              placeholder="e.g. Chain rule, delta-epsilon proofs, integrals"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70"
            />
          </div>

          {/* Daily Hours */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Hours/Day:
            </label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70 cursor-pointer"
            >
              <option value={1}>1 Hour/day</option>
              <option value={2}>2 Hours/day</option>
              <option value={3}>3 Hours/day</option>
              <option value={4}>4+ Hours/day</option>
            </select>
          </div>

          {/* Current Level */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Starting Proficiency:
            </label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70 cursor-pointer"
            >
              <option value="Beginner">Foundational / Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced / Reviewing</option>
            </select>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <span className="text-slate-500 text-[11px] shrink-0 font-medium">Quick Goals:</span>
            {(sampleGoals[subject] || sampleGoals.Mathematics).map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setGoal(item);
                  handleGenerate(item);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px] transition-colors"
              >
                {item.split(':')[0]}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={!goal.trim() || isLoading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Designing Plan...' : 'Generate Personalized Plan'}</span>
          </button>
        </div>
      </div>

      {/* Plan Display */}
      {plan ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Progress Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Curriculum Roadmap
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-semibold">
                  {targetOutcome}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {plan.title}
              </h3>
              {plan.personalizedAdvice && (
                <p className="text-xs text-indigo-200/90 italic pt-0.5">
                  "{plan.personalizedAdvice}"
                </p>
              )}
              <p className="text-xs text-slate-400">
                Estimated Total Commitment: ~{plan.estimatedHoursTotal} Study Hours • {dailyHours}h/day
              </p>
            </div>

            {/* Progress Gauge & Export buttons */}
            <div className="flex flex-col sm:items-end gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 min-w-[210px]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Syllabus Completion</span>
                  <span className="text-indigo-400 font-bold">{progressPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {completedCount} of {allTasksCount} daily sessions completed
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPlan}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Plan'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3 h-3 text-sky-400" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Core Competencies Pills */}
          {plan.coreCompetencies && plan.coreCompetencies.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Competencies to be Mastered:</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {plan.coreCompetencies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{comp}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Week by Week Schedule */}
          <div className="space-y-3">
            {plan.weeks.map((week) => {
              const isCollapsed = collapsedWeeks[week.weekNumber];
              const weekCompleted = week.days.every(
                (d) => completedTasks[`w${week.weekNumber}-d${d.dayNumber}`]
              );

              return (
                <div
                  key={week.weekNumber}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
                >
                  {/* Week Header */}
                  <div
                    onClick={() => toggleWeekCollapse(week.weekNumber)}
                    className="p-4 bg-slate-900/80 hover:bg-slate-800/40 transition-colors flex items-center justify-between cursor-pointer border-b border-slate-800/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border ${
                        weekCompleted
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      }`}>
                        W{week.weekNumber}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{week.theme}</span>
                          {weekCompleted && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                              Week Completed!
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">{week.weeklyGoal}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        {week.days.length} Study Days
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Day Tasks List */}
                  {!isCollapsed && (
                    <div className="p-3 sm:p-4 space-y-2">
                      {week.days.map((day) => {
                        const taskId = `w${week.weekNumber}-d${day.dayNumber}`;
                        const isDone = !!completedTasks[taskId];

                        return (
                          <div
                            key={day.dayNumber}
                            className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isDone
                                ? 'bg-emerald-950/15 border-emerald-800/30 text-slate-400'
                                : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleTask(taskId)}
                                className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                                )}
                              </button>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    Day {day.dayNumber}: {day.title}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                                    day.taskType === 'quiz'
                                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                                      : day.taskType === 'practice'
                                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                                      : day.taskType === 'review'
                                      ? 'bg-sky-950/60 text-sky-300 border border-sky-800/40'
                                      : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                                  }`}>
                                    {day.taskType}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300">{day.focus}</p>
                                {day.keyAction && (
                                  <p className="text-[11px] text-indigo-300 flex items-center gap-1 pt-0.5">
                                    <span>👉 Action:</span> {day.keyAction}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Time & Action Button */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{day.estimatedMinutes}m</span>
                              </span>

                              {/* Direct Launch to Corresponding Feature */}
                              {day.taskType === 'quiz' && onLaunchQuiz && (
                                <button
                                  onClick={() => onLaunchQuiz(day.focus || day.title)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <HelpCircle className="w-3 h-3" />
                                  <span>Take Quiz</span>
                                </button>
                              )}

                              {day.taskType === 'theory' && onLaunchChat && (
                                <button
                                  onClick={() => onLaunchChat(day.focus || day.title)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <GraduationCap className="w-3 h-3" />
                                  <span>Tutor Deep-Dive</span>
                                </button>
                              )}

                              {day.taskType === 'review' && onLaunchFlashcards && (
                                <button
                                  onClick={() => onLaunchFlashcards(day.focus || day.title)}
                                  className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>Flashcards</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pro Study Tips */}
          {plan.proStudyTips && plan.proStudyTips.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Cognitive Retention Strategies for this Plan:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {plan.proStudyTips.map((tip, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-10 text-center max-w-xl mx-auto my-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Active Study Plan</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Tell EduGenie your subject, learning goal, and timeline above to craft an adaptive, day-by-day roadmap tailored to your strengths and schedule.
          </p>
          <button
            onClick={() => handleGenerate()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample Study Plan</span>
          </button>
        </div>
      )}
    </div>
  );
};
