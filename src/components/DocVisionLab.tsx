import React, { useState, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Search,
  MessageSquare,
  HelpCircle,
  Calculator,
  Layers,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  BrainCircuit,
  Eye,
  Send,
  Zap,
  Tag
} from 'lucide-react';
import {
  DocumentAnalysisResult,
  DocVisionMode,
  DocQAResponse,
  SubjectCategory,
  GradeLevel
} from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface DocVisionLabProps {
  subject: SubjectCategory;
  gradeLevel: GradeLevel;
  onLaunchChat?: (topic: string) => void;
  onLaunchQuiz?: (topic: string) => void;
  onLaunchMindmap?: (topic: string) => void;
}

// Built-in Demo SVG image generators for immediate testing
const createSampleSvgBase64 = (type: 'calculus' | 'biology' | 'transformer') => {
  let svg = '';
  if (type === 'calculus') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:#090d16; font-family: monospace;">
      <rect width="600" height="400" fill="#0f172a" rx="16"/>
      <rect x="20" y="20" width="560" height="360" fill="#1e293b" rx="12" stroke="#334155" stroke-width="2"/>
      <text x="50" y="60" fill="#38bdf8" font-size="20" font-weight="bold">PROBLEM SET 4 — OPTIMIZATION</text>
      <text x="50" y="100" fill="#f8fafc" font-size="16">Find all critical points and classify local extrema of:</text>
      <text x="50" y="150" fill="#facc15" font-size="22" font-weight="bold">f(x, y) = x³ - 3x + y² - 4y + 7</text>
      <text x="50" y="200" fill="#94a3b8" font-size="14">Instructions:</text>
      <text x="70" y="230" fill="#e2e8f0" font-size="14">1. Compute gradient vector: ∇f(x, y) = (fx, fy)</text>
      <text x="70" y="260" fill="#e2e8f0" font-size="14">2. Solve the system ∇f(x, y) = (0, 0)</text>
      <text x="70" y="290" fill="#e2e8f0" font-size="14">3. Construct the Hessian Matrix H(x, y) and evaluate D = fxx*fyy - (fxy)²</text>
      <text x="50" y="340" fill="#4ade80" font-size="13">Due Friday • Show all mathematical justifications</text>
    </svg>`;
  } else if (type === 'biology') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:#090d16; font-family: sans-serif;">
      <rect width="600" height="400" fill="#0f172a" rx="16"/>
      <rect x="20" y="20" width="560" height="360" fill="#132238" rx="12" stroke="#0284c7" stroke-width="2"/>
      <text x="50" y="55" fill="#38bdf8" font-size="18" font-weight="bold">CELLULAR RESPIRATION &amp; ENERGY COUPLING</text>
      
      <!-- Stage 1 -->
      <rect x="40" y="90" width="150" height="80" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="50" y="115" fill="#f8fafc" font-size="13" font-weight="bold">1. GLYCOLYSIS</text>
      <text x="50" y="135" fill="#94a3b8" font-size="11">Cytoplasm (Anaerobic)</text>
      <text x="50" y="155" fill="#4ade80" font-size="11">Yield: 2 Pyruvate + 2 ATP + 2 NADH</text>

      <path d="M 190 130 L 230 130" stroke="#facc15" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Stage 2 -->
      <rect x="230" y="90" width="160" height="80" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="240" y="115" fill="#f8fafc" font-size="13" font-weight="bold">2. KREBS CYCLE</text>
      <text x="240" y="135" fill="#94a3b8" font-size="11">Mitochondrial Matrix</text>
      <text x="240" y="155" fill="#4ade80" font-size="11">Yield: 2 ATP + 6 NADH + 2 FADH₂</text>

      <path d="M 390 130 L 420 130" stroke="#facc15" stroke-width="2"/>

      <!-- Stage 3 -->
      <rect x="420" y="90" width="145" height="80" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="430" y="115" fill="#f8fafc" font-size="13" font-weight="bold">3. OXIDATIVE PHOS.</text>
      <text x="430" y="135" fill="#94a3b8" font-size="11">Inner Cristae Membrane</text>
      <text x="430" y="155" fill="#4ade80" font-size="11">Yield: ~26-28 ATP (Chemiosmosis)</text>

      <!-- Bottom Summary Box -->
      <rect x="40" y="200" width="525" height="150" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="60" y="230" fill="#facc15" font-size="14" font-weight="bold">Overall Net Balanced Equation:</text>
      <text x="60" y="260" fill="#f8fafc" font-size="15" font-family="monospace">C₆H₁₂O₆ + 6O₂  ⟶  6CO₂ + 6H₂O + ~30-32 ATP</text>
      <text x="60" y="295" fill="#94a3b8" font-size="12">Key Enzyme Complex: ATP Synthase driven by Proton-Motive Force (H⁺ gradient across membrane).</text>
      <text x="60" y="325" fill="#38bdf8" font-size="11">Exam Note: High-yield focus on electron carriers NADH and FADH₂ oxidation states.</text>
    </svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" style="background:#090d16; font-family: monospace;">
      <rect width="600" height="400" fill="#0f172a" rx="16"/>
      <rect x="20" y="20" width="560" height="360" fill="#17192e" rx="12" stroke="#6366f1" stroke-width="2"/>
      <text x="50" y="55" fill="#818cf8" font-size="18" font-weight="bold">SCALED DOT-PRODUCT ATTENTION (Vaswani et al.)</text>
      
      <rect x="50" y="85" width="500" height="85" rx="8" fill="#1e1b4b" stroke="#818cf8" stroke-width="1"/>
      <text x="70" y="120" fill="#e0e7ff" font-size="14">Formula:</text>
      <text x="70" y="145" fill="#38bdf8" font-size="18" font-weight="bold">Attention(Q, K, V) = softmax( (Q · Kᵀ) / √d_k ) · V</text>

      <text x="50" y="205" fill="#cbd5e1" font-size="13">Architectural Components:</text>
      <text x="70" y="235" fill="#94a3b8" font-size="12">• Queries (Q) &amp; Keys (K) have dimension d_k; Values (V) have dimension d_v</text>
      <text x="70" y="265" fill="#94a3b8" font-size="12">• Scaling factor 1/√d_k counters counteracts vanishing softmax gradients for large d_k</text>
      <text x="70" y="295" fill="#94a3b8" font-size="12">• Multi-Head Attention projects Q, K, V with h different learned linear projections</text>
      
      <text x="50" y="345" fill="#34d399" font-size="12">Computational Complexity: O(n² · d) with respect to sequence length n.</text>
    </svg>`;
  }
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const DocVisionLab: React.FC<DocVisionLabProps> = ({
  subject,
  gradeLevel,
  onLaunchChat,
  onLaunchQuiz,
  onLaunchMindmap,
}) => {
  const [activeMode, setActiveMode] = useState<DocVisionMode>('summarize');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Analysis result
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);

  // Q&A state
  const [qaQuestion, setQaQuestion] = useState('');
  const [isAnsweringQa, setIsAnsweringQa] = useState(false);
  const [qaHistory, setQaHistory] = useState<DocQAResponse[]>([]);

  // Audio speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert SVG data URL to a clean PNG data URL for Gemini multimodal vision
  const convertSvgToPng = (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 600, 400);
          ctx.drawImage(img, 0, 0, 600, 400);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(svgDataUrl);
        }
      };
      img.onerror = () => resolve(svgDataUrl);
      img.src = svgDataUrl;
    });
  };

  // Load a preset demo
  const loadPreset = async (type: 'calculus' | 'biology' | 'transformer') => {
    const rawSvg = createSampleSvgBase64(type);
    const pngDataUrl = await convertSvgToPng(rawSvg);
    const titles = {
      calculus: 'Calculus_Optimization_ProblemSet.png',
      biology: 'Cellular_Respiration_Overview.png',
      transformer: 'Transformer_Attention_Architecture.png',
    };
    setFileData(pngDataUrl);
    setFileName(titles[type]);
    setFileMimeType('image/png');
    setFileSizeStr('Visual Sample (600x400 PNG)');
    setAnalysisResult(null);
    setQaHistory([]);
  };

  // Handle user file upload (Image or PDF)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image (PNG, JPEG, WEBP) or a PDF document.');
      return;
    }

    setFileName(file.name);
    setFileMimeType(file.type);
    setFileSizeStr(`${(file.size / 1024).toFixed(1)} KB`);
    setAnalysisResult(null);
    setQaHistory([]);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileData(result);
    };
    reader.readAsDataURL(file);
  };

  // Execute Multimodal Analysis
  const handleRunAnalysis = async (overrideMode?: DocVisionMode) => {
    if (!fileData || isAnalyzing) return;
    const modeToUse = overrideMode || activeMode;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/document-vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          mimeType: fileMimeType,
          fileName,
          mode: modeToUse,
          userPrompt: customPrompt.trim(),
          subject,
          gradeLevel,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DocumentAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
      alert('Failed to analyze document. Please verify the file and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Execute Q&A inquiry
  const handleAskQuestion = async (presetQ?: string) => {
    const q = (presetQ || qaQuestion).trim();
    if (!fileData || !q || isAnsweringQa) return;

    setIsAnsweringQa(true);
    try {
      const res = await fetch('/api/document-vision/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          mimeType: fileMimeType,
          question: q,
          subject,
          gradeLevel,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DocQAResponse = await res.json();
      setQaHistory((prev) => [data, ...prev]);
      setQaQuestion('');
    } catch (err) {
      console.error(err);
      alert('Could not answer question. Please try again.');
    } finally {
      setIsAnsweringQa(false);
    }
  };

  // Text to speech narration
  const handleToggleSpeech = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Study Materials &amp; Document Q&amp;A</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Upload &amp; Ask
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload your study materials (PDFs, lecture slides, textbook passages, problem sheets, or diagrams) and ask questions about them in real time with grounded multimodal AI.
              </p>
            </div>
          </div>

          {/* Preset Demos */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-500 text-[11px] shrink-0 font-medium">Try Sample:</span>
            <button
              onClick={() => loadPreset('calculus')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] shrink-0 cursor-pointer"
            >
              📐 Calculus Optimization
            </button>
            <button
              onClick={() => loadPreset('biology')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] shrink-0 cursor-pointer"
            >
              🧬 Cellular Respiration
            </button>
            <button
              onClick={() => loadPreset('transformer')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] shrink-0 cursor-pointer"
            >
              ⚡ Transformer Architecture
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: File Ingestion & Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upload Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload Document or Image</span>
              </span>
              <span className="text-[10px] text-slate-400">PDF, PNG, JPG, WEBP (Max 50MB)</span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="hidden"
            />

            {!fileData ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 bg-slate-950/60 rounded-xl p-8 text-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  Click to browse or drag &amp; drop file
                </h4>
                <p className="text-[11px] text-slate-500">
                  Handwritten notes, exam problems, textbook chapters, or diagrams
                </p>
              </div>
            ) : (
              /* File Loaded Preview */
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-72 flex items-center justify-center">
                  {fileMimeType.includes('pdf') ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-white text-xs block">{fileName}</span>
                      <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                        PDF Document Loaded
                      </span>
                    </div>
                  ) : (
                    <img
                      src={fileData}
                      alt={fileName}
                      className="max-h-72 w-full object-contain p-2"
                    />
                  )}
                </div>

                {/* File Metadata Info */}
                <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="truncate max-w-[200px]">
                    <span className="font-semibold text-slate-200 block truncate">{fileName}</span>
                    <span className="text-[10px] text-slate-500">{fileSizeStr}</span>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Mode Switcher */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                Cognitive Processing Objective:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveMode('summarize');
                    if (fileData) handleRunAnalysis('summarize');
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeMode === 'summarize'
                      ? 'bg-sky-950/60 border-sky-500/60 text-sky-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Deep Summary</span>
                </button>

                <button
                  onClick={() => setActiveMode('qa')}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeMode === 'qa'
                      ? 'bg-sky-950/60 border-sky-500/60 text-sky-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>File Q&amp;A Tutor</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMode('solve_visual');
                    if (fileData) handleRunAnalysis('solve_visual');
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeMode === 'solve_visual'
                      ? 'bg-sky-950/60 border-sky-500/60 text-sky-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span>Visual Problem Solver</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMode('flashcards');
                    if (fileData) handleRunAnalysis('flashcards');
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeMode === 'flashcards'
                      ? 'bg-sky-950/60 border-sky-500/60 text-sky-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Card Generator</span>
                </button>
              </div>
            </div>

            {/* Optional Custom Guidance Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                Custom Focus Prompt (Optional):
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus specifically on the gradient formula in step 2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500/70"
              />
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => handleRunAnalysis()}
              disabled={!fileData || isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analyzing Visual & Document Data...' : 'Analyze Document with Gemini'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Analysis & Q&A Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB: Document Q&A Mode */}
          {activeMode === 'qa' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>Ask Questions Grounded in this File</span>
                </span>
                <span className="text-[10px] text-slate-400">Visual &amp; textual grounding</span>
              </div>

              {/* Inquiry Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="e.g. What is the net ATP yield shown? / Explain equation 1"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/70"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  disabled={!fileData || !qaQuestion.trim() || isAnsweringQa}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAnsweringQa ? 'Thinking...' : 'Ask'}</span>
                </button>
              </div>

              {/* Quick Prompt Ideas from Analysis */}
              {analysisResult?.suggestedQuestions && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block">Suggested inquiry prompts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.suggestedQuestions.slice(0, 3).map((sq, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQaQuestion(sq);
                          handleAskQuestion(sq);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Q&A Responses Stream */}
              <div className="space-y-3 pt-2 max-h-[500px] overflow-y-auto pr-1">
                {qaHistory.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800">
                    Ask any question regarding equations, diagrams, labels, or definitions in the loaded document.
                  </div>
                ) : (
                  qaHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-bold text-sky-400">Q: {item.question}</span>
                        <button
                          onClick={() => handleToggleSpeech(item.answer)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          title="Read answer aloud"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-sky-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {item.answer}
                      </p>

                      {/* Evidence citation */}
                      {item.directEvidenceOrQuote && (
                        <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/30 text-[11px] text-sky-300">
                          <span className="font-bold">Grounded Citation: </span>
                          <span>"{item.directEvidenceOrQuote}"</span>
                        </div>
                      )}

                      {/* Socratic Follow-up Nudge */}
                      {item.socraticFollowUp && (
                        <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/30 text-[11px] text-indigo-300 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-300">Socratic Challenge: </span>
                            <span>{item.socraticFollowUp}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* TAB: Summarize, Problem Solver, or Card Generator Output */
            <div className="space-y-4">
              {analysisResult ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* Executive Summary Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                            {analysisResult.detectedType.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Mode: {analysisResult.mode}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                          {analysisResult.documentTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSpeech(analysisResult.executiveSummary)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-sky-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                      {analysisResult.executiveSummary}
                    </p>

                    {/* Key takeaways */}
                    {analysisResult.keyInsightsOrPoints && (
                      <div className="space-y-2 pt-1">
                        <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Core Takeaways &amp; Principles:</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {analysisResult.keyInsightsOrPoints.map((pt, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-1.5">
                              <span className="text-sky-400 font-bold shrink-0">•</span>
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step-by-Step Problem Solution (If Detected / Solved) */}
                  {analysisResult.stepByStepSolution && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                      <div className="pb-2 border-b border-slate-800">
                        <span className="text-[10px] font-bold text-amber-400 uppercase">
                          Visual Mathematical / Scientific Problem Solution
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          Problem: {analysisResult.stepByStepSolution.identifiedProblem}
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {analysisResult.stepByStepSolution.steps.map((st) => (
                          <div key={st.stepNumber} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-300">Step {st.stepNumber}</span>
                              <span className="text-[10px] text-slate-400 italic">Justification: {st.justification}</span>
                            </div>
                            <p className="text-slate-200 font-mono text-[11px]">{st.action}</p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                          <span className="font-bold text-emerald-300 block mb-0.5">Final Solution:</span>
                          <p className="text-emerald-100">{analysisResult.stepByStepSolution.finalResultOrTakeaway}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs">
                          <span className="font-bold text-indigo-300 block mb-0.5">Sanity Check &amp; Verification:</span>
                          <p className="text-indigo-100">{analysisResult.stepByStepSolution.verificationSanityCheck}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Equations & Key Terms */}
                  {analysisResult.extractedFormulasOrTerms && analysisResult.extractedFormulasOrTerms.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-sky-400" />
                        <span>Extracted Formulas &amp; Scientific Terms</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysisResult.extractedFormulasOrTerms.map((f, i) => (
                          <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                            <span className="font-mono font-bold text-sky-300 block text-[11px]">
                              {f.termOrFormula}
                            </span>
                            <p className="text-slate-400 text-[11px]">{f.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated Active Recall Cards */}
                  {analysisResult.flashcardPrompts && analysisResult.flashcardPrompts.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Generated Active Recall Cards</span>
                        </h4>
                        <span className="text-[10px] text-emerald-400">Ready for Spaced Repetition</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {analysisResult.flashcardPrompts.map((card, i) => (
                          <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Prompt #{i + 1}
                              </span>
                              <p className="font-bold text-slate-200 text-xs leading-snug">{card.front}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block mb-0.5">Answer:</span>
                              <p className="text-[11px] text-emerald-300">{card.back}</p>
                              {card.mnemonic && (
                                <p className="text-[10px] text-amber-300/80 mt-1 italic">💡 {card.mnemonic}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cross-Launch Bar */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-300">
                      Next Step: Continue learning this material with EduGenie:
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {onLaunchChat && (
                        <button
                          onClick={() => onLaunchChat(analysisResult.documentTitle)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Socratic Tutor</span>
                        </button>
                      )}

                      {onLaunchQuiz && (
                        <button
                          onClick={() => onLaunchQuiz(analysisResult.documentTitle)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Test with Quiz</span>
                        </button>
                      )}

                      {onLaunchMindmap && (
                        <button
                          onClick={() => onLaunchMindmap(analysisResult.documentTitle)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                          <span>Visual Mindmap</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty / Idle State */
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto my-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
                    <Eye className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Ready for Multimodal Document Analysis
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload an image or PDF of lecture slides, textbook passages, problem sheets, or diagrams on the left, or click a preset sample at the top to see instant multimodal AI in action.
                  </p>
                  <button
                    onClick={async () => {
                      await loadPreset('calculus');
                      setTimeout(() => handleRunAnalysis('summarize'), 100);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Calculus Optimization Demo</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
