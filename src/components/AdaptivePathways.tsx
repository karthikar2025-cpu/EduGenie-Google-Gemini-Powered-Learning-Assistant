import React, { useState } from 'react';
import {
  GitBranch,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  ArrowRight,
  Lightbulb,
  ShieldAlert,
  Sliders,
  Compass,
  Zap,
  Target,
  Clock,
  RotateCcw
} from 'lucide-react';
import { AdaptivePathwayData, SkillNode, SubjectCategory, GradeLevel } from '../types';

interface AdaptivePathwaysProps {
  subject: SubjectCategory;
  gradeLevel: GradeLevel;
  onLaunchChat?: (topic: string) => void;
  onLaunchQuiz?: (topic: string) => void;
}

export const AdaptivePathways: React.FC<AdaptivePathwaysProps> = ({
  subject,
  gradeLevel,
  onLaunchChat,
  onLaunchQuiz,
}) => {
  const [topicOrGoal, setTopicOrGoal] = useState('Machine Learning & Neural Network Fundamentals');
  const [diagnosticScore, setDiagnosticScore] = useState(65);
  const [learningStyle, setLearningStyle] = useState('visual_analogy');
  const [pace, setPace] = useState('steady');
  const [isLoading, setIsLoading] = useState(false);
  const [pathway, setPathway] = useState<AdaptivePathwayData | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);

  const samplePathways = [
    'Machine Learning & Neural Networks',
    'Calculus: Multivariable Derivatives & Optimization',
    'Algorithms: Dynamic Programming & Graphs',
    'Organic Chemistry: Reaction Mechanisms',
    'AP Physics C: Classical Mechanics & Momentum'
  ];

  const handleGeneratePathway = async (presetGoal?: string) => {
    const target = (presetGoal || topicOrGoal).trim();
    if (!target || isLoading) return;

    setIsLoading(true);
    setSelectedNode(null);

    try {
      const res = await fetch('/api/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicOrGoal: target,
          diagnosticScore,
          learningStyle,
          pace,
          subject,
          gradeLevel,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdaptivePathwayData = await res.json();
      setPathway(data);
      setTopicOrGoal(data.pathTitle || target);
      if (data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate adaptive learning pathway. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNodeMastery = (nodeId: string) => {
    setCompletedNodeIds((prev) =>
      prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const isNodeCompleted = (nodeId: string) => completedNodeIds.includes(nodeId);

  // Determine if node is unlocked: Tier 1 always unlocked, or if all its unlockPrerequisites are in completedNodeIds
  const isNodeUnlocked = (node: SkillNode) => {
    if (node.tier === 1) return true;
    if (!node.unlockPrerequisites || node.unlockPrerequisites.length === 0) return true;
    return node.unlockPrerequisites.some((prereqId) => completedNodeIds.includes(prereqId));
  };

  const getTierMeta = (tier: number) => {
    switch (tier) {
      case 1:
        return { label: 'Tier 1: Foundational Bridge', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400' };
      case 2:
        return { label: 'Tier 2: Core Mechanics', color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400' };
      case 3:
        return { label: 'Tier 3: Applied Challenges', color: 'border-amber-500/40 bg-amber-950/20 text-amber-400' };
      case 4:
        return { label: 'Tier 4: Boss Level Synthesis', color: 'border-rose-500/40 bg-rose-950/20 text-rose-400' };
      default:
        return { label: `Tier ${tier}`, color: 'border-slate-700 bg-slate-900 text-slate-300' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Adaptive & Personalized Learning Pathways</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Cognitive Skill Tree
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Calibrated to your diagnostic baseline, preferred cognitive modality, and pacing. Dynamically unlocks as you master prerequisites.
            </p>
          </div>
        </div>

        {/* Diagnostic Calibration Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Target Concept / Skill:
            </label>
            <input
              type="text"
              value={topicOrGoal}
              onChange={(e) => setTopicOrGoal(e.target.value)}
              placeholder="e.g. Quantum Computing Basics"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/70"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
              <span>Diagnostic Level:</span>
              <span className="text-cyan-400 font-bold">{diagnosticScore}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              step="5"
              value={diagnosticScore}
              onChange={(e) => setDiagnosticScore(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Gaps Present</span>
              <span>Solid Basics</span>
              <span>Advanced</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Cognitive Modality:
            </label>
            <select
              value={learningStyle}
              onChange={(e) => setLearningStyle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/70 cursor-pointer"
            >
              <option value="visual_analogy">Visual & Real-world Analogies</option>
              <option value="code_and_build">Code & Practical Implementations</option>
              <option value="math_rigor">Mathematical First-Principles Rigor</option>
              <option value="bite_sized">Bite-Sized Socratic Micro-Doses</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Adaptation Pace:
            </label>
            <select
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/70 cursor-pointer"
            >
              <option value="steady">Steady Progressive</option>
              <option value="fast_track">Accelerated Fast-Track</option>
              <option value="deep_scaffold">Deep Cognitive Scaffolding</option>
            </select>
          </div>
        </div>

        {/* Presets and Launch */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <span className="text-slate-500 text-[11px] shrink-0">Popular:</span>
            {samplePathways.slice(0, 3).map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setTopicOrGoal(item);
                  handleGeneratePathway(item);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px]"
              >
                {item.split(':')[0]}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGeneratePathway()}
            disabled={!topicOrGoal.trim() || isLoading}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Calibrating Path...' : 'Construct Adaptive Skill Tree'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {pathway ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn">
          {/* Skill Tree & Node List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Pathway Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Personalized Path Blueprint
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {pathway.pathTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 text-xs font-semibold">
                    ~{pathway.estimatedMasteryWeeks} Weeks Pacing
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {pathway.diagnosticSummary}
              </p>

              <div className="mt-3 p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-200 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-300">Tailored Modality Anchor: </span>
                  <span>{pathway.recommendedLearningStyleHook}</span>
                </div>
              </div>
            </div>

            {/* Visual Skill Tree grouped by Tiers */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((tierNum) => {
                const tierNodes = pathway.nodes.filter((n) => n.tier === tierNum);
                if (tierNodes.length === 0) return null;
                const meta = getTierMeta(tierNum);

                return (
                  <div key={tierNum} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tierNodes.map((node) => {
                        const isUnlocked = isNodeUnlocked(node);
                        const isCompleted = isNodeCompleted(node.id);
                        const isSelected = selectedNode?.id === node.id;

                        return (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                              isSelected
                                ? 'border-cyan-500 bg-slate-900 shadow-lg shadow-cyan-500/10'
                                : isCompleted
                                ? 'border-emerald-800/60 bg-emerald-950/20'
                                : isUnlocked
                                ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60'
                                : 'border-slate-800/40 bg-slate-950/40 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                  #{node.id}
                                </span>
                                <h4 className="text-xs font-bold text-white leading-snug">
                                  {node.title}
                                </h4>
                              </div>

                              <div className="shrink-0">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : isUnlocked ? (
                                  <Unlock className="w-4 h-4 text-cyan-400" />
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                              {node.description}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{node.estimatedMinutes} mins</span>
                              </span>
                              <span className="font-semibold text-slate-400">
                                {node.targetMasteryConcept}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Node Inspector & Action Drawer (Right 1 col) */}
          <div className="space-y-4">
            {selectedNode ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 sticky top-20">
                <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                      Skill Node Details
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {selectedNode.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleNodeMastery(selectedNode.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isNodeCompleted(selectedNode.id)
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isNodeCompleted(selectedNode.id) ? 'Mastered' : 'Mark Mastered'}</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 block mb-1">
                      Target Mastery Competency:
                    </span>
                    <p className="text-slate-200 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      {selectedNode.targetMasteryConcept}
                    </p>
                  </div>

                  {/* Tailored Analogy Hook */}
                  <div>
                    <span className="font-semibold text-indigo-400 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Custom Personalized Hook ({learningStyle.replace('_', ' ')}):</span>
                    </span>
                    <p className="text-slate-300 bg-indigo-950/20 border border-indigo-800/40 p-3 rounded-xl leading-relaxed">
                      {selectedNode.tailoredAnalogyOrHook}
                    </p>
                  </div>

                  {/* Remediation tips if stuck */}
                  {selectedNode.remediationTips && selectedNode.remediationTips.length > 0 && (
                    <div>
                      <span className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Remediation If Stuck:</span>
                      </span>
                      <ul className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        {selectedNode.remediationTips.map((tip, i) => (
                          <li key={i} className="text-slate-400 text-[11px] flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold shrink-0">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prerequisites */}
                  {selectedNode.unlockPrerequisites && selectedNode.unlockPrerequisites.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        Prerequisites to unlock:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.unlockPrerequisites.map((reqId) => (
                          <span
                            key={reqId}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              completedNodeIds.includes(reqId)
                                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                                : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}
                          >
                            Node #{reqId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cross-Launch Action Buttons */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  {onLaunchChat && (
                    <button
                      onClick={() => onLaunchChat(selectedNode.title)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Learn with Socratic Coach</span>
                    </button>
                  )}

                  {onLaunchQuiz && (
                    <button
                      onClick={() => onLaunchQuiz(selectedNode.title)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30 transition-all"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Diagnostic Quiz for This Node</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                Select any node on the skill tree to view tailored learning hooks, analogies, and remediation steps.
              </div>
            )}

            {/* Recalibration Triggers Card */}
            {pathway.recalibrationTriggers && pathway.recalibrationTriggers.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Dynamic Recalibration Rules:</span>
                </span>
                <ul className="space-y-1 text-slate-400 text-[11px]">
                  {pathway.recalibrationTriggers.map((trig, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold shrink-0">→</span>
                      <span>{trig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Build Your Adaptive Skill Tree</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Specify your learning goal, diagnostic background score, and cognitive modality above to generate a dynamic 4-tier learning pathway.
          </p>
          <button
            onClick={() => handleGeneratePathway('Machine Learning & Neural Network Fundamentals')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample Machine Learning Path</span>
          </button>
        </div>
      )}
    </div>
  );
};
