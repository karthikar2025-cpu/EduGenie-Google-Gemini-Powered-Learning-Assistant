import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCircle,
  Shuffle,
  PlusCircle,
  FileText,
  Volume2
} from 'lucide-react';
import { Flashcard, FlashcardDeck, SubjectCategory } from '../types';
import { speakText, isSpeechSupported } from '../utils/speech';

interface FlashcardsViewProps {
  initialTopic?: string;
  subject: SubjectCategory;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  initialTopic = '',
  subject,
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Data Structures: Hash Tables & Hash Collisions');
  const [notesInput, setNotesInput] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [cardCount, setCardCount] = useState(8);
  const [difficulty, setDifficulty] = useState('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);

  const sampleDecks = [
    'Calculus: Derivatives & Integrals Rules',
    'Data Structures: Hash Tables & Collisions',
    'Physics: Maxwell’s Equations & Electromagnetism',
    'Cell Biology: Mitosis vs Meiosis Stages',
    'Macroeconomics: Fiscal vs Monetary Policy'
  ];

  const handleGenerate = async (targetTopic?: string) => {
    const q = (targetTopic || topic).trim();
    if (!q && !notesInput.trim()) return;

    setIsLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: q,
          count: cardCount,
          difficulty,
          notes: notesInput,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FlashcardDeck = await res.json();
      setDeck(data);
      setTopic(data.deckTitle || q);
      setShowNotesModal(false);
    } catch (err) {
      console.error(err);
      alert('Could not generate flashcards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (!deck || deck.cards.length === 0) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, currentIndex, isFlipped]);

  const handleNext = () => {
    if (!deck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1 < deck.cards.length ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (!deck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : deck.cards.length - 1));
  };

  const handleShuffle = () => {
    if (!deck) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setDeck({ ...deck, cards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRate = (confidence: 'again' | 'hard' | 'good' | 'easy') => {
    if (!deck) return;
    const updatedCards = [...deck.cards];
    updatedCards[currentIndex] = {
      ...updatedCards[currentIndex],
      confidence,
      reviewsCount: (updatedCards[currentIndex].reviewsCount || 0) + 1,
    };
    setDeck({ ...deck, cards: updatedCards });
    setStudiedCount((prev) => prev + 1);

    // Auto advance
    setTimeout(() => {
      handleNext();
    }, 250);
  };

  const currentCard = deck?.cards[currentIndex];

  const masteredInDeck = deck?.cards.filter((c) => c.confidence === 'easy' || c.confidence === 'good').length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Top Deck Generator Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Active Recall Flashcards</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Spaced Repetition
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cognitive retrieval practice with mnemonic memory anchors.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNotesModal(true)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate from Notes/Text</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic to master (e.g. 'Photosynthesis Light Reactions')..."
            className="flex-1 min-w-[240px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/70"
          />

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Cards:</span>
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value={6} className="bg-slate-900">6 Cards</option>
              <option value={8} className="bg-slate-900">8 Cards</option>
              <option value={12} className="bg-slate-900">12 Cards</option>
            </select>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={!topic.trim() || isLoading}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Creating Deck...' : 'Generate Deck'}</span>
          </button>
        </div>

        {/* Quick Topics */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] shrink-0">Suggestions:</span>
          {sampleDecks.slice(0, 3).map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setTopic(item);
                handleGenerate(item);
              }}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 shrink-0 cursor-pointer text-[11px]"
            >
              {item.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Flashcard Area */}
      {deck && currentCard ? (
        <div className="space-y-4">
          {/* Deck Header & Stats */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white text-sm">{deck.deckTitle}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                {currentIndex + 1} / {deck.cards.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Mastered: <strong className="text-emerald-400">{masteredInDeck}</strong> / {deck.cards.length}
              </span>
              <button
                onClick={handleShuffle}
                title="Shuffle Cards"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 w-full min-h-[320px] sm:min-h-[360px] cursor-pointer select-none group"
          >
            <div
              className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-slate-900 border-2 border-slate-800 group-hover:border-cyan-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-mono text-[11px]">
                    {currentCard.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {isSpeechSupported() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.front);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-[11px] text-slate-500">Click or Press Space to Flip</span>
                  </div>
                </div>

                <div className="my-auto text-center py-6">
                  <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                    {currentCard.front}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
                  <span>Difficulty: {currentCard.difficulty}</span>
                  <span className="text-cyan-400 font-medium flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Flip Card</span>
                  </span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-950 border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-semibold text-[11px]">
                    Answer & Explanation
                  </span>
                  {isSpeechSupported() && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard.back + '. Memory hook: ' + currentCard.mnemonic);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="my-auto py-4">
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans font-medium mb-4">
                    {currentCard.back}
                  </p>

                  {/* Mnemonic Device Hook */}
                  {currentCard.mnemonic && (
                    <div className="bg-amber-950/30 border border-amber-800/40 text-amber-200 p-3 rounded-xl flex items-start gap-2 text-xs">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-300">Memory Anchor / Mnemonic: </span>
                        <span>{currentCard.mnemonic}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 text-center border-t border-slate-800/80 pt-2">
                  Rate your recall to trigger spaced repetition schedule:
                </div>
              </div>
            </div>
          </div>

          {/* Rating Buttons (Leitner system) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleRate('again')}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>1. Again (Soon)</span>
            </button>
            <button
              onClick={() => handleRate('hard')}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-amber-950/40 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-800/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>2. Hard</span>
            </button>
            <button
              onClick={() => handleRate('good')}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-800/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>3. Good</span>
            </button>
            <button
              onClick={() => handleRate('easy')}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-800/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>4. Easy (Mastered)</span>
            </button>
          </div>

          {/* Controls Bottom Nav */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] text-slate-500">
              Shortcuts: Space to flip • Keys 1-4 to rate
            </span>

            <button
              onClick={handleNext}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Flashcard Deck Loaded</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Generate active recall flashcards with mnemonic anchors for any topic or paste your own notes.
          </p>
          <button
            onClick={() => handleGenerate('Data Structures: Hash Tables & Hash Collisions')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Sample Hash Tables Deck</span>
          </button>
        </div>
      )}

      {/* Notes Input Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Generate Flashcards from Notes</span>
              </h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Optional Deck Title:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Chapter 4: Photosynthesis Notes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/70"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Paste Lecture Notes / Article Excerpt:
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Paste your syllabus, textbook excerpt, or lecture notes here..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/70 resize-none font-mono"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerate()}
                disabled={!notesInput.trim() && !topic.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Build Deck</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
