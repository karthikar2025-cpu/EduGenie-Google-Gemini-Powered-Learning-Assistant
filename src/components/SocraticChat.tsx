import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  Compass,
  BookOpen,
  Zap,
  Code2,
  Smile,
  Mic,
  MicOff,
  ArrowRight
} from 'lucide-react';
import { ChatMessage, TeachingMode, SubjectCategory, GradeLevel } from '../types';
import { speakText, stopSpeaking, isSpeechSupported } from '../utils/speech';

interface SocraticChatProps {
  subject: SubjectCategory;
  gradeLevel: GradeLevel;
  onOpenMindmapForTopic?: (topic: string) => void;
  onOpenQuizForTopic?: (topic: string) => void;
  onOpenFlashcardsForTopic?: (topic: string) => void;
  isAudioPlaying: boolean;
  setIsAudioPlaying: (playing: boolean) => void;
}

export const SocraticChat: React.FC<SocraticChatProps> = ({
  subject,
  gradeLevel,
  onOpenMindmapForTopic,
  onOpenQuizForTopic,
  onOpenFlashcardsForTopic,
  isAudioPlaying,
  setIsAudioPlaying,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Hello! I'm **EduGenie**, your personal learning mentor powered by Google Gemini.\n\nWhether you're breaking down a tricky mathematical theorem, untangling algorithmic data structures, or exploring scientific concepts, I'm here to guide you toward true understanding.\n\nChoose a **Teaching Mode** above and ask me anything, or pick one of the sample inquiries below to get started!`,
      keyTakeaways: [
        'Active questioning locks concepts into long-term memory faster than passive reading',
        'Switch between Socratic, Deep Dive, ELI5, and Drillmaster anytime',
        'Turn any response into interactive mind maps or flashcards with 1-click'
      ],
      suggestedFollowUps: [
        'Why does a neural network need non-linear activation functions?',
        'How does the Heisenberg uncertainty principle really work?',
        'Explain the intuitive concept behind dynamic programming memoization'
      ],
      conceptTitle: 'Welcome to EduGenie',
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<TeachingMode>('socratic');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const modeDescriptions: Record<TeachingMode, { label: string; icon: any; desc: string; color: string }> = {
    socratic: {
      label: 'Socratic Coach',
      icon: Compass,
      desc: 'Guides by asking thought-provoking questions, never just giving answers away',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    },
    deep_dive: {
      label: 'Deep Explainer',
      icon: BookOpen,
      desc: 'First-principles breakdown with mechanics, analogies, and detailed theory',
      color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
    },
    eli5: {
      label: 'ELI5 / Storyteller',
      icon: Smile,
      desc: 'Zero-jargon, vivid household metaphors for effortless intuition',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    },
    drillmaster: {
      label: 'Exam Drillmaster',
      icon: Zap,
      desc: 'Rapid diagnostic questions, edge cases, and performance scoring',
      color: 'border-rose-500/40 bg-rose-500/10 text-rose-300'
    },
    code_mentor: {
      label: 'Code & Math Mentor',
      icon: Code2,
      desc: 'Annotated code, Big-O analysis, algorithmic invariants, and math logic',
      color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build previous turn history for context
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          mode,
          subject,
          gradeLevel,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const modelMessage: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'model',
        text: data.reply || 'I could not generate a response. Please try again.',
        keyTakeaways: data.keyTakeaways || [],
        suggestedFollowUps: data.suggestedFollowUps || [],
        conceptTitle: data.conceptTitle || 'Key Insight',
        mode,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        text: `⚠️ **Connection Error**: ${err?.message || 'Could not communicate with Gemini.'}\nPlease verify that the server is active.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if (isAudioPlaying) {
      stopSpeaking();
      setIsAudioPlaying(false);
    } else {
      setIsAudioPlaying(true);
      speakText(text, () => {
        setIsAudioPlaying(false);
      });
    }
  };

  // Voice dictation using browser SpeechRecognition if available
  const handleToggleVoiceRecord = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const sampleQuestions = [
    'How do Transformers use attention instead of recurrent steps?',
    'Why is the derivative of e^x equal to e^x?',
    'What is the difference between TCP and UDP with real world analogies?',
    'Explain the central limit theorem like I have never seen statistics',
    'How does public key cryptography (RSA) work without sharing secrets?'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-5xl mx-auto px-4 py-4">
      {/* Mode Picker bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-3 shadow-md">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Select Socratic Persona:
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {modeDescriptions[mode].desc}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(Object.keys(modeDescriptions) as TeachingMode[]).map((m) => {
            const item = modeDescriptions[m];
            const Icon = item.icon;
            const isSelected = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? item.color + ' shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 shadow-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm'
                }`}
              >
                {/* Header for model message */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80 text-xs">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {msg.conceptTitle || 'EduGenie Response'}
                    </span>
                    <div className="flex items-center gap-1">
                      {isSpeechSupported() && (
                        <button
                          onClick={() => handleSpeak(msg.text)}
                          title="Read explanation out loud"
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Markdown body text */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Key Takeaways */}
                {!isUser && msg.keyTakeaways && msg.keyTakeaways.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Key Takeaways for Mastery:</span>
                    </div>
                    <ul className="space-y-1.5">
                      {msg.keyTakeaways.map((takeaway, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60"
                        >
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Action Pills: Turn into Mindmap / Quiz / Flashcard */}
                {!isUser && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                    {onOpenMindmapForTopic && msg.conceptTitle && (
                      <button
                        onClick={() => onOpenMindmapForTopic(msg.conceptTitle || '')}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Visualize Mindmap</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {onOpenQuizForTopic && msg.conceptTitle && (
                      <button
                        onClick={() => onOpenQuizForTopic(msg.conceptTitle || '')}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Test Me (Quiz)</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {onOpenFlashcardsForTopic && msg.conceptTitle && (
                      <button
                        onClick={() => onOpenFlashcardsForTopic(msg.conceptTitle || '')}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Generate Flashcards</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Suggested Follow-Ups */}
                {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-3 pt-2">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                      Explore next:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((question, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSend(question)}
                          className="text-left text-xs bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer"
                        >
                          → {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-indigo-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>EduGenie is reasoning through the concept...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick chips if conversation is young */}
      {messages.length <= 2 && (
        <div className="mt-2 mb-2 flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-medium">Try asking:</span>
          {sampleQuestions.slice(0, 3).map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-full px-3 py-1 cursor-pointer transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 shadow-lg focus-within:border-indigo-500/80 transition-all"
      >
        <button
          type="button"
          onClick={handleToggleVoiceRecord}
          title="Dictate with voice"
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isRecording
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
          }`}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask a question or describe a problem in ${subject}...`}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none px-2"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
