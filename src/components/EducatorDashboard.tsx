import React, { useState } from 'react';
import {
  GraduationCap,
  HeartHandshake,
  Sparkles,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Send
} from 'lucide-react';
import {
  StudentRecord,
  TeacherInterventionPlan,
  ParentDigestData,
  SubjectCategory
} from '../types';

interface EducatorDashboardProps {
  subject: SubjectCategory;
}

const SAMPLE_STUDENTS: StudentRecord[] = [
  {
    id: 's1',
    name: 'Alex Carter',
    avatar: '🧑‍💻',
    grade: '11th Grade / AP',
    hoursThisWeek: 6.5,
    quizzesTaken: 8,
    avgQuizScore: 88,
    feynmanGrade: 'A',
    status: 'thriving',
    masteredTopics: ['Recursion Base Cases', 'Binary Trees', 'Big-O Notation'],
    strugglingTopics: ['Dynamic Programming Memoization'],
    lastActive: 'Today, 2:15 PM',
  },
  {
    id: 's2',
    name: 'Maya Rodriguez',
    avatar: '👩‍🔬',
    grade: '11th Grade / AP',
    hoursThisWeek: 4.2,
    quizzesTaken: 5,
    avgQuizScore: 68,
    feynmanGrade: 'B-',
    status: 'needs_support',
    masteredTopics: ['Arrays & Iteration', 'Basic Sorting'],
    strugglingTopics: ['Recursion & Call Stacks', 'Dynamic Programming'],
    lastActive: 'Yesterday',
  },
  {
    id: 's3',
    name: 'Jordan Lee',
    avatar: '🧑‍🎓',
    grade: '11th Grade / AP',
    hoursThisWeek: 7.8,
    quizzesTaken: 11,
    avgQuizScore: 94,
    feynmanGrade: 'A+',
    status: 'thriving',
    masteredTopics: ['Graph Traversals', 'Dynamic Programming', 'Heaps & Priority Queues'],
    strugglingTopics: [],
    lastActive: 'Today, 11:30 AM',
  },
  {
    id: 's4',
    name: 'Sofia Chen',
    avatar: '👩‍💻',
    grade: '11th Grade / AP',
    hoursThisWeek: 5.1,
    quizzesTaken: 6,
    avgQuizScore: 78,
    feynmanGrade: 'B+',
    status: 'on_track',
    masteredTopics: ['Stack & Queue ADTs', 'Tree Traversals'],
    strugglingTopics: ['Graph BFS vs DFS'],
    lastActive: 'Today, 9:00 AM',
  },
  {
    id: 's5',
    name: 'Ethan Miller',
    avatar: '🧑‍🔧',
    grade: '11th Grade / AP',
    hoursThisWeek: 2.8,
    quizzesTaken: 3,
    avgQuizScore: 59,
    feynmanGrade: 'C+',
    status: 'needs_support',
    masteredTopics: ['Primitive Types', 'Boolean Logic'],
    strugglingTopics: ['Recursion Base Cases', 'Pointer References', 'Big-O Analysis'],
    lastActive: '3 days ago',
  }
];

export const EducatorDashboard: React.FC<EducatorDashboardProps> = ({ subject }) => {
  const [role, setRole] = useState<'teacher' | 'parent'>('teacher');
  const [selectedClass, setSelectedClass] = useState('AP Computer Science A (Period 3)');
  const [students] = useState<StudentRecord[]>(SAMPLE_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord>(SAMPLE_STUDENTS[0]);

  // AI Intervention state (Teacher)
  const [isGeneratingIntervention, setIsGeneratingIntervention] = useState(false);
  const [interventionPlan, setInterventionPlan] = useState<TeacherInterventionPlan | null>(null);
  const [targetStruggleTopic, setTargetStruggleTopic] = useState('Dynamic Programming & Memoization');

  // AI Parent Digest state (Parent)
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [parentDigest, setParentDigest] = useState<ParentDigestData | null>(null);

  const handleGenerateIntervention = async (topic?: string) => {
    const t = topic || targetStruggleTopic;
    setIsGeneratingIntervention(true);

    try {
      const res = await fetch('/api/teacher-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomSubject: selectedClass,
          strugglingTopic: t,
          studentCountStruggling: 3,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TeacherInterventionPlan = await res.json();
      setInterventionPlan(data);
    } catch (e) {
      console.error(e);
      alert('Could not generate teacher intervention plan.');
    } finally {
      setIsGeneratingIntervention(false);
    }
  };

  const handleGenerateParentDigest = async () => {
    setIsGeneratingDigest(true);

    try {
      const res = await fetch('/api/parent-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          recentTopics: selectedStudent.masteredTopics,
          hoursStudied: selectedStudent.hoursThisWeek,
          streakDays: 6,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ParentDigestData = await res.json();
      setParentDigest(data);
    } catch (e) {
      console.error(e);
      alert('Could not generate parent digest.');
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  // Class analytics
  const classAvgScore = Math.round(
    students.reduce((acc, s) => acc + s.avgQuizScore, 0) / students.length
  );
  const totalHours = students.reduce((acc, s) => acc + s.hoursThisWeek, 0).toFixed(1);
  const atRiskCount = students.filter((s) => s.status === 'needs_support').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Top Banner & Role Toggle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              {role === 'teacher' ? <GraduationCap className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{role === 'teacher' ? 'Educator & Instructional Dashboard' : 'Parent & Family Learning Portal'}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Adaptive Analytics
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {role === 'teacher'
                  ? 'Track cognitive mastery heatmaps, diagnose class-wide misconceptions, and generate AI intervention lesson plans.'
                  : 'Receive celebration milestones, weekly progress summaries, and low-stress dinnertime conversation prompts.'}
              </p>
            </div>
          </div>

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setRole('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                role === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Teacher Mode</span>
            </button>

            <button
              onClick={() => setRole('parent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                role === 'parent'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Parent Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TEACHER MODE VIEW */}
      {/* ========================================================= */}
      {role === 'teacher' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Students</span>
              <div className="text-2xl font-black text-white mt-1">{students.length} Active</div>
              <span className="text-[10px] text-slate-500">100% active this week</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Class Avg Accuracy</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{classAvgScore}%</div>
              <span className="text-[10px] text-emerald-500 font-semibold">+4% vs last week</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Study Time</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">{totalHours} hrs</div>
              <span className="text-[10px] text-slate-500">Across quizzes & chat</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Need Intervention</span>
              <div className="text-2xl font-black text-rose-400 mt-1">{atRiskCount} Students</div>
              <span className="text-[10px] text-rose-400 font-semibold">Flagged for DP & Recursion</span>
            </div>
          </div>

          {/* Cognitive Mastery Heatmap */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-emerald-400" />
                  <span>Cognitive Concept Mastery Matrix (Heatmap)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real-time diagnosis of student comprehension across curriculum standards.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" />
                  <span className="text-slate-300">Mastered (80%+)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/80" />
                  <span className="text-slate-300">In Progress</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500/80" />
                  <span className="text-slate-300">Needs Support</span>
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-2 text-center">Arrays & Logic</th>
                    <th className="py-2.5 px-2 text-center">Recursion Bases</th>
                    <th className="py-2.5 px-2 text-center">Tree Traversals</th>
                    <th className="py-2.5 px-2 text-center">Dynamic Prog</th>
                    <th className="py-2.5 px-2 text-center">Big-O Proofs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                        <span>{st.avatar}</span>
                        <span>{st.name}</span>
                      </td>

                      {/* Mocked Topic Cell Statuses based on student mastery */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-block w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] leading-6">
                          95
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {st.strugglingTopics.includes('Recursion & Call Stacks') ||
                        st.strugglingTopics.includes('Recursion Base Cases') ? (
                          <span className="inline-block w-6 h-6 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[10px] leading-6">
                            45
                          </span>
                        ) : (
                          <span className="inline-block w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] leading-6">
                            88
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-block w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] leading-6">
                          84
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {st.strugglingTopics.includes('Dynamic Programming') ||
                        st.strugglingTopics.includes('Dynamic Programming Memoization') ? (
                          <span className="inline-block w-6 h-6 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[10px] leading-6">
                            52
                          </span>
                        ) : st.masteredTopics.includes('Dynamic Programming') ? (
                          <span className="inline-block w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] leading-6">
                            92
                          </span>
                        ) : (
                          <span className="inline-block w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[10px] leading-6">
                            70
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {st.strugglingTopics.includes('Big-O Analysis') ? (
                          <span className="inline-block w-6 h-6 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-[10px] leading-6">
                            48
                          </span>
                        ) : (
                          <span className="inline-block w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] leading-6">
                            90
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Intervention Generator Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cognitive Misconception Alert</span>
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Class Bottleneck: Dynamic Programming & Overlapping Subproblems
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  3 students are experiencing high friction when identifying state transitions and memoization table structure.
                </p>
              </div>

              <button
                onClick={() => handleGenerateIntervention('Dynamic Programming & Memoization')}
                disabled={isGeneratingIntervention}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingIntervention ? 'Architecting Plan...' : 'Generate AI Intervention Plan'}</span>
              </button>
            </div>

            {/* Generated Plan Details */}
            {interventionPlan && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
                <div className="pb-3 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-rose-400 uppercase">
                    Root Cause Diagnosis
                  </span>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    {interventionPlan.rootCauseAnalysis}
                  </p>
                </div>

                {/* Differentiated Group Activity */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300">
                      20-Min Small Group Breakout: {interventionPlan.differentiatedGroupActivity.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      ~{interventionPlan.differentiatedGroupActivity.durationMinutes} mins
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {interventionPlan.differentiatedGroupActivity.description}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 pt-1">
                    {interventionPlan.differentiatedGroupActivity.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>

                {/* Scaffolded Problems */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300">
                    Targeted Remediation Practice:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {interventionPlan.scaffoldedPracticeProblems.map((prob, i) => (
                      <div key={i} className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <span className="font-semibold text-white block">Problem #{i + 1}: {prob.question}</span>
                        <p className="text-[11px] text-rose-300">
                          <span className="font-bold">Common Trap: </span>{prob.commonMisstep}
                        </p>
                        <p className="text-[11px] text-emerald-300">
                          <span className="font-bold">Coaching Hint: </span>{prob.coachingHint}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 1-on-1 talking points */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-300">Teacher 1-on-1 Conference Talking Points:</span>
                  <ul className="space-y-1 text-slate-400 text-[11px]">
                    {interventionPlan.oneOnOneTalkingPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PARENT MODE VIEW */}
      {/* ========================================================= */}
      {role === 'parent' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Child Selector & Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedStudent.avatar}</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedStudent.name}'s Learning Journey
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedStudent.grade} • Active in {subject}
                  </span>
                </div>
              </div>

              <button
                onClick={handleGenerateParentDigest}
                disabled={isGeneratingDigest}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingDigest ? 'Synthesizing...' : 'Generate Dinner Conversation Prompts'}</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Study Consistency</span>
                <div className="text-2xl font-black text-indigo-400 mt-1">6-Day Streak</div>
                <p className="text-[10px] text-slate-500">{selectedStudent.hoursThisWeek} hours logged this week</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Mastery Achievements</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">3 Concepts</div>
                <p className="text-[10px] text-slate-500">Passed diagnostic assessments</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Feynman Clarity Score</span>
                <div className="text-2xl font-black text-amber-400 mt-1">Grade {selectedStudent.feynmanGrade}</div>
                <p className="text-[10px] text-slate-500">Explains concepts simply in plain words</p>
              </div>
            </div>

            {/* Mastered vs Focusing Topics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Skills Mastered This Week:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.masteredTopics.map((top, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                      {top}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Currently Exploring & Refining:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.strugglingTopics.map((top, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/40">
                      {top}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Parent Digest & Dinner Prompts */}
          {parentDigest && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Weekly Family Digest
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  What {parentDigest.studentName} Learned (Jargon-Free Summary)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {parentDigest.celebrationSummary}
                </p>
              </div>

              {/* Dinner Prompts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>3 Stress-Free Dinner Conversation Starters:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {parentDigest.dinnerConversationPrompts.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                      <span className="text-[10px] font-bold text-amber-400 block uppercase">
                        Prompt #{idx + 1}
                      </span>
                      <p className="font-semibold text-slate-200 text-xs leading-snug">
                        "{item.prompt}"
                      </p>
                      <p className="text-[10px] text-slate-400 pt-1">
                        <span className="font-semibold text-slate-300">Context: </span>
                        {item.context}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Encouragement Tip */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-300">Growth Mindset Parenting Tip: </span>
                  <span>{parentDigest.encouragementTip}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
