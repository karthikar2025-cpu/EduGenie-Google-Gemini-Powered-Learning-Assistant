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
  Check
} from 'lucide-react';
import { FeynmanEvaluation, SubjectCategory } from '../types';

interface FeynmanLabProps {
  initialTopic?: string;
  subject: SubjectCategory;
}

export const FeynmanLab: React.FC<FeynmanLabProps> = ({
  initialTopic = '',
  subject,
}) => {
  const [topic, setTopic] = useState(initialTopic || 'How the Internet Works');
  const [targetAudience, setTargetAudience] = useState('A curious 10-year-old');
  const [userExplanation, setUserExplanation] = useState(
    'The internet is basically a massive web of computers connected with wires and signals. When you want to see a website, your computer sends tiny packages called packets with a web address. Routers act like postal workers directing the packets across oceans through cables until they reach a server computer, which sends back the web page files in packets.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleTopics = [
    'How Electricity Works',
    'How Neural Networks Learn',
    'Why Planes Fly (Bernoulli & Newton)',
    'Inflation & Purchasing Power',
    'How Vaccines Train the Immune System'
  ];

  const handleEvaluate = async () => {
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
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      alert('Could not evaluate explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRewrite = () => {
    if (!evaluation) return;
    navigator.clipboard.writeText(evaluation.polishedFeynmanExplanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>The Feynman Technique Lab</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                True Understanding
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              "If you can't explain it simply, you don't understand it well enough." — Richard Feynman
            </p>
          </div>
        </div>

        {/* Quick prompt ideas */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] shrink-0">Try a challenge:</span>
          {sampleTopics.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setTopic(item);
                setUserExplanation('');
                setEvaluation(null);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Input Formulation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Concept to Explain:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Entropy, Recursion, Photosynthesis..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Audience:</span>
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 cursor-pointer"
            >
              <option value="A curious 10-year-old">A curious 10-year-old child</option>
              <option value="A high school freshman">A high school freshman</option>
              <option value="A non-technical grandparent">A non-technical grandparent</option>
              <option value="A peer studying for an exam">A peer studying for an exam</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">
              Your Plain-Language Explanation:
            </label>
            <span className="text-[11px] text-slate-500">
              {userExplanation.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            value={userExplanation}
            onChange={(e) => setUserExplanation(e.target.value)}
            placeholder="Explain how it works using your own words, analogies, and concrete examples. Avoid copying textbook jargon!"
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 resize-none font-sans leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleEvaluate}
            disabled={!topic.trim() || !userExplanation.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Diagnosing Explanation...' : 'Evaluate My Explanation'}</span>
          </button>
        </div>
      </div>

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Score Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Feynman Diagnostic Report
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Evaluation for "{topic}"
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Grade Badge */}
                <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Grade:</span>
                  <span className="text-xl font-black text-amber-400">
                    {evaluation.overallGrade}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Clarity & Simplicity</span>
                  <span className="text-cyan-400 font-bold">{evaluation.clarityScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${evaluation.clarityScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Free of unnecessary jargon and accessible to {targetAudience}.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Conceptual Accuracy</span>
                  <span className="text-emerald-400 font-bold">{evaluation.accuracyScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${evaluation.accuracyScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Faithful to the underlying scientific or mathematical principles.
                </p>
              </div>
            </div>

            {/* Advice */}
            <div className="mt-4 p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200">
              <span className="font-semibold text-amber-300">Coaching Note: </span>
              {evaluation.encouragingAdvice}
            </div>
          </div>

          {/* Breakdown Grid: Strengths, Gaps, Jargon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>What You Explained Well:</span>
              </h4>
              <ul className="space-y-2">
                {evaluation.strengths.map((str, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80"
                  >
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps / Hand-waving spots */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Knowledge Gaps / Hand-Wavy Spots:</span>
              </h4>
              <ul className="space-y-2">
                {evaluation.knowledgeGaps.map((gap, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80"
                  >
                    <span className="text-rose-400 font-bold shrink-0">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Jargon Spotter */}
          {evaluation.jargonOrBuzzwords && evaluation.jargonOrBuzzwords.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-3">
                <MessageSquare className="w-4 h-4" />
                <span>Jargon Spotter (Terms that needed simpler analogies):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evaluation.jargonOrBuzzwords.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40 font-mono text-[11px]">
                        "{item.term}"
                      </span>
                      <span className="text-[10px] text-slate-500">Unexplained Jargon</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{item.feedback}</p>
                    <div className="text-emerald-300 text-[11px] pt-1">
                      <span className="font-semibold">Simpler way to say it: </span>
                      {item.simpleAlternative}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Polished Master Explanation */}
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  The Polished Feynman Explanation (Master Reference)
                </h4>
              </div>

              <button
                onClick={handleCopyRewrite}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {evaluation.polishedFeynmanExplanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
