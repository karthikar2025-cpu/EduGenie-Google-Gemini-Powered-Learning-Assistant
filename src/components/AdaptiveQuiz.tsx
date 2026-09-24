import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Zap,
  Clock,
  Target,
  Flag,
  FileText,
  Printer,
  BookOpen,
  Filter,
  Check,
  AlertTriangle,
  Play,
  Pause,
  BarChart3,
  Sliders,
  Layers,
  ChevronRight,
  Share2
} from 'lucide-react';
import {
  QuizData,
  QuizQuestion,
  SubjectCategory,
  GradeLevel,
  ExamStyle,
  TestMode,
  PracticeTestDiagnostic,
  DistractorRationale
} from '../types';

interface AdaptiveQuizProps {
  initialTopic?: string;
  subject: SubjectCategory;
  gradeLevel?: GradeLevel;
  onExploreTopicInChat?: (topic: string) => void;
  onLaunchFlashcards?: (topic: string) => void;
}

export const AdaptiveQuiz: React.FC<AdaptiveQuizProps> = ({
  initialTopic = '',
  subject,
  gradeLevel = 'College / Undergraduate',
  onExploreTopicInChat,
  onLaunchFlashcards,
}) => {
  // Test generation configuration
  const [topic, setTopic] = useState(initialTopic || 'Calculus: Fundamental Theorem of Calculus');
  const [testMode, setTestMode] = useState<TestMode>('practice_exam');
  const [examStyle, setExamStyle] = useState<ExamStyle>('standard');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [sourceNotes, setSourceNotes] = useState<string>('');
  const [showSourceInput, setShowSourceInput] = useState<boolean>(false);
  const [timedMode, setTimedMode] = useState<boolean>(true);
  const [customTimeMinutes, setCustomTimeMinutes] = useState<number>(10);
  const [instantFeedback, setInstantFeedback] = useState<boolean>(false);

  // Active Test State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Post-test Diagnostics
  const [diagnostics, setDiagnostics] = useState<PracticeTestDiagnostic | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'missed' | 'flagged'>('all');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Preset libraries categorized by topic
  const sampleQuizzes: Record<string, string[]> = {
    Mathematics: [
      'Calculus: Derivatives & Integrals',
      'Linear Algebra: Eigenvalues & Vector Spaces',
      'Differential Equations: First-Order Separable',
      'Probability: Bayes Theorem & Random Variables'
    ],
    Science: [
      'Physics: Newton’s Laws & Kinetic Energy',
      'Organic Chemistry: SN1 vs SN2 Mechanisms',
      'Genetics: DNA Replication & Transcription',
      'Thermodynamics: Entropy & Carnot Efficiency'
    ],
    ComputerScience: [
      'Data Structures: Balanced Trees & Heaps',
      'Algorithms: Dynamic Programming & Memoization',
      'Computer Systems: Memory Hierarchy & Caching',
      'Networking: TCP/IP 3-Way Handshake'
    ],
    Humanities: [
      'Macroeconomics: Aggregate Demand & Monetary Policy',
      'Cognitive Psychology: Working Memory Models',
      'Philosophy of Mind: Dualism vs Functionalism',
      'World History: Industrial Revolution Causes'
    ]
  };

  // Timer effect
  useEffect(() => {
    if (quizData && !isCompleted && timedMode && !isTimerPaused) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleCompleteExam();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizData, isCompleted, timedMode, isTimerPaused]);

  // Generate Quiz / Practice Test
  const handleGenerate = async (qTopic?: string, overrideCount?: number, overrideMode?: TestMode) => {
    const targetTopic = (qTopic || topic).trim();
    if (!targetTopic && !sourceNotes.trim()) return;

    setIsLoading(true);
    setIsCompleted(false);
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setShowHint({});
    setCurrentIdx(0);
    setDiagnostics(null);

    const countToUse = overrideCount || questionCount;
    const modeToUse = overrideMode || testMode;

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          count: countToUse,
          difficulty,
          mode: modeToUse,
          examStyle,
          sourceText: sourceNotes.trim(),
          subject,
          gradeLevel,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: QuizData = await res.json();
      setQuizData(data);
      if (data.topic) setTopic(data.topic);

      // Setup timer
      const allocatedMinutes = data.recommendedTimeMinutes || customTimeMinutes || (countToUse * 2);
      setSecondsRemaining(allocatedMinutes * 60);
      setElapsedSeconds(0);
      setIsTimerPaused(false);
    } catch (err) {
      console.error(err);
      alert('Could not generate practice test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Option selection
  const handleSelectOption = (optIndex: number) => {
    if (instantFeedback && selectedAnswers[currentIdx] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIndex }));
  };

  // Flag toggle
  const toggleFlagCurrent = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentIdx]: !prev[currentIdx]
    }));
  };

  // Final submission and diagnostics evaluation
  const handleCompleteExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompleted(true);

    if (!quizData) return;

    // Calculate score
    let correctCount = 0;
    const questionSummaries = quizData.questions.map((q, idx) => {
      const userSelected = selectedAnswers[idx];
      const isCorrect = userSelected === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionIndex: idx + 1,
        question: q.question,
        conceptTested: q.conceptTested,
        subtopic: q.subtopic || 'General',
        bloomLevel: q.bloomLevel || 'Understanding',
        userSelected,
        correctIndex: q.correctIndex,
        isCorrect
      };
    });

    // Request AI Diagnostic report
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/quiz/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizTitle: quizData.quizTitle,
          topic: quizData.topic,
          examStyle: quizData.examStyle || examStyle,
          totalQuestions: quizData.questions.length,
          correctCount,
          timeTakenSeconds: elapsedSeconds,
          questionSummaries
        })
      });

      if (res.ok) {
        const diagData = await res.json();
        // Compute subtopic and cognitive performance
        const subtopicMap: Record<string, { correct: number; total: number }> = {};
        const bloomMap: Record<string, { correct: number; total: number }> = {};

        quizData.questions.forEach((q, idx) => {
          const sub = q.subtopic || q.conceptTested || 'Core Concepts';
          if (!subtopicMap[sub]) subtopicMap[sub] = { correct: 0, total: 0 };
          subtopicMap[sub].total++;
          if (selectedAnswers[idx] === q.correctIndex) subtopicMap[sub].correct++;

          const bloom = q.bloomLevel || 'Understanding';
          if (!bloomMap[bloom]) bloomMap[bloom] = { correct: 0, total: 0 };
          bloomMap[bloom].total++;
          if (selectedAnswers[idx] === q.correctIndex) bloomMap[bloom].correct++;
        });

        const subtopicPerformance = Object.entries(subtopicMap).map(([sub, data]) => {
          const pct = Math.round((data.correct / data.total) * 100);
          return {
            subtopic: sub,
            correct: data.correct,
            total: data.total,
            percentage: pct,
            status: pct >= 80 ? ('mastered' as const) : pct >= 50 ? ('progressing' as const) : ('remediation_needed' as const)
          };
        });

        const cognitiveLevelPerformance = Object.entries(bloomMap).map(([lvl, data]) => ({
          level: lvl,
          correct: data.correct,
          total: data.total
        }));

        setDiagnostics({
          overallScore: correctCount,
          totalQuestions: quizData.questions.length,
          percentage: Math.round((correctCount / quizData.questions.length) * 100),
          timeTakenSeconds: elapsedSeconds,
          projectedGradeOrPercentile: diagData.projectedGradeOrPercentile,
          subtopicPerformance,
          cognitiveLevelPerformance,
          misconceptionInsights: diagData.misconceptionInsights || [],
          nextSteps: diagData.nextSteps || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setShowHint({});
    setCurrentIdx(0);
    setIsCompleted(false);
    setDiagnostics(null);
    if (quizData) {
      const allocated = quizData.recommendedTimeMinutes || customTimeMinutes || (quizData.questions.length * 2);
      setSecondsRemaining(allocated * 60);
      setElapsedSeconds(0);
      setIsTimerPaused(false);
    }
  };

  // Score calculations
  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quizData.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correct++;
    });
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

  const score = calculateScore();
  const currentQ: QuizQuestion | undefined = quizData?.questions[currentIdx];
  const hasAnsweredCurrent = selectedAnswers[currentIdx] !== undefined;

  // Format time remaining
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Top Generator / Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Quiz &amp; Practice Test Generator</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Multiple-Choice &amp; Exams
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate diagnostic quizzes, multi-choice problem sets, and simulated timed practice exams with distractor analyses.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setTestMode('practice_exam');
                setInstantFeedback(false);
                setTimedMode(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                testMode === 'practice_exam'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mock Exam
            </button>
            <button
              onClick={() => {
                setTestMode('diagnostic');
                setInstantFeedback(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                testMode === 'diagnostic'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagnostic Quiz
            </button>
            <button
              onClick={() => {
                setTestMode('custom_mcq');
                setInstantFeedback(true);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                testMode === 'custom_mcq'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MCQ Drill
            </button>
          </div>
        </div>

        {/* Input Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1">
          <div className="md:col-span-6 flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic or Exam Goal (e.g. AP Calculus BC, MCAT Bio)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/70"
            />
            <button
              onClick={() => setShowSourceInput(!showSourceInput)}
              className={`px-2.5 py-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                showSourceInput || sourceNotes.trim()
                  ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Generate questions from your own lecture notes or syllabus"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notes</span>
            </button>
          </div>

          <div className="md:col-span-6 flex flex-wrap items-center gap-2">
            {/* Exam Style */}
            <select
              value={examStyle}
              onChange={(e) => setExamStyle(e.target.value as ExamStyle)}
              className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-2 rounded-xl text-xs focus:outline-none cursor-pointer"
            >
              <option value="standard">Standard MCQs</option>
              <option value="ap_collegiate">AP / Collegiate Exam</option>
              <option value="stem_quantitative">STEM Calculations</option>
              <option value="clinical_vignette">Case &amp; Vignettes</option>
            </select>

            {/* Questions Count */}
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-2 rounded-xl text-xs focus:outline-none cursor-pointer"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions (Full Mock)</option>
            </select>

            {/* Difficulty */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-2 rounded-xl text-xs focus:outline-none cursor-pointer"
            >
              <option value="beginner">Foundational</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced / Hard</option>
            </select>

            {/* Generate Action Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={(!topic.trim() && !sourceNotes.trim()) || isLoading}
              className="flex-1 min-w-[120px] py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Generating Test...' : 'Generate Test'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Source Notes Area */}
        {showSourceInput && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Custom Source Text (Lecture Notes / Syllabus / Textbook Excerpt):</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {sourceNotes.length} characters
              </span>
            </div>
            <textarea
              value={sourceNotes}
              onChange={(e) => setSourceNotes(e.target.value)}
              placeholder="Paste lecture notes, study guide summaries, or textbook sections here to generate a tailored test directly from your material..."
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
            />
          </div>
        )}

        {/* Quick Suggested Topics Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-0.5">
          <span className="text-slate-500 text-[11px] shrink-0 font-medium">Quick Presets:</span>
          {(sampleQuizzes[subject] || sampleQuizzes.Mathematics).slice(0, 4).map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setTopic(item);
                handleGenerate(item);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px] transition-colors"
            >
              {item.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE TEST SIMULATOR SCREEN */}
      {quizData && !isCompleted && currentQ ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
          {/* Header Controls: Progress, Jump Matrix, Timer & Flag */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold text-slate-200">
                Q {currentIdx + 1} / {quizData.questions.length}
              </span>
              {currentQ.bloomLevel && (
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 text-[10px] font-semibold">
                  Bloom: {currentQ.bloomLevel}
                </span>
              )}
              {currentQ.subtopic && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px]">
                  {currentQ.subtopic}
                </span>
              )}
            </div>

            {/* Test Navigation & Timer Bar */}
            <div className="flex items-center gap-2">
              {/* Flag Toggle */}
              <button
                onClick={toggleFlagCurrent}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                  flaggedQuestions[currentIdx]
                    ? 'bg-amber-950/50 border-amber-500/60 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Flag question to review before submitting"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[currentIdx] ? 'Flagged' : 'Flag'}</span>
              </button>

              {/* Countdown Timer */}
              {timedMode && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold ${
                    secondsRemaining < 120
                      ? 'bg-rose-950/50 border-rose-500/60 text-rose-300 animate-pulse'
                      : 'bg-slate-950 border-slate-800 text-emerald-400'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(secondsRemaining)}</span>
                  <button
                    onClick={() => setIsTimerPaused(!isTimerPaused)}
                    className="ml-1 text-slate-400 hover:text-white cursor-pointer"
                    title={isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {isTimerPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* Instant Feedback Toggle */}
              <button
                onClick={() => setInstantFeedback(!instantFeedback)}
                className={`text-[11px] px-2 py-1 rounded-lg border cursor-pointer ${
                  instantFeedback
                    ? 'bg-sky-950/40 border-sky-600/40 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
                title="Toggle immediate answers vs mock exam conditions"
              >
                {instantFeedback ? 'Practice Mode' : 'Exam Mode'}
              </button>
            </div>
          </div>

          {/* Question Jump Palette Matrix */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold shrink-0">
              Jump:
            </span>
            {quizData.questions.map((_, idx) => {
              const isAns = selectedAnswers[idx] !== undefined;
              const isFlg = flaggedQuestions[idx];
              const isCurr = currentIdx === idx;

              let btnStyle = 'bg-slate-950 text-slate-400 border-slate-800';
              if (isCurr) {
                btnStyle = 'ring-2 ring-emerald-500 bg-emerald-950/80 text-emerald-200 border-emerald-600 font-bold';
              } else if (isFlg) {
                btnStyle = 'bg-amber-950/60 border-amber-600/60 text-amber-300';
              } else if (isAns) {
                btnStyle = 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center shrink-0 border transition-all cursor-pointer ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Hint Disclosure (In Practice Mode) */}
          {instantFeedback && (
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setShowHint((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }))
                }
                className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 font-medium cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint[currentIdx] ? 'Hide Hint' : 'Need a Hint?'}</span>
              </button>
            </div>
          )}

          {showHint[currentIdx] && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-2 animate-fadeIn">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Socratic Hint: </span>
                <span>{currentQ.hint}</span>
              </div>
            </div>
          )}

          {/* Question Stem */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>
            {currentQ.timeEstimateSeconds && (
              <span className="text-[10px] text-slate-500 block">
                Target solve time: ~{currentQ.timeEstimateSeconds}s
              </span>
            )}
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentIdx] === optIdx;
              const isCorrect = currentQ.correctIndex === optIdx;

              let optionStyle =
                'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800/50';

              if (instantFeedback && hasAnsweredCurrent) {
                if (isCorrect) {
                  optionStyle = 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200 font-semibold';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'border-rose-500/80 bg-rose-950/30 text-rose-200';
                } else {
                  optionStyle = 'border-slate-800/60 bg-slate-950/30 text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                optionStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-100 font-semibold shadow-sm';
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start justify-between gap-3 cursor-pointer ${optionStyle}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800/80 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-snug pt-0.5">{option}</span>
                  </div>

                  {instantFeedback && hasAnsweredCurrent && (
                    <div className="shrink-0 mt-0.5">
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Feedback Rationale Box (If Practice Mode) */}
          {instantFeedback && hasAnsweredCurrent && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-fadeIn ${
                selectedAnswers[currentIdx] === currentQ.correctIndex
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {selectedAnswers[currentIdx] === currentQ.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Correct Answer</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-300">Misconception Identified</span>
                  </>
                )}
              </div>
              <p className="text-slate-300">{currentQ.explanation}</p>

              {/* Option-by-Option Distractor Breakdown */}
              {currentQ.distractorRationales && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="font-bold text-[11px] text-slate-400 block">
                    Distractor Analysis (Why choices are right or wrong):
                  </span>
                  {currentQ.distractorRationales.map((dr, i) => (
                    <div key={i} className="text-[11px] flex items-start gap-1.5 text-slate-400">
                      <span className={`font-mono font-bold ${dr.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {dr.optionLetter}:
                      </span>
                      <span>{dr.rationale}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(prev - 1, 0))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIdx + 1 < quizData.questions.length ? (
                <button
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleCompleteExam}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 animate-pulse"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Submit Practice Exam</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : isCompleted && quizData ? (
        /* COMPREHENSIVE POST-EXAM DIAGNOSTICS & REVIEW SCREEN */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn">
          {/* Header Score Overview */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Practice Exam Complete</h3>
                <p className="text-xs text-slate-400">{quizData.quizTitle || quizData.topic}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Time: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40 font-semibold">
                    {diagnostics?.projectedGradeOrPercentile || 'Predicted: High Mastery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Ring / Score Pill */}
            <div className="text-center sm:text-right bg-slate-950 p-3.5 rounded-2xl border border-slate-800 min-w-[140px]">
              <div className="text-3xl font-black text-emerald-400">
                {score.percentage}%
              </div>
              <p className="text-xs text-slate-300 font-semibold">
                {score.correct} of {score.total} Correct
              </p>
            </div>
          </div>

          {/* Subtopic Mastery Breakdown & Cognitive Level Breakdown */}
          {diagnostics?.subtopicPerformance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Subtopic Mastery Cards */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subtopic Diagnostic Mastery</span>
                </h4>
                <div className="space-y-2">
                  {diagnostics.subtopicPerformance.map((st, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300 font-medium truncate max-w-[200px]">
                          {st.subtopic}
                        </span>
                        <span className={`font-mono font-bold ${
                          st.status === 'mastered' ? 'text-emerald-400' : st.status === 'progressing' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {st.correct}/{st.total} ({st.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            st.status === 'mastered' ? 'bg-emerald-500' : st.status === 'progressing' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${st.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cognitive Bloom Performance */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cognitive Depth (Bloom’s Taxonomy)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {diagnostics.cognitiveLevelPerformance.map((bl, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        {bl.level}
                      </span>
                      <span className="text-sm font-black text-indigo-300">
                        {bl.correct} / {bl.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Root-Cause Misconceptions & AI Remediation */}
          {diagnostics?.misconceptionInsights && diagnostics.misconceptionInsights.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Diagnosed Conceptual Traps &amp; Targeted Remedies</span>
              </h4>
              <div className="space-y-2">
                {diagnostics.misconceptionInsights.map((mi, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs space-y-1">
                    <span className="font-bold text-amber-300 block">
                      Pitfall (Q{mi.questionIndex}): {mi.misconception}
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      💡 <span className="font-semibold text-slate-200">Remedy: </span>{mi.remedy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Review Section with Filter */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Detailed Question Review</span>
              </h4>

              {/* Review Filters */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer ${
                    reviewFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  All ({quizData.questions.length})
                </button>
                <button
                  onClick={() => setReviewFilter('missed')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer ${
                    reviewFilter === 'missed' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  Missed ({quizData.questions.filter((q, i) => selectedAnswers[i] !== q.correctIndex).length})
                </button>
                <button
                  onClick={() => setReviewFilter('flagged')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer ${
                    reviewFilter === 'flagged' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  Flagged ({Object.keys(flaggedQuestions).filter((k) => flaggedQuestions[Number(k)]).length})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {quizData.questions
                .map((q, idx) => ({ q, idx }))
                .filter(({ q, idx }) => {
                  if (reviewFilter === 'missed') return selectedAnswers[idx] !== q.correctIndex;
                  if (reviewFilter === 'flagged') return flaggedQuestions[idx];
                  return true;
                })
                .map(({ q, idx }) => {
                  const userAns = selectedAnswers[idx];
                  const isCorrect = userAns === q.correctIndex;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">Question {idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px] bg-rose-950/40 px-2 py-0.5 rounded">
                              <XCircle className="w-3.5 h-3.5" /> Missed
                            </span>
                          )}
                          {flaggedQuestions[idx] && (
                            <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
                              Flagged
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-200 font-medium text-xs leading-relaxed">{q.question}</p>

                      {/* Options */}
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isOptCorrect = q.correctIndex === oIdx;
                          const wasChosen = userAns === oIdx;

                          let style = 'bg-slate-900 border-slate-800 text-slate-400';
                          if (isOptCorrect) style = 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200 font-bold';
                          else if (wasChosen && !isOptCorrect) style = 'bg-rose-950/40 border-rose-600/60 text-rose-200 line-through';

                          return (
                            <div key={oIdx} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${style}`}>
                              <span>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                {opt}
                              </span>
                              {isOptCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation & Distractor Analysis */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                        <span className="font-bold text-sky-400 block">Explanation:</span>
                        <p>{q.explanation}</p>

                        {q.distractorRationales && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-1">
                            <span className="font-bold text-slate-400 block">Option Breakdown:</span>
                            {q.distractorRationales.map((dr, di) => (
                              <p key={di} className="text-slate-400">
                                <span className={`font-mono font-bold ${dr.isCorrect ? 'text-emerald-400' : 'text-slate-300'}`}>
                                  {dr.optionLetter}:
                                </span>{' '}
                                {dr.rationale}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Action Footer: Printable Sheet, Chat Deep-Dive, Retry */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>

              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Generate clean printable PDF mock test sheet with separate answer key"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Printable Exam Sheet</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onLaunchFlashcards && (
                <button
                  onClick={() => onLaunchFlashcards(quizData.topic)}
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Turn into Flashcards</span>
                </button>
              )}

              {onExploreTopicInChat && (
                <button
                  onClick={() => onExploreTopicInChat(quizData.topic)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Socratic Tutor Remediation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Welcome State */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-10 text-center max-w-xl mx-auto my-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            Ready to Generate Quizzes &amp; Practice Exams
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Choose a topic or paste lecture notes above to create rigorous multiple-choice assessments, timed mock tests, and diagnostic skill reviews.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setTestMode('practice_exam');
                setQuestionCount(5);
                handleGenerate('Calculus: Fundamental Theorem of Calculus', 5, 'practice_exam');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch 5-Question Calculus Practice Exam</span>
            </button>
          </div>
        </div>
      )}

      {/* PRINTABLE EXAM SHEET MODAL */}
      {showPrintModal && quizData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>Printable Practice Exam &amp; Answer Key</span>
                </h3>
                <span className="text-xs text-slate-400">{quizData.quizTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Test Sheet Content */}
            <div className="space-y-6 text-slate-200">
              <div className="border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Student Name: _______________________</span>
                  <span>Date: _______________</span>
                  <span>Score: _____ / {quizData.questions.length}</span>
                </div>
                <h4 className="text-sm font-bold text-white text-center pt-1">
                  SECTION 1: MULTIPLE-CHOICE QUESTIONS
                </h4>
                <p className="text-xs text-slate-400 text-center">
                  Time Allocated: {quizData.recommendedTimeMinutes || 20} Minutes • Answer all {quizData.questions.length} questions.
                </p>
              </div>

              {/* Questions Sheet */}
              <div className="space-y-4">
                {quizData.questions.map((q, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <p className="font-bold text-slate-100">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="text-slate-300">
                          <span className="font-mono font-bold mr-1.5">
                            ({String.fromCharCode(65 + oIdx)})
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Separate Answer Key at bottom */}
              <div className="pt-6 border-t border-dashed border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Teacher / Self-Grading Answer Key &amp; Explanations
                </h4>
                <div className="space-y-2">
                  {quizData.questions.map((q, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="font-bold text-emerald-400 mr-2">
                        Q{idx + 1}: ({String.fromCharCode(65 + q.correctIndex)})
                      </span>
                      <span className="text-slate-300">{q.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
