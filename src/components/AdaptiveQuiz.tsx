import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Award,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { QuizData, QuizQuestion, SubjectCategory } from '../types';

interface AdaptiveQuizProps {
  initialTopic?: string;
  subject: SubjectCategory;
  onExploreTopicInChat?: (topic: string) => void;
}

export const AdaptiveQuiz: React.FC<AdaptiveQuizProps> = ({
  initialTopic = '',
  subject,
  onExploreTopicInChat,
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Calculus: Fundamental Theorem of Calculus');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const sampleQuizzes = [
    'Calculus: Derivatives & Integrals',
    'Computer Science: Asymptotic Analysis & Big-O',
    'Physics: Newton’s Laws & Kinetic Energy',
    'Genetics: DNA Replication & Transcription',
    'Macroeconomics: Aggregate Demand & Supply'
  ];

  const handleGenerate = async (qTopic?: string) => {
    const target = (qTopic || topic).trim();
    if (!target || isLoading) return;

    setIsLoading(true);
    setIsCompleted(false);
    setSelectedAnswers({});
    setShowHint({});
    setCurrentIdx(0);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: target,
          count: questionCount,
          difficulty,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: QuizData = await res.json();
      setQuizData(data);
      setTopic(data.topic || target);
    } catch (err) {
      console.error(err);
      alert('Could not generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentQ: QuizQuestion | undefined = quizData?.questions[currentIdx];
  const hasAnsweredCurrent = selectedAnswers[currentIdx] !== undefined;

  const handleSelectOption = (optIndex: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIndex }));
  };

  const handleNext = () => {
    if (!quizData) return;
    if (currentIdx + 1 < quizData.questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setShowHint({});
    setCurrentIdx(0);
    setIsCompleted(false);
  };

  // Score calculations
  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quizData.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

  const score = calculateScore();

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Adaptive Knowledge Quiz</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Concept Diagnosis
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Diagnostic test questions with detailed rationales and common distractor breakdowns.
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic to test (e.g. 'Thermodynamics Entropy')..."
            className="flex-1 min-w-[240px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/70"
          />

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Difficulty:</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="beginner" className="bg-slate-900">Foundational</option>
              <option value="intermediate" className="bg-slate-900">Intermediate</option>
              <option value="advanced" className="bg-slate-900">Advanced / Olympiad</option>
            </select>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={!topic.trim() || isLoading}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Generating Questions...' : 'Start Quiz'}</span>
          </button>
        </div>

        {/* Quick Topics */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] shrink-0">Popular:</span>
          {sampleQuizzes.slice(0, 3).map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setTopic(item);
                handleGenerate(item);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px]"
            >
              {item.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Screen */}
      {quizData && !isCompleted && currentQ ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 font-medium text-slate-300">
                Question {currentIdx + 1} of {quizData.questions.length}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[11px]">
                {currentQ.conceptTested}
              </span>
            </div>

            {/* Hint toggle */}
            {!hasAnsweredCurrent && (
              <button
                onClick={() =>
                  setShowHint((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }))
                }
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint[currentIdx] ? 'Hide Hint' : 'Need a Hint?'}</span>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${((currentIdx + 1) / quizData.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Hint Card if revealed */}
          {showHint[currentIdx] && !hasAnsweredCurrent && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-2 animate-fadeIn">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Hint: </span>
                <span>{currentQ.hint}</span>
              </div>
            </div>
          )}

          {/* Question Text */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = selectedAnswers[currentIdx] === optIdx;
              const isCorrect = currentQ.correctIndex === optIdx;

              let optionStyle =
                'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800/50';

              if (hasAnsweredCurrent) {
                if (isCorrect) {
                  optionStyle = 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200 font-semibold';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'border-rose-500/80 bg-rose-950/30 text-rose-200 line-through';
                } else {
                  optionStyle = 'border-slate-800/60 bg-slate-950/30 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={hasAnsweredCurrent}
                  className={`w-full p-4 rounded-2xl border text-left text-sm transition-all flex items-start justify-between gap-3 ${optionStyle} ${
                    !hasAnsweredCurrent ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800/80 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {hasAnsweredCurrent && (
                    <div className="shrink-0 mt-0.5">
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Rationale Box (Revealed after answering) */}
          {hasAnsweredCurrent && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                selectedAnswers[currentIdx] === currentQ.correctIndex
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {selectedAnswers[currentIdx] === currentQ.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Spot on! Accurate reasoning.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-300">Common Pitfall Identified:</span>
                  </>
                )}
              </div>
              <p className="text-slate-300">{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {hasAnsweredCurrent && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30 transition-all"
              >
                <span>
                  {currentIdx + 1 < quizData.questions.length ? 'Next Question' : 'View Results'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : isCompleted ? (
        /* Results Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
            <p className="text-xs text-slate-400 mt-1">Topic: {quizData?.topic}</p>
          </div>

          {/* Score Indicator */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 max-w-sm mx-auto">
            <div className="text-4xl font-black text-emerald-400 mb-1">
              {score.percentage}%
            </div>
            <p className="text-xs text-slate-300 font-medium">
              You answered {score.correct} out of {score.total} questions correctly.
            </p>
          </div>

          {/* Review of Missed Questions */}
          {quizData && quizData.questions.some((q, i) => selectedAnswers[i] !== q.correctIndex) && (
            <div className="text-left bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-3">
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>Areas to Review:</span>
              </h4>
              {quizData.questions.map((q, idx) => {
                if (selectedAnswers[idx] === q.correctIndex) return null;
                return (
                  <div key={idx} className="border-b border-slate-800/80 pb-2.5 last:border-0 last:pb-0">
                    <p className="font-semibold text-slate-200">
                      Q{idx + 1}: {q.question}
                    </p>
                    <p className="text-emerald-400 text-[11px] mt-1">
                      Correct Answer: {q.options[q.correctIndex]}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{q.explanation}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry This Quiz</span>
            </button>

            {onExploreTopicInChat && quizData && (
              <button
                onClick={() => onExploreTopicInChat(quizData.topic)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Deep-Dive with Socratic Tutor</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Quiz</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Generate an adaptive diagnostic quiz to identify misconceptions and solidify your conceptual foundation.
          </p>
          <button
            onClick={() => handleGenerate('Calculus: Fundamental Theorem of Calculus')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample Calculus Quiz</span>
          </button>
        </div>
      )}
    </div>
  );
};
