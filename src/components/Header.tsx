import React from 'react';
import {
  Sparkles,
  GraduationCap,
  BrainCircuit,
  Layers,
  HelpCircle,
  FlaskConical,
  Calculator,
  CalendarCheck,
  FileSpreadsheet,
  Volume2,
  VolumeX,
  Flame,
  Compass,
  Users,
  HeartHandshake,
  Eye
} from 'lucide-react';
import { GradeLevel, SubjectCategory } from '../types';
import { stopSpeaking } from '../utils/speech';

export type ActiveTab =
  | 'chat'
  | 'docvision'
  | 'pathways'
  | 'mindmap'
  | 'flashcards'
  | 'quiz'
  | 'feynman'
  | 'solver'
  | 'planner'
  | 'notes'
  | 'group'
  | 'dashboard';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedSubject: SubjectCategory;
  setSelectedSubject: (subject: SubjectCategory) => void;
  gradeLevel: GradeLevel;
  setGradeLevel: (level: GradeLevel) => void;
  isAudioPlaying: boolean;
  setIsAudioPlaying: (playing: boolean) => void;
  streakCount: number;
}

export const SUBJECTS: SubjectCategory[] = [
  'Computer Science & AI',
  'Calculus & Mathematics',
  'Physics & Engineering',
  'Chemistry & Biology',
  'Economics & Finance',
  'History & Philosophy',
  'General Learning'
];

export const GRADE_LEVELS: GradeLevel[] = [
  'Middle School',
  'High School / AP',
  'College / Undergraduate',
  'Graduate / Professional',
  'Lifelong Curious Learner'
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedSubject,
  setSelectedSubject,
  gradeLevel,
  setGradeLevel,
  isAudioPlaying,
  setIsAudioPlaying,
  streakCount
}) => {
  const tabs = [
    { id: 'chat', label: 'Socratic Tutor', icon: GraduationCap, badge: 'Conversational' },
    { id: 'docvision', label: 'Study Materials & Q&A', icon: Eye, badge: 'Upload & Ask' },
    { id: 'planner', label: 'Personalized Study Plan', icon: CalendarCheck, badge: 'Goals & Roadmap' },
    { id: 'feynman', label: 'Answer Evaluator', icon: FlaskConical, badge: 'Feedback & Diagnosis' },
    { id: 'quiz', label: 'Quiz & Practice Tests', icon: HelpCircle, badge: 'MCQs & Exams' },
    { id: 'pathways', label: 'Adaptive Pathways', icon: Compass, badge: 'Personalized' },
    { id: 'group', label: 'Group Study', icon: Users, badge: 'Live Sync' },
    { id: 'mindmap', label: 'Concept Mindmap', icon: BrainCircuit, badge: 'Interactive' },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, badge: 'Active Recall' },
    { id: 'solver', label: 'Step-by-Step Explainer', icon: Calculator, badge: 'Concepts & Problems' },
    { id: 'notes', label: 'Concise Notes Synthesizer', icon: FileSpreadsheet, badge: 'Summarize Materials' },
    { id: 'dashboard', label: 'Teacher / Parent', icon: HeartHandshake, badge: 'Analytics' },
  ] as const;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">EduGenie</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Active Learning Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Intelligent Learning & Socratic Mastery Companion</p>
          </div>
        </div>

        {/* Global Selectors & Streak */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as SubjectCategory)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Level Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Level:</span>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {GRADE_LEVELS.map((l) => (
                <option key={l} value={l} className="bg-slate-900 text-slate-200">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Stop Button if speaking */}
          {isAudioPlaying && (
            <button
              onClick={() => {
                stopSpeaking();
                setIsAudioPlaying(false);
              }}
              title="Stop voice read-aloud"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-medium animate-pulse cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Voice</span>
            </button>
          )}

          {/* Study Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-bounce" />
            <span>{streakCount} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
