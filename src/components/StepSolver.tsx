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
  ShieldCheck
} from 'lucide-react';
import { StepSolverResult, SubjectCategory } from '../types';

interface StepSolverProps {
  subject: SubjectCategory;
}

export const StepSolver: React.FC<StepSolverProps> = ({ subject }) => {
  const [problem, setProblem] = useState(
    'A ball is thrown upward with an initial velocity of 20 m/s from a 10m high platform. Ignoring air resistance (g = 9.8 m/s^2), find the maximum height reached and the total time until it hits the ground.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StepSolverResult | null>(null);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [showFullSolution, setShowFullSolution] = useState(false);

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
      title: 'Algorithmic Complexity',
      text: 'Find the time complexity and solve the recurrence relation T(n) = 2T(n/2) + O(n log n) using Master Theorem or recursion tree.'
    },
    {
      title: 'Chemistry Equilibrium',
      text: 'Calculate the pH of a 0.15 M solution of acetic acid (CH3COOH) given Ka = 1.8 x 10^-5.'
    }
  ];

  const handleSolve = async (customProblem?: string) => {
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
      setResult(data);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Intro Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Scaffolded Problem Solver & Hint Ladder</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Cognitive Scaffolding
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Don't spoil the answer immediately. Use progressive hints (Intuition → Formula → Execution) to solve it yourself!
            </p>
          </div>
        </div>

        {/* Preset Problem chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] shrink-0">Examples:</span>
          {sampleProblems.map((sp, i) => (
            <button
              key={i}
              onClick={() => {
                setProblem(sp.text);
                handleSolve(sp.text);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px]"
            >
              {sp.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Problem Formulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <label className="block text-xs font-semibold text-slate-300">
          Enter Your Problem Statement or Exercise:
        </label>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Paste or write any math, physics, engineering, or coding problem..."
          rows={3}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/70 resize-none font-mono"
        />

        <div className="flex justify-end">
          <button
            onClick={() => handleSolve()}
            disabled={!problem.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Scaffolding Problem...' : 'Scaffold Problem'}</span>
          </button>
        </div>
      </div>

      {/* Scaffolding Container */}
      {result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Problem Focus
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                {result.category}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {result.problemSummary}
            </p>
          </div>

          {/* Progressive Hint Ladder */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Progressive Hint Ladder (Scaffolding)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Reveal only as much as you need
              </span>
            </div>

            <div className="space-y-2">
              {result.hints.map((hint) => {
                const isRevealed = revealedHints.includes(hint.level);
                return (
                  <div
                    key={hint.level}
                    className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 transition-all"
                  >
                    <button
                      onClick={() => toggleHint(hint.level)}
                      className="w-full p-3 text-left flex items-center justify-between text-xs font-semibold hover:bg-slate-900/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">
                          {hint.level}
                        </span>
                        <span className="text-slate-200">
                          Hint {hint.level}: {hint.title}
                        </span>
                      </div>
                      {isRevealed ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isRevealed && (
                      <div className="p-3.5 border-t border-slate-800 text-xs text-amber-200/90 leading-relaxed bg-amber-950/10">
                        {hint.hintText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solution Reveal Toggle */}
          <div className="text-center pt-2">
            <button
              onClick={() => setShowFullSolution(!showFullSolution)}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all border border-slate-700"
            >
              <span>{showFullSolution ? 'Hide Full Step-by-Step Solution' : 'Ready? Reveal Complete Step-by-Step Solution'}</span>
              {showFullSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Full Steps Container */}
          {showFullSolution && (
            <div className="space-y-3 animate-fadeIn">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 px-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Step-by-Step Mathematical & Logical Deduction</span>
              </h3>

              {result.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      {step.stepNumber}
                    </span>
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      {step.heading}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    {step.action}
                  </p>

                  {step.mathOrCode && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                      {step.mathOrCode}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    <span className="font-semibold text-slate-300">Why this step: </span>
                    {step.explanation}
                  </p>
                </div>
              ))}

              {/* Final Answer Banner */}
              <div className="bg-emerald-950/20 border-2 border-emerald-500/60 rounded-2xl p-5 space-y-2 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Final Answer</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white font-mono">
                  {result.finalAnswer}
                </div>
              </div>

              {/* Verification & Sanity Check */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Self-Check Verification:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {result.verificationCheck}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
