import React, { useState } from 'react';
import {
  FlaskConical,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Users,
  Copy,
  Check,
  Target,
  FileCheck2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Zap,
  ChevronRight
} from 'lucide-react';
import {
  FeynmanEvaluation,
  AnswerFeedbackResult,
  SubjectCategory,
  GradeLevel
} from '../types';

interface FeynmanLabProps {
  initialTopic?: string;
  subject: SubjectCategory;
  gradeLevel?: GradeLevel;
  onExploreInChat?: (topic: string) => void;
}

export const FeynmanLab: React.FC<FeynmanLabProps> = ({
  initialTopic = '',
  subject,
  gradeLevel = 'College / Undergraduate',
  onExploreInChat,
}) => {
  // Mode switcher: Answer Evaluator vs Feynman Simplifier
  const [activeMode, setActiveMode] = useState<'answer_feedback' | 'feynman_simplifier'>('answer_feedback');

  // Answer Feedback State
  const [questionPrompt, setQuestionPrompt] = useState(
    'Explain how enzymes lower the activation energy of a biochemical reaction and why temperature affects their reaction rate.'
  );
  const [studentAnswer, setStudentAnswer] = useState(
    'Enzymes act as catalysts that speed up reactions by lowering activation energy. They do this by binding substrates at the active site using induced fit. If temperature increases too much, the enzyme gets destroyed or denatured because the bonds break, so reaction rate drops.'
  );
  const [rubricCriteria, setRubricCriteria] = useState('');
  const [feedbackResult, setFeedbackResult] = useState<AnswerFeedbackResult | null>(null);

  // Feynman Simplifier State
  const [topic, setTopic] = useState(initialTopic || 'How Electricity Works');
  const [targetAudience, setTargetAudience] = useState('A curious 10-year-old');
  const [userExplanation, setUserExplanation] = useState(
    'Electricity is like water flowing through pipes, but instead of water, tiny charged particles called electrons are pushed by a pump (a battery or generator) through copper wires to power things like lightbulbs.'
  );
  const [feynmanResult, setFeynmanResult] = useState<FeynmanEvaluation | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sample answer prompts for immediate testing
  const samplePrompts = [
    {
      title: 'Biology: Enzyme Kinetics',
      q: 'Explain how enzymes lower the activation energy of a biochemical reaction and why temperature affects their reaction rate.',
      a: 'Enzymes act as catalysts that speed up reactions by lowering activation energy. They do this by binding substrates at the active site using induced fit. If temperature increases too much, the enzyme gets destroyed or denatured because the bonds break, so reaction rate drops.'
    },
    {
      title: 'Physics: Newton’s Third Law',
      q: 'If a horse pulls a cart, Newton’s 3rd law says the cart pulls back on the horse with an equal and opposite force. Why does the cart accelerate forward instead of remaining stationary?',
      a: 'The forces are equal and opposite, but they act on different objects. The horse pushes on the ground, and the ground pushes the horse forward. The cart moves because the net force on the cart is greater than friction.'
    },
    {
      title: 'Calculus: Fundamental Theorem',
      q: 'State the Fundamental Theorem of Calculus (Part 1 and Part 2) and explain the geometric connection between differentiation and integration.',
      a: 'Part 1 says the derivative of an integral is the original function. Part 2 says the definite integral can be evaluated using the antiderivative F(b) - F(a). Geometrically, integration accumulates area, and differentiation finds the rate at which that area grows.'
    }
  ];

  // Evaluate Student Answer
  const handleEvaluateAnswer = async () => {
    if (!questionPrompt.trim() || !studentAnswer.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/answer-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionPrompt,
          studentAnswer,
          subject,
          gradeLevel,
          rubricOrCriteria: rubricCriteria.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AnswerFeedbackResult = await res.json();
      setFeedbackResult(data);
    } catch (err) {
      console.error(err);
      alert('Could not evaluate answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate Feynman Explanation
  const handleEvaluateFeynman = async () => {
    if (!topic.trim() || !userExplanation.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/feynman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          targetAudience,
          userExplanation,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FeynmanEvaluation = await res.json();
      setFeynmanResult(data);
    } catch (err) {
      console.error(err);
      alert('Could not evaluate explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Banner & Mode Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Answer Evaluator &amp; Feedback Lab</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Diagnostic Feedback
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Submit any homework response, test answer, or concept explanation to receive rigorous rubric feedback, strengths, and areas that need improvement.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMode('answer_feedback')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'answer_feedback'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Answer Feedback
            </button>
            <button
              onClick={() => setActiveMode('feynman_simplifier')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'feynman_simplifier'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Feynman Simplifier
            </button>
          </div>
        </div>

        {/* Quick Sample Prompts Carousel */}
        {activeMode === 'answer_feedback' && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-500 text-[11px] shrink-0 font-medium">Try Sample Question:</span>
            {samplePrompts.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuestionPrompt(item.q);
                  setStudentAnswer(item.a);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px] transition-colors"
              >
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODE 1: ANSWER FEEDBACK & DIAGNOSTICS */}
      {activeMode === 'answer_feedback' && (
        <div className="space-y-4">
          {/* Input Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            {/* Question / Assignment Prompt */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>1. Question / Exam Prompt:</span>
                <span className="text-[10px] text-slate-500 font-normal">What was asked?</span>
              </label>
              <textarea
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                placeholder="Paste the problem statement, essay prompt, or exam question here..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
              />
            </div>

            {/* Student's Answer */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>2. Your Drafted Answer / Solution:</span>
                <span className="text-[10px] text-slate-500 font-normal">What you wrote</span>
              </label>
              <textarea
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Type or paste your complete answer, calculations, or drafted explanation..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70 leading-relaxed font-sans"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Evaluates clarity, correctness, missing steps &amp; common misconceptions
              </span>
              <button
                onClick={handleEvaluateAnswer}
                disabled={!questionPrompt.trim() || !studentAnswer.trim() || isLoading}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Evaluating Answer...' : 'Evaluate & Diagnose'}</span>
              </button>
            </div>
          </div>

          {/* Evaluation Results Card */}
          {feedbackResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl animate-fadeIn">
              {/* Header Score & Verdict */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Diagnostic Evaluation
                    </span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                      feedbackResult.scorePercentage >= 85
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : feedbackResult.scorePercentage >= 70
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    }`}>
                      Grade: {feedbackResult.gradeLetter} ({feedbackResult.scorePercentage}%)
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {feedbackResult.quickVerdict}
                  </p>
                </div>

                {/* Score Circle */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center min-w-[120px]">
                  <div className={`text-2xl font-black ${
                    feedbackResult.scorePercentage >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {feedbackResult.scorePercentage} / 100
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Accuracy</span>
                </div>
              </div>

              {/* Strengths & Areas Needing Improvement Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>What You Got Right (Strengths):</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {feedbackResult.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas Needing Improvement */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Areas That Need Improvement (Gaps):</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {feedbackResult.areasNeedingImprovement.map((area, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Misconceptions Identified & Exact Corrections */}
              {feedbackResult.misconceptionsIdentified && feedbackResult.misconceptionsIdentified.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    <span>Misconceptions &amp; Conceptual Traps Identified:</span>
                  </h4>
                  <div className="space-y-2">
                    {feedbackResult.misconceptionsIdentified.map((mi, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/30 text-xs space-y-1">
                        <span className="font-bold text-rose-300 block">
                          Pitfall: {mi.misconception}
                        </span>
                        <p className="text-slate-300 text-[11px]">
                          <span className="font-semibold text-slate-400">Why it happens: </span>{mi.explanation}
                        </p>
                        <p className="text-emerald-300 text-[11px] font-medium pt-0.5">
                          ✓ <span className="font-semibold">Correct understanding: </span>{mi.correction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exemplary Model Answer */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Exemplary Model Answer (Top-Score Formulation):</span>
                  </h4>
                  <button
                    onClick={() => handleCopyText(feedbackResult.modelAnswer)}
                    className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-serif">
                  {feedbackResult.modelAnswer}
                </div>
              </div>

              {/* Actionable Next Step & Follow-up Challenge */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Immediate Action Step to Lock In Understanding:</span>
                </div>
                <p className="text-slate-200">{feedbackResult.actionableNextStep}</p>

                {feedbackResult.followUpChallenge && (
                  <div className="pt-2 border-t border-indigo-800/50">
                    <span className="font-bold text-indigo-200 block mb-1">
                      🎯 Quick Follow-Up Challenge Question:
                    </span>
                    <p className="text-slate-300 italic">{feedbackResult.followUpChallenge}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setFeedbackResult(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revise &amp; Re-evaluate</span>
                </button>

                {onExploreInChat && (
                  <button
                    onClick={() => onExploreInChat(questionPrompt)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Practice with Socratic Tutor</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: FEYNMAN SIMPLIFIER LAB */}
      {activeMode === 'feynman_simplifier' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Concept to Explain:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How Neural Networks Learn"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Target Audience:
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 cursor-pointer"
              >
                <option value="A curious 10-year-old">A curious 10-year-old</option>
                <option value="A high school student">A high school student</option>
                <option value="An intelligent non-expert adult">An intelligent non-expert adult</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Your Simple Explanation:
              </label>
              <textarea
                value={userExplanation}
                onChange={(e) => setUserExplanation(e.target.value)}
                rows={4}
                placeholder="Explain the concept simply in your own words with zero buzzwords..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 font-sans leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleEvaluateFeynman}
                disabled={!topic.trim() || !userExplanation.trim() || isLoading}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Analyzing Clarity...' : 'Test Simplicity & Jargon'}</span>
              </button>
            </div>
          </div>

          {/* Feynman Result Display */}
          {feynmanResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400">Feynman Evaluation</span>
                  <h3 className="text-lg font-bold text-white">{topic}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400">{feynmanResult.overallGrade}</span>
                  <span className="text-[10px] text-slate-400 block">Grade</span>
                </div>
              </div>

              {/* Jargon Spotter */}
              {feynmanResult.jargonOrBuzzwords && feynmanResult.jargonOrBuzzwords.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-rose-400">Jargon &amp; Buzzword Traps Detected:</h4>
                  <div className="space-y-1.5">
                    {feynmanResult.jargonOrBuzzwords.map((j, i) => (
                      <div key={i} className="text-xs text-slate-300 p-2 rounded-lg bg-slate-900">
                        <span className="font-bold text-rose-300">{j.term}: </span>
                        <span>{j.feedback} </span>
                        <span className="text-emerald-400 font-semibold block pt-0.5">
                          Better: "{j.simpleAlternative}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Polished Master Rewrite */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400">Master Simple Rewrite:</span>
                <p className="text-xs text-slate-200 leading-relaxed">{feynmanResult.polishedFeynmanExplanation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
