import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Zap,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  StepSolverResult,
  ConceptExplainerResult,
  SubjectCategory,
  GradeLevel
} from '../types';

interface StepSolverProps {
  subject: SubjectCategory;
  gradeLevel?: GradeLevel;
  onExploreInChat?: (topic: string) => void;
  onLaunchQuiz?: (topic: string) => void;
}

export const StepSolver: React.FC<StepSolverProps> = ({
  subject,
  gradeLevel = 'College / Undergraduate',
  onExploreInChat,
  onLaunchQuiz,
}) => {
  // Mode switcher: Concept Explainer vs Problem Solver
  const [activeMode, setActiveMode] = useState<'concept_explainer' | 'problem_solver'>('concept_explainer');

  // Concept Explainer State
  const [conceptInput, setConceptInput] = useState('Special Relativity: Time Dilation & The Twin Paradox');
  const [conceptResult, setConceptResult] = useState<ConceptExplainerResult | null>(null);
  const [revealedSelfChecks, setRevealedSelfChecks] = useState<Record<number, boolean>>({});

  // Problem Solver State
  const [problem, setProblem] = useState(
    'A ball is thrown upward with an initial velocity of 20 m/s from a 10m high platform. Ignoring air resistance (g = 9.8 m/s^2), find the maximum height reached and the total time until it hits the ground.'
  );
  const [problemResult, setProblemResult] = useState<StepSolverResult | null>(null);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [showFullSolution, setShowFullSolution] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Sample Difficult Concepts across disciplines
  const sampleConcepts = [
    {
      title: 'Special Relativity: Time Dilation',
      concept: 'Special Relativity: Why time slows down as velocity approaches the speed of light (and the Twin Paradox)'
    },
    {
      title: 'Neural Networks: Backpropagation',
      concept: 'Deep Learning Backpropagation: How the chain rule calculates gradient vectors to update network weights'
    },
    {
      title: 'Genetics: CRISPR-Cas9',
      concept: 'CRISPR-Cas9 Mechanism: How guide RNA targets genomic loci and Cas9 endonuclease causes double-strand breaks'
    },
    {
      title: 'Probability: Bayes’ Theorem',
      concept: 'Bayes’ Theorem: How prior probability updates with new diagnostic evidence (and the Base Rate Fallacy)'
    },
    {
      title: 'Macroeconomics: Liquidity Trap',
      concept: 'The Keynesian Liquidity Trap: Why zero nominal interest rates render conventional monetary expansion ineffective'
    }
  ];

  // Sample STEM Problems
  const sampleProblems = [
    {
      title: 'Kinematics Projectile',
      text: 'A ball is thrown upward with an initial velocity of 20 m/s from a 10m high platform. Ignoring air resistance (g = 9.8 m/s^2), find the maximum height reached and the total time until it hits the ground.'
    },
    {
      title: 'Calculus: Integration by Parts',
      text: 'Evaluate the definite integral of x * e^(2x) dx from x = 0 to x = 1.'
    },
    {
      title: 'Algorithms: Recurrence Relation',
      text: 'Find the asymptotic time complexity of T(n) = 2T(n/2) + O(n log n) using the Master Theorem.'
    },
    {
      title: 'Chemistry: Buffer pH Calculation',
      text: 'Calculate the pH of a solution containing 0.20 M acetic acid (CH3COOH, Ka = 1.8e-5) and 0.30 M sodium acetate.'
    }
  ];

  // Handle Explaining Concept Step-by-Step
  const handleExplainConcept = async (customConcept?: string) => {
    const target = (customConcept || conceptInput).trim();
    if (!target || isLoading) return;

    setIsLoading(true);
    setRevealedSelfChecks({});

    try {
      const res = await fetch('/api/concept-explainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: target,
          subject,
          gradeLevel,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ConceptExplainerResult = await res.json();
      setConceptResult(data);
    } catch (err) {
      console.error(err);
      alert('Could not explain concept. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Solving Problem
  const handleSolveProblem = async (customProblem?: string) => {
    const p = (customProblem || problem).trim();
    if (!p || isLoading) return;

    setIsLoading(true);
    setRevealedHints([]);
    setShowFullSolution(false);

    try {
      const res = await fetch('/api/step-solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: p,
          subject,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StepSolverResult = await res.json();
      setProblemResult(data);
    } catch (err) {
      console.error(err);
      alert('Could not solve problem. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHint = (level: number) => {
    setRevealedHints((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleSelfCheck = (idx: number) => {
    setRevealedSelfChecks((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Step-by-Step Concept &amp; Problem Explainer</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Scaffolded Learning
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Break down intimidating, complex academic concepts and difficult STEM problems into progressive, easy-to-grasp steps.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setActiveMode('concept_explainer')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'concept_explainer'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Explain Difficult Concept
            </button>
            <button
              onClick={() => setActiveMode('problem_solver')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeMode === 'problem_solver'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scaffolded Problem Solver
            </button>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-500 text-[11px] shrink-0 font-medium">Try Challenge:</span>
          {activeMode === 'concept_explainer' ? (
            sampleConcepts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setConceptInput(item.concept);
                  handleExplainConcept(item.concept);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] shrink-0 cursor-pointer transition-colors"
              >
                {item.title}
              </button>
            ))
          ) : (
            sampleProblems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProblem(item.text);
                  handleSolveProblem(item.text);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] shrink-0 cursor-pointer transition-colors"
              >
                {item.title}
              </button>
            ))
          )}
        </div>
      </div>

      {/* MODE 1: CONCEPT EXPLAINER */}
      {activeMode === 'concept_explainer' && (
        <div className="space-y-4">
          {/* Input Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Enter any difficult or counterintuitive concept you want broken down:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                placeholder="e.g. Quantum Superposition, Eigenvalues, Le Chatelier's Principle, Backpropagation..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/70"
              />
              <button
                onClick={() => handleExplainConcept()}
                disabled={!conceptInput.trim() || isLoading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-600/30 transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Explaining Step-by-Step...' : 'Explain Step-by-Step'}</span>
              </button>
            </div>
          </div>

          {/* Concept Explainer Output */}
          {conceptResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Step-by-Step Concept Breakdown
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-semibold">
                      {conceptResult.difficultyLevel} Level
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{conceptResult.conceptName}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                    {conceptResult.coreIntuitionSummary}
                  </p>
                </div>
              </div>

              {/* Intuitive Everyday Analogy */}
              <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-2xl p-4 space-y-1.5">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  <span>The Grounding Everyday Metaphor:</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic font-serif">
                  "{conceptResult.intuitiveMetaphor}"
                </p>
              </div>

              {/* Chronological Progressive Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Progressive Step-by-Step Walkthrough:
                </h4>

                <div className="space-y-3">
                  {conceptResult.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {step.stepNumber}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white">{step.stageTitle}</h5>
                          <span className="text-[10px] text-cyan-400 font-medium block">
                            {step.subtitle}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans pl-8.5">
                        {step.explanation}
                      </p>

                      {step.keyRuleOrFormula && (
                        <div className="ml-8.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-200">
                          <span className="text-[10px] text-slate-400 font-sans block mb-0.5 font-bold uppercase">
                            Core Rule / Equation:
                          </span>
                          {step.keyRuleOrFormula}
                        </div>
                      )}

                      {step.pitfallToAvoid && (
                        <div className="ml-8.5 p-2 rounded-xl bg-rose-950/20 border border-rose-800/30 text-[11px] text-rose-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span><strong>Watch out: </strong>{step.pitfallToAvoid}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Real World Scenario */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Real-World Scenario / Applied Demonstration:</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {conceptResult.realWorldScenario}
                </p>
              </div>

              {/* Common Misconceptions */}
              {conceptResult.commonMisconceptions.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Why People Often Get Confused (Common Misconceptions):</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {conceptResult.commonMisconceptions.map((misc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{misc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Self-Check Questions */}
              {conceptResult.selfCheckQuestions.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>Interactive Self-Check: Test Your Understanding</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Click to reveal answers</span>
                  </div>

                  <div className="space-y-2.5">
                    {conceptResult.selfCheckQuestions.map((sc, i) => {
                      const isRevealed = revealedSelfChecks[i];
                      return (
                        <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-white">
                              Q{i + 1}: {sc.question}
                            </span>
                            <button
                              onClick={() => toggleSelfCheck(i)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer shrink-0"
                            >
                              {isRevealed ? 'Hide Answer' : 'Check Answer'}
                            </button>
                          </div>

                          {isRevealed && (
                            <div className="pt-2 border-t border-slate-800 text-xs space-y-1 text-emerald-300 animate-fadeIn">
                              <span className="font-bold block">✓ Answer: {sc.answer}</span>
                              <p className="text-slate-400 text-[11px]">{sc.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Final Mastery Takeaway */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-300 block mb-0.5">Mastery Takeaway:</span>
                  <p className="text-slate-200">{conceptResult.masteryTakeaway}</p>
                </div>
              </div>

              {/* Footer Connectors */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setConceptResult(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Explain Another Concept</span>
                </button>

                <div className="flex items-center gap-2">
                  {onExploreInChat && (
                    <button
                      onClick={() => onExploreInChat(conceptResult.conceptName)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask Socratic Tutor</span>
                    </button>
                  )}

                  {onLaunchQuiz && (
                    <button
                      onClick={() => onLaunchQuiz(conceptResult.conceptName)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Take Practice Quiz</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: SCAFFOLDED PROBLEM SOLVER */}
      {activeMode === 'problem_solver' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Enter problem statement to scaffold with hints:
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
              placeholder="Paste mathematical, physical, or algorithmic problem here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/70 leading-relaxed font-sans"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleSolveProblem()}
                disabled={!problem.trim() || isLoading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Scaffolding Solution...' : 'Scaffold Problem'}</span>
              </button>
            </div>
          </div>

          {problemResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl animate-fadeIn">
              <div className="space-y-1 pb-3 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Problem Summary</span>
                <h3 className="text-base font-bold text-white">{problemResult.problemSummary}</h3>
              </div>

              {/* Hint Ladder */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  <span>Cognitive Hint Ladder (Try solving without checking step 3!):</span>
                </span>
                <div className="space-y-2">
                  {problemResult.hints.map((hint) => {
                    const isRevealed = revealedHints.includes(hint.level);
                    return (
                      <div
                        key={hint.level}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">
                            Hint {hint.level}: {hint.title}
                          </span>
                          <button
                            onClick={() => toggleHint(hint.level)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                          >
                            {isRevealed ? 'Hide Hint' : 'Reveal Hint'}
                          </button>
                        </div>
                        {isRevealed && (
                          <p className="text-amber-300 text-[11px] leading-relaxed pt-1 border-t border-slate-800 animate-fadeIn">
                            {hint.hintText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reveal Full Solution Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowFullSolution(!showFullSolution)}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{showFullSolution ? 'Hide Complete Step-by-Step Derivation' : 'View Complete Step-by-Step Derivation'}</span>
                  {showFullSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Full Steps */}
              {showFullSolution && (
                <div className="space-y-3 animate-fadeIn">
                  {problemResult.steps.map((st) => (
                    <div
                      key={st.stepNumber}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center">
                          {st.stepNumber}
                        </span>
                        <h4 className="text-xs font-bold text-white">{st.heading}</h4>
                      </div>
                      <p className="text-xs text-slate-300">{st.explanation}</p>
                      {st.mathOrCode && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-200">
                          {st.mathOrCode}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                    <span className="text-xs font-bold text-emerald-400">Final Answer:</span>
                    <p className="text-sm font-bold text-white font-mono">{problemResult.finalAnswer}</p>
                    <p className="text-[11px] text-slate-400 pt-1">
                      <strong>Verification Check: </strong>{problemResult.verificationCheck}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
