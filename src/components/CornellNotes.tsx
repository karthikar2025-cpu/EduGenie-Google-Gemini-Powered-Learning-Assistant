import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Hash
} from 'lucide-react';
import { CornellNotesData, SubjectCategory } from '../types';

interface CornellNotesProps {
  subject: SubjectCategory;
}

export const CornellNotes: React.FC<CornellNotesProps> = ({ subject }) => {
  const [title, setTitle] = useState('Operating Systems: Processes, Threads & Deadlocks');
  const [format, setFormat] = useState('cornell');
  const [rawText, setRawText] = useState(
    `Operating systems manage running programs as processes. A process has its own address space, stack, heap, and register state. Threads are lightweight execution units within the same process that share the address space but have their own execution stack and program counter.
Deadlock happens when a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process.
The four Coffman conditions for deadlock are:
1. Mutual exclusion: at least one resource must be non-shareable.
2. Hold and wait: a process is holding at least one resource and requesting additional ones.
3. No preemption: resources cannot be forcibly confiscated.
4. Circular wait: P0 waits for P1, P1 waits for P2... Pn waits for P0.
To prevent deadlock, we must break at least one of these four conditions. Dijkstra created the Banker's Algorithm for deadlock avoidance using safe state detection.`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [notesData, setNotesData] = useState<CornellNotesData | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleRawNotes = [
    {
      title: 'OS: Processes & Deadlocks',
      text: `Operating systems manage running programs as processes. A process has its own address space, stack, heap, and register state. Threads share address spaces. Deadlock requires Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait. Break one condition to prevent deadlocks. Banker's Algorithm detects safe states.`
    },
    {
      title: 'Biology: Cell Membrane Transport',
      text: `Cell membranes are phospholipid bilayers with hydrophilic heads facing outwards and hydrophobic fatty acid tails pointing inwards. Passive transport includes simple diffusion and facilitated diffusion via channel proteins or carrier proteins without ATP. Active transport requires ATP against concentration gradients, such as the Sodium-Potassium pump (3 Na+ out, 2 K+ in). Osmosis is water diffusion across selectively permeable membranes.`
    }
  ];

  const handleSynthesize = async () => {
    if (!rawText.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/notes-synthesizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          format,
          title,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CornellNotesData = await res.json();
      setNotesData(data);
    } catch (err) {
      console.error(err);
      alert('Could not synthesize notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!notesData) return;
    let md = `# Cornell Notes: ${notesData.title}\n\n`;
    md += `## Summary\n${notesData.highLevelSummary}\n\n`;
    md += `## Cornell Cues & Main Notes\n\n`;
    notesData.cornellCues.forEach((c) => {
      md += `### Cue / Question: ${c.cueQuestion}\n`;
      md += `${c.mainNote}\n\n`;
    });

    if (notesData.keyFormulasOrTerms.length > 0) {
      md += `## Key Terms & Formulas\n\n`;
      notesData.keyFormulasOrTerms.forEach((k) => {
        md += `- **${k.term}**: ${k.definitionOrFormula} (${k.importance || 'Key Term'})\n`;
      });
      md += `\n`;
    }

    if (notesData.quickReviewPoints.length > 0) {
      md += `## High-Yield Review Points\n\n`;
      notesData.quickReviewPoints.forEach((p) => {
        md += `- ${p}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notesData.title.replace(/\s+/g, '_')}_CornellNotes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Cornell Notes & High-Yield Cheat Sheet Synthesizer</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Cognitive Dual-Column
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Transform messy lecture transcripts, textbook excerpts, or stream-of-consciousness notes into structured Cornell notes.
            </p>
          </div>
        </div>

        {/* Quick sample chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] shrink-0">Sample inputs:</span>
          {sampleRawNotes.map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setTitle(sample.title);
                setRawText(sample.text);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px]"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Formulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Note Title / Topic:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 7: Photosynthesis & Light Reactions"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/70"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Layout Structure:
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/70 cursor-pointer"
            >
              <option value="cornell">Cornell Dual-Column</option>
              <option value="cheatsheet">High-Yield Exam Cheat Sheet</option>
              <option value="formulas_and_definitions">Formulas & Definitions</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Raw Text / Lecture Transcription / Book Notes:
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your unformatted notes, lecture audio transcript, or textbook paragraphs here..."
            rows={5}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500/70 resize-none font-mono"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSynthesize}
            disabled={!rawText.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Synthesizing Cornell Notes...' : 'Synthesize Notes'}</span>
          </button>
        </div>
      </div>

      {/* Cornell Output Display */}
      {notesData && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn">
          {/* Top Title & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Cornell Note Sheet
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {notesData.title}
              </h3>
            </div>

            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Markdown</span>
            </button>
          </div>

          {/* Cornell Dual Column Layout */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 text-xs">
              {/* CUE COLUMN (Left 1/3) */}
              <div className="p-4 bg-slate-900/60 font-semibold text-indigo-300 space-y-4">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 pb-2 border-b border-slate-800/80">
                  Cues / Questions / Keywords
                </div>
                {notesData.cornellCues.map((item, idx) => (
                  <div key={idx} className="pb-3 border-b border-slate-800/40 last:border-0 last:pb-0">
                    <span className="text-amber-400 text-[10px] block mb-0.5 font-bold">
                      Q{idx + 1}
                    </span>
                    <p className="text-xs text-indigo-200 leading-snug">
                      {item.cueQuestion}
                    </p>
                  </div>
                ))}
              </div>

              {/* NOTES COLUMN (Right 2/3) */}
              <div className="sm:col-span-2 p-4 text-slate-300 space-y-4 bg-slate-950">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 pb-2 border-b border-slate-800/80">
                  Detailed Notes & Concepts
                </div>
                {notesData.cornellCues.map((item, idx) => (
                  <div key={idx} className="pb-3 border-b border-slate-800/40 last:border-0 last:pb-0">
                    <span className="text-slate-500 text-[10px] block mb-0.5 font-mono">
                      Ref #{idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {item.mainNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMARY FOOTER (Full Width Bottom) */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-1">
                Executive Synthesis / Summary
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {notesData.highLevelSummary}
              </p>
            </div>
          </div>

          {/* Key Formulas & Definitions Table */}
          {notesData.keyFormulasOrTerms && notesData.keyFormulasOrTerms.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-purple-400" />
                <span>Key Terms & Formula Anchors:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {notesData.keyFormulasOrTerms.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 font-mono text-[11px]">
                        {item.term}
                      </span>
                      {item.importance && (
                        <span className="text-[10px] text-slate-500">
                          {item.importance}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {item.definitionOrFormula}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High-Yield Review Points */}
          {notesData.quickReviewPoints && notesData.quickReviewPoints.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400">
                High-Yield Review Points (Exam Takeaways):
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {notesData.quickReviewPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
