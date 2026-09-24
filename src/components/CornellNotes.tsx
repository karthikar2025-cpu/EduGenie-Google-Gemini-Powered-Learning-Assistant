import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Hash,
  Clock,
  Eye,
  EyeOff,
  Zap,
  AlertTriangle,
  Layers,
  Printer,
  FileText,
  RotateCcw,
  Upload
} from 'lucide-react';
import { CornellNotesData, SubjectCategory, GradeLevel } from '../types';

interface CornellNotesProps {
  subject: SubjectCategory;
  gradeLevel?: GradeLevel;
  onLaunchFlashcards?: (topic: string) => void;
  onLaunchQuiz?: (topic: string) => void;
}

export const CornellNotes: React.FC<CornellNotesProps> = ({
  subject,
  gradeLevel = 'College / Undergraduate',
  onLaunchFlashcards,
  onLaunchQuiz,
}) => {
  const [title, setTitle] = useState('Operating Systems: Processes, Threads & Deadlocks');
  const [format, setFormat] = useState<'cornell' | 'cheat_sheet' | 'executive_outline' | 'flashcard_qa'>('cornell');
  const [lengthPreference, setLengthPreference] = useState<'ultra_concise' | 'balanced' | 'comprehensive'>('balanced');
  const [hideAnswers, setHideAnswers] = useState(false);
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

  // Sample lengthy study materials for instant testing
  const sampleMaterials = [
    {
      title: 'OS: Processes & Deadlocks',
      text: `Operating systems manage running programs as processes. A process has its own address space, stack, heap, and register state. Threads are lightweight execution units within the same process that share the address space, open files, and global memory, but have their own execution stack and program counter.
Deadlock is a state where two or more threads or processes are unable to proceed because each is waiting for the other to release a resource.
The four Coffman conditions that must hold simultaneously for a deadlock to occur are:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. No Preemption: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it after that process has completed its task.
4. Circular Wait: A set of waiting processes {P0, P1, ..., Pn} must exist such that P0 is waiting for a resource held by P1, P1 is waiting for a resource held by P2, and Pn is waiting for a resource held by P0.
Deadlock prevention strategies involve invalidating at least one of these four conditions (e.g., ordering resource acquisition globally to eliminate circular wait). Deadlock avoidance algorithms, such as Dijkstra’s Banker's Algorithm, dynamically examine resource allocation states to ensure that a circular wait condition can never exist.`
    },
    {
      title: 'Biology: Cellular Respiration',
      text: `Cellular respiration is the biochemical process by which eukaryotic organisms catabolize glucose to produce adenosine triphosphate (ATP), carbon dioxide, and water. The overall reaction is C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP.
It occurs in four distinct phases:
1. Glycolysis: Takes place in the cytoplasm under anaerobic conditions. Glucose (a 6-carbon molecule) is split into two molecules of pyruvate (3 carbons). It yields a net of 2 ATP (via substrate-level phosphorylation) and 2 NADH. The committed and rate-limiting enzyme is phosphofructokinase-1 (PFK-1), allosterically inhibited by high ATP and citrate, and stimulated by AMP.
2. Pyruvate Oxidation: Pyruvate moves into the mitochondrial matrix and is converted into Acetyl-CoA by the pyruvate dehydrogenase complex, releasing 1 CO2 and generating 1 NADH per pyruvate (2 per glucose).
3. Citric Acid Cycle (Krebs Cycle): Occurs in the mitochondrial matrix. Acetyl-CoA (2C) combines with oxaloacetate (4C) to form citrate (6C). For each glucose (2 turns), the cycle yields 4 CO2, 6 NADH, 2 FADH2, and 2 ATP (or GTP).
4. Oxidative Phosphorylation: Occurs across the inner mitochondrial membrane (cristae). Electron carriers NADH and FADH2 donate high-energy electrons through Complexes I-IV. As electrons move down the redox gradient to O2 (the terminal electron acceptor), protons (H+) are pumped into the intermembrane space, creating an electrochemical proton-motive force. Chemiosmosis occurs when H+ ions flow back through ATP Synthase to phosphorylate ADP into ATP, generating ~26-28 ATP.`
    },
    {
      title: 'Economics: Monetary Policy',
      text: `Monetary policy represents the macroeconomic management carried out by a central bank (such as the Federal Reserve) to achieve twin statutory mandates: maximum sustainable employment and price stability.
The three primary conventional policy instruments are:
1. Open Market Operations (OMOs): Buying or selling government bonds. Buying bonds injects liquid reserves into commercial banks, lowering the federal funds rate and stimulating borrowing, investment, and aggregate demand. Selling bonds drains reserves, raising interest rates and cooling inflation.
2. The Discount Rate: The interest rate charged to commercial banks borrowing from the central bank’s discount window.
3. Reserve Requirements: The fraction of deposits that depository institutions must hold in reserve. Lowering the ratio increases the deposit multiplier.
In unconventional policy regimes (such as during the Zero Lower Bound), central banks deploy Quantitative Easing (large-scale asset purchases of long-term Treasuries and mortgage-backed securities) and Forward Guidance to shape market yield expectations.`
    }
  ];

  const handleSynthesize = async (customText?: string, customTitle?: string) => {
    const textToUse = (customText || rawText).trim();
    if (!textToUse || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/notes-synthesizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: textToUse,
          format,
          lengthPreference,
          title: customTitle || title,
          subject,
          gradeLevel,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CornellNotesData = await res.json();
      setNotesData(data);
      if (customTitle) setTitle(customTitle);
    } catch (err) {
      console.error(err);
      alert('Could not synthesize concise notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!notesData) return;
    let md = `# ${notesData.title}\n\n`;
    md += `## High-Level Summary\n${notesData.highLevelSummary}\n\n`;

    if (notesData.cheatSheetRules && notesData.cheatSheetRules.length > 0) {
      md += `## Key Rules & Principles\n`;
      notesData.cheatSheetRules.forEach((r) => {
        md += `- ${r}\n`;
      });
      md += '\n';
    }

    md += `## Cornell Cues & Structured Notes\n\n`;
    notesData.cornellCues.forEach((c) => {
      md += `### ${c.cueQuestion}\n${c.mainNote}\n\n`;
    });

    if (notesData.keyFormulasOrTerms.length > 0) {
      md += `## Key Terms & Formulas\n\n`;
      notesData.keyFormulasOrTerms.forEach((k) => {
        md += `- **${k.term}**: ${k.definitionOrFormula} (${k.importance || 'High-Yield'})\n`;
      });
      md += `\n`;
    }

    if (notesData.examTraps && notesData.examTraps.length > 0) {
      md += `## Exam Traps & Common Misconceptions\n\n`;
      notesData.examTraps.forEach((t) => {
        md += `- ⚠️ ${t}\n`;
      });
      md += '\n';
    }

    if (notesData.quickReviewPoints.length > 0) {
      md += `## Quick Review Points\n\n`;
      notesData.quickReviewPoints.forEach((p) => {
        md += `- ${p}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notesData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyNotes = () => {
    if (!notesData) return;
    let text = `${notesData.title}\n\nSUMMARY:\n${notesData.highLevelSummary}\n\nNOTES:\n`;
    notesData.cornellCues.forEach((c) => {
      text += `[Q] ${c.cueQuestion}\n[A] ${c.mainNote}\n\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Concise Notes Synthesizer</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cornell &amp; Cheat Sheets
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transform lengthy textbook chapters, lecture transcripts, and verbose articles into high-yield, structured study notes.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-500 text-[11px] shrink-0 font-medium">Try Material:</span>
            {sampleMaterials.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTitle(item.title);
                  setRawText(item.text);
                  handleSynthesize(item.text, item.title);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] shrink-0 cursor-pointer transition-colors"
              >
                {item.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Format & Density Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800/80">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Topic / Document Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems: Processes and Deadlocks"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/70"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Note Structure:
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/70 cursor-pointer"
            >
              <option value="cornell">📝 Cornell System (2-Column)</option>
              <option value="cheat_sheet">⚡ High-Yield Exam Cheat Sheet</option>
              <option value="executive_outline">📋 Executive Outline</option>
              <option value="flashcard_qa">🗂️ Q&amp;A Active Recall Pairs</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Conciseness Level:
            </label>
            <select
              value={lengthPreference}
              onChange={(e) => setLengthPreference(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/70 cursor-pointer"
            >
              <option value="ultra_concise">Ultra-Concise (1-Page Core)</option>
              <option value="balanced">Balanced Study Notes</option>
              <option value="comprehensive">Comprehensive Synthesis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Input Material Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Paste Lengthy Study Material / Lecture Notes / Chapter:</span>
          </label>
          <span className="text-[11px] text-slate-500">
            {rawText.length} characters • ~{Math.ceil(rawText.split(/\s+/).length / 200)} min read
          </span>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste textbook excerpts, lecture transcripts, research articles, or syllabus notes here..."
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/70 font-sans leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Extracts core principles, active-recall cues, formula sheets &amp; exam traps
          </span>

          <button
            onClick={() => handleSynthesize()}
            disabled={!rawText.trim() || isLoading}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Synthesizing Concise Notes...' : 'Summarize into Concise Notes'}</span>
          </button>
        </div>
      </div>

      {/* Generated Concise Notes Card */}
      {notesData && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Concise Study Synthesis
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-semibold uppercase">
                  {format.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">{notesData.title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Quick Study Time: ~{notesData.readingTimeMinutes || 3} mins (over 80% time saved)</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideAnswers(!hideAnswers)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  hideAnswers
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Hide right-column notes for active recall self-testing"
              >
                {hideAnswers ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                <span>{hideAnswers ? 'Self-Test Mode (Active)' : 'Self-Test Cues'}</span>
              </button>

              <button
                onClick={handleCopyNotes}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export MD</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Executive Summary TL;DR Callout */}
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Core Executive Synthesis (TL;DR):</span>
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {notesData.highLevelSummary}
            </p>
          </div>

          {/* Golden Cheat Sheet Rules (If present) */}
          {notesData.cheatSheetRules && notesData.cheatSheetRules.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>High-Yield Rules &amp; Mnemonics:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notesData.cheatSheetRules.map((rule, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">⚡</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main 2-Column Cornell Structure */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Active Recall Cues &amp; Key Questions</span>
              <span>Concise Structured Notes &amp; Explanations</span>
            </div>

            <div className="space-y-3">
              {notesData.cornellCues.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  {/* Left Column: Cue / Question (4 cols) */}
                  <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800/80 pb-2 md:pb-0 md:pr-3">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">
                      Cue #{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-white flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item.cueQuestion}</span>
                    </h4>
                  </div>

                  {/* Right Column: Structured Note (8 cols) */}
                  <div className="md:col-span-8 md:pl-2">
                    {hideAnswers ? (
                      <div
                        onClick={() => setHideAnswers(false)}
                        className="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-center cursor-pointer hover:bg-slate-900 transition-all text-xs text-amber-300 font-medium"
                      >
                        Hidden for active recall testing. Click to reveal answer!
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {item.mainNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Formulas & Definitions Reference Table */}
          {notesData.keyFormulasOrTerms.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Essential Terms &amp; Formulas:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {notesData.keyFormulasOrTerms.map((termItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{termItem.term}</span>
                      {termItem.importance && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                          {termItem.importance}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {termItem.definitionOrFormula}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Traps & Misconceptions Alert */}
          {notesData.examTraps && notesData.examTraps.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-800/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Frequent Exam Traps &amp; Common Errors on this Topic:</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {notesData.examTraps.map((trap, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">⚠️</span>
                    <span>{trap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom Review Points */}
          {notesData.quickReviewPoints.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span>High-Yield Review Checklist:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {notesData.quickReviewPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Tool Connectors */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Ready to test your retention on these synthesized notes?
            </span>

            <div className="flex items-center gap-2">
              {onLaunchFlashcards && (
                <button
                  onClick={() => onLaunchFlashcards(notesData.title)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/30"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Convert into Flashcards</span>
                </button>
              )}

              {onLaunchQuiz && (
                <button
                  onClick={() => onLaunchQuiz(notesData.title)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Generate Practice Quiz</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
