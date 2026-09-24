import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  ArrowRight,
  Download,
  Award
} from 'lucide-react';
import { MindmapData, MindmapBranch, MindmapSubChild, SubjectCategory } from '../types';

interface ConceptMindmapProps {
  initialTopic?: string;
  subject: SubjectCategory;
  onTestConcept?: (concept: string) => void;
}

export const ConceptMindmap: React.FC<ConceptMindmapProps> = ({
  initialTopic = '',
  subject,
  onTestConcept
}) => {
  const [topicInput, setTopicInput] = useState(initialTopic || 'Transformer Architecture & Self-Attention');
  const [depth, setDepth] = useState<'overview' | 'detailed'>('detailed');
  const [isLoading, setIsLoading] = useState(false);
  const [mindmap, setMindmap] = useState<MindmapData | null>(null);
  const [selectedSubChild, setSelectedSubChild] = useState<MindmapSubChild | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, 'unexplored' | 'learning' | 'mastered'>>({});
  const [zoomLevel, setZoomLevel] = useState(1);

  const sampleMindmapTopics = [
    'Transformer Architecture & Self-Attention',
    'Calculus: The Fundamental Theorem & Derivatives',
    'Quantum Mechanics: Superposition & Entanglement',
    'Cellular Respiration & ATP Synthesis',
    'Microeconomics: Elasticity & Market Equilibrium',
    'Relational Databases & ACID Transactions'
  ];

  const handleGenerate = async (topicToGenerate?: string) => {
    const topic = (topicToGenerate || topicInput).trim();
    if (!topic || isLoading) return;

    setIsLoading(true);
    setSelectedSubChild(null);

    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, depth, subject }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: MindmapData = await res.json();
      setMindmap(data);
      setTopicInput(data.topic || topic);

      // Initialize status mapping
      const initialMap: Record<string, 'unexplored' | 'learning' | 'mastered'> = {};
      data.rootNode?.children?.forEach((b) => {
        initialMap[b.id] = 'unexplored';
        b.children?.forEach((c) => {
          initialMap[c.id] = 'unexplored';
        });
      });
      setNodeStatuses(initialMap);
    } catch (err) {
      console.error(err);
      alert('Could not generate mindmap. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNodeMastery = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNodeStatuses((prev) => {
      const current = prev[id] || 'unexplored';
      const next = current === 'unexplored' ? 'learning' : current === 'learning' ? 'mastered' : 'unexplored';
      return { ...prev, [id]: next };
    });
  };

  // Calculate overall mastery percentage
  const totalNodes = Object.keys(nodeStatuses).length;
  const masteredNodes = Object.values(nodeStatuses).filter((s) => s === 'mastered').length;
  const masteryPercentage = totalNodes > 0 ? Math.round((masteredNodes / totalNodes) * 100) : 0;

  const exportMindmapText = () => {
    if (!mindmap) return;
    let text = `# Concept Mindmap: ${mindmap.topic}\n\n`;
    text += `Summary: ${mindmap.summary}\n\n`;
    text += `Prerequisites: ${mindmap.prerequisites.join(', ')}\n\n`;

    mindmap.rootNode.children.forEach((branch, idx) => {
      text += `## ${idx + 1}. ${branch.label} (${branch.category} - ${branch.difficulty})\n`;
      text += `${branch.description}\n`;
      if (branch.keyInsight) text += `Key Insight: ${branch.keyInsight}\n`;

      branch.children.forEach((sub, subIdx) => {
        text += `   - ${sub.label}: ${sub.description}\n`;
        if (sub.exampleOrFormula) text += `     Formula/Example: ${sub.exampleOrFormula}\n`;
        if (sub.checkQuestion) text += `     Self-Check: ${sub.checkQuestion}\n`;
      });
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mindmap.topic.replace(/\s+/g, '_')}_mindmap.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Interactive Concept Mindmap</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Visual Hierarchy
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore mental models, core pillars, prerequisites, and track your concept mastery.
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
            <span className="text-slate-500 text-[11px] shrink-0">Popular:</span>
            {sampleMindmapTopics.slice(0, 3).map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setTopicInput(item);
                  handleGenerate(item);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer transition-colors"
              >
                {item.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[280px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter any curriculum topic (e.g. 'Photosynthesis', 'Bayesian Inference')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/70"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as any)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="detailed" className="bg-slate-900">Detailed (Multi-Tier)</option>
              <option value="overview" className="bg-slate-900">Executive Summary</option>
            </select>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={!topicInput.trim() || isLoading}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Synthesizing...' : 'Build Mindmap'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      {mindmap ? (
        <div className="space-y-4">
          {/* Overview & Mastery Stats Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{mindmap.topic}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {mindmap.summary}
              </p>
              {mindmap.prerequisites && mindmap.prerequisites.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">Prerequisites:</span>
                  {mindmap.prerequisites.map((p, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-[11px] border border-slate-700/60"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mastery Meter */}
            <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 shrink-0">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Concept Mastery</span>
                  <span className="text-purple-400 font-bold ml-3">{masteryPercentage}%</span>
                </div>
                <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${masteryPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {masteredNodes} of {totalNodes} concepts mastered
                </p>
              </div>

              <button
                onClick={exportMindmapText}
                title="Export as Markdown"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Mindmap Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mindmap.rootNode.children.map((branch, bIdx) => {
              const branchStatus = nodeStatuses[branch.id] || 'unexplored';
              return (
                <div
                  key={branch.id || bIdx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between shadow-md"
                >
                  <div>
                    {/* Branch Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                          {bIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {branch.label}
                        </h4>
                      </div>

                      <button
                        onClick={(e) => toggleNodeMastery(branch.id, e)}
                        title={`Status: ${branchStatus}. Click to cycle.`}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1 ${
                          branchStatus === 'mastered'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : branchStatus === 'learning'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {branchStatus === 'mastered' && <CheckCircle2 className="w-3 h-3" />}
                        {branchStatus === 'learning' && <Clock className="w-3 h-3" />}
                        <span className="capitalize text-[10px]">{branchStatus}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {branch.description}
                    </p>

                    {branch.keyInsight && (
                      <div className="text-[11px] bg-purple-950/30 border border-purple-800/40 text-purple-200 p-2 rounded-lg mb-3">
                        <span className="font-semibold text-purple-300">Key Insight: </span>
                        {branch.keyInsight}
                      </div>
                    )}

                    {/* Sub Nodes / Leaf Concepts */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Sub-Mechanisms:
                      </p>
                      {branch.children.map((sub, sIdx) => {
                        const subStatus = nodeStatuses[sub.id] || 'unexplored';
                        return (
                          <div
                            key={sub.id || sIdx}
                            onClick={() => setSelectedSubChild(sub)}
                            className="group bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-purple-500/50 rounded-xl p-2.5 transition-all cursor-pointer flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-slate-200 group-hover:text-purple-300 block truncate">
                                {sub.label}
                              </span>
                              <span className="text-[10px] text-slate-400 line-clamp-1">
                                {sub.description}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => toggleNodeMastery(sub.id, e)}
                                className={`p-1 rounded-full border transition-colors ${
                                  subStatus === 'mastered'
                                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                                    : 'text-slate-500 border-slate-700 hover:text-slate-300'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 font-mono text-[10px]">
                      {branch.category}
                    </span>
                    <span className="text-slate-500">{branch.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-400">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Mindmap Built Yet</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Enter a subject or concept above to map out its foundational building blocks, connections,
            prerequisites, and self-test verification checkpoints.
          </p>
          <button
            onClick={() => handleGenerate('Transformer Architecture & Self-Attention')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample Transformer Mindmap</span>
          </button>
        </div>
      )}

      {/* Sub-node Detail Modal / Drawer */}
      {selectedSubChild && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSubChild(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Concept Deep-Dive
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedSubChild.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubChild(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-300">
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Concept Breakdown:</h4>
                <p className="leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  {selectedSubChild.description}
                </p>
              </div>

              {selectedSubChild.exampleOrFormula && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">Example / Intuition:</h4>
                  <div className="bg-slate-950 font-mono text-[11px] text-cyan-300 p-3 rounded-xl border border-cyan-900/40">
                    {selectedSubChild.exampleOrFormula}
                  </div>
                </div>
              )}

              {selectedSubChild.checkQuestion && (
                <div>
                  <h4 className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Quick Mastery Check:</span>
                  </h4>
                  <p className="bg-amber-950/20 text-amber-200 p-3 rounded-xl border border-amber-900/40 leading-relaxed">
                    {selectedSubChild.checkQuestion}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  toggleNodeMastery(selectedSubChild.id);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  nodeStatuses[selectedSubChild.id] === 'mastered'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {nodeStatuses[selectedSubChild.id] === 'mastered' ? '✓ Marked as Mastered' : 'Mark as Mastered'}
              </button>

              {onTestConcept && (
                <button
                  onClick={() => {
                    const concept = selectedSubChild.label;
                    setSelectedSubChild(null);
                    onTestConcept(concept);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <span>Quiz on this Concept</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
