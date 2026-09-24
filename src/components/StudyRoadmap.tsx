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
  ChevronUp
} from 'lucide-react';
import { StudyPlanData, SubjectCategory, GradeLevel } from '../types';

interface StudyRoadmapProps {
  subject: SubjectCategory;
  gradeLevel: GradeLevel;
}

export const StudyRoadmap: React.FC<StudyRoadmapProps> = ({
  subject,
  gradeLevel,
}) => {
  const [goal, setGoal] = useState('Master Dynamic Programming & Graph Algorithms');
  const [durationWeeks, setDurationWeeks] = useState(3);
  const [dailyHours, setDailyHours] = useState(2);
  const [currentLevel, setCurrentLevel] = useState('Beginner');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

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
          durationWeeks,
          dailyHours,
          currentLevel,
          subject,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StudyPlanData = await res.json();
      setPlan(data);
      setGoal(data.title || targetGoal);
    } catch (err) {
      console.error(err);
      alert('Could not generate study roadmap. Please try again.');
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

  const sampleGoals = [
    'Master Dynamic Programming & Graph Algorithms',
    'Calculus III: Multivariable & Vector Calculus Exam Prep',
    'Deep Learning: Transformers & Diffusion Models',
    'Organic Chemistry: Reaction Mechanisms & Synthesis',
    'Microeconomics: Game Theory & General Equilibrium'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Adaptive Curriculum & Milestone Architect</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Milestone Roadmap
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalized day-by-day learning schedule with interleaving, spaced reviews, and milestone checkpoints.
            </p>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Learning Target / Exam Goal:
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Master Linear Algebra for Machine Learning"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Timeline:
            </label>
            <select
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/70 cursor-pointer"
            >
              <option value={1}>1 Week (Sprint)</option>
              <option value={2}>2 Weeks</option>
              <option value={3}>3 Weeks</option>
              <option value={4}>4 Weeks (1 Month)</option>
              <option value={6}>6 Weeks</option>
              <option value={8}>8 Weeks (Intensive)</option>
            </select>
          </div>

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
        </div>

        {/* Generate Button & Quick chips */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <span className="text-slate-500 text-[11px] shrink-0">Popular:</span>
            {sampleGoals.slice(0, 3).map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setGoal(item);
                  handleGenerate(item);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2 py-0.5 shrink-0 cursor-pointer text-[11px]"
              >
                {item.split('&')[0]}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={!goal.trim() || isLoading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Designing Curriculum...' : 'Generate Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* Plan Display */}
      {plan ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Overall Progress */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Curriculum Blueprint
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {plan.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Estimated Total Commitment: ~{plan.estimatedHoursTotal} Study Hours
              </p>
            </div>

            {/* Progress Gauge */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 shrink-0 min-w-[200px]">
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
          </div>

          {/* Core Competencies Pills */}
          {plan.coreCompetencies && plan.coreCompetencies.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Competencies to be Mastered:</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {plan.coreCompetencies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-800/50"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weeks Accordion */}
          <div className="space-y-4">
            {plan.weeks.map((week) => (
              <div
                key={week.weekNumber}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      W{week.weekNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {week.theme}
                      </h4>
                      <p className="text-xs text-slate-400">{week.weeklyGoal}</p>
                    </div>
                  </div>
                </div>

                {/* Days Checklist */}
                <div className="space-y-2">
                  {week.days.map((day) => {
                    const taskId = `w${week.weekNumber}-d${day.dayNumber}`;
                    const isDone = Boolean(completedTasks[taskId]);

                    return (
                      <div
                        key={day.dayNumber}
                        onClick={() => toggleTask(taskId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400'
                            : 'bg-slate-950/80 border-slate-800 hover:border-indigo-500/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="mt-0.5 text-slate-500 shrink-0 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 hover:text-indigo-400 transition-colors" />
                            )}
                          </button>
                          <div>
                            <span
                              className={`text-xs font-semibold block ${
                                isDone ? 'line-through text-slate-500' : 'text-slate-200'
                              }`}
                            >
                              Day {day.dayNumber}: {day.title}
                            </span>
                            <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                              {day.focus}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{day.estimatedMinutes}m</span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono capitalize ${
                              day.taskType === 'quiz'
                                ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                                : day.taskType === 'practice'
                                ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {day.taskType}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Study Strategy Tips */}
          {plan.proStudyTips && plan.proStudyTips.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4" />
                <span>Cognitive Retention Strategies for this Plan:</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {plan.proStudyTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2"
                  >
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Study Plan</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Enter your target exam or curriculum goal above to generate a customized day-by-day roadmap with checkbox tracking.
          </p>
          <button
            onClick={() => handleGenerate('Master Dynamic Programming & Graph Algorithms')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample 3-Week Algorithms Plan</span>
          </button>
        </div>
      )}
    </div>
  );
};
