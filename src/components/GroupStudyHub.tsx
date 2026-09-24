import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Swords,
  MessageSquare,
  FileText,
  Volume2,
  VolumeX,
  Send,
  Plus,
  CheckCircle2,
  Award,
  Clock,
  Radio
} from 'lucide-react';
import {
  StudyRoom,
  GroupMember,
  StudyRoomMessage,
  DuelQuestion,
  SubjectCategory
} from '../types';

interface GroupStudyHubProps {
  subject: SubjectCategory;
}

const DEFAULT_ROOMS: StudyRoom[] = [
  {
    id: 'room-cs-ai',
    title: 'AI & Neural Nets Builders Pod',
    subject: 'Computer Science & AI',
    activeCount: 5,
    currentPomodoroPhase: 'focus',
    pomodoroSecondsLeft: 1380, // 23 mins
    sharedNotes: `### Team Focus Today:
- Backpropagation calculus & chain rule
- Transformer self-attention queries, keys, values
- Q-learning Bellman equation derivation`,
    members: [
      { id: 'm1', name: 'Maya Lin', avatar: '👩‍💻', status: 'studying', focusTopic: 'Attention Matrices', streakDays: 7 },
      { id: 'm2', name: 'Devon Patel', avatar: '🧑‍🔬', status: 'ready_for_duel', focusTopic: 'Loss Functions', streakDays: 14 },
      { id: 'm3', name: 'Elena Rostova', avatar: '👩‍🎓', status: 'studying', focusTopic: 'Gradient Descent', streakDays: 3 },
      { id: 'm4', name: 'Kai Tanaka', avatar: '🧑‍💻', status: 'on_break', focusTopic: 'Tokenizers', streakDays: 21 },
    ],
  },
  {
    id: 'room-calc',
    title: 'Calculus & Multivariable Crew',
    subject: 'Calculus & Mathematics',
    activeCount: 4,
    currentPomodoroPhase: 'focus',
    pomodoroSecondsLeft: 960, // 16 mins
    sharedNotes: `### Key Theorems to master before Friday:
1. Green's Theorem (line integrals to double integrals)
2. Stokes' Theorem (curl of vector fields)
3. Divergence Theorem (flux through closed surface)`,
    members: [
      { id: 'c1', name: 'Sam Thorne', avatar: '🧑‍🏫', status: 'studying', focusTopic: 'Surface Integrals', streakDays: 5 },
      { id: 'c2', name: 'Chloe Wu', avatar: '👩‍🔬', status: 'ready_for_duel', focusTopic: 'Lagrange Multipliers', streakDays: 12 },
      { id: 'c3', name: 'Marcus Bell', avatar: '🧑‍🎓', status: 'studying', focusTopic: 'Directional Derivatives', streakDays: 8 },
    ],
  },
  {
    id: 'room-phys',
    title: 'Physics Mechanics & Dynamics Circle',
    subject: 'Physics & Engineering',
    activeCount: 3,
    currentPomodoroPhase: 'break',
    pomodoroSecondsLeft: 180, // 3 mins break
    sharedNotes: `### Lab Prep Notes:
- Conservation of Angular Momentum: L = I * omega
- Moment of Inertia for cylinders vs hollow spheres
- Simple harmonic oscillator damping ratio`,
    members: [
      { id: 'p1', name: 'Liam Vance', avatar: '🧑‍🚀', status: 'on_break', focusTopic: 'Rotational Dynamics', streakDays: 9 },
      { id: 'p2', name: 'Aria Scott', avatar: '👩‍🔧', status: 'studying', focusTopic: 'Lagrangian Mechanics', streakDays: 18 },
    ],
  }
];

export const GroupStudyHub: React.FC<GroupStudyHubProps> = ({ subject }) => {
  const [rooms, setRooms] = useState<StudyRoom[]>(DEFAULT_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-cs-ai');
  const [activeTab, setActiveTab] = useState<'chat' | 'duel' | 'notes'>('chat');

  // Pomodoro timer state
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [ambientAudio, setAmbientAudio] = useState<'none' | 'lofi' | 'rain' | 'whitenoise'>('none');

  // Chat & AI Coach state
  const [chatMessages, setChatMessages] = useState<StudyRoomMessage[]>([
    {
      id: '1',
      sender: 'Devon Patel',
      text: 'Anyone ready to do a quick 3-question peer duel on attention layers before the pomodoro ends?',
      timestamp: '10:42 AM'
    },
    {
      id: '2',
      sender: 'EduGenie AI Coach',
      isAi: true,
      text: 'Great initiative! Remember: in scaled dot-product attention, dividing by sqrt(d_k) prevents large dot products from pushing the softmax function into regions with tiny gradients.',
      timestamp: '10:43 AM'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiCoachThinking, setIsAiCoachThinking] = useState(false);

  // Peer Duel state
  const [isGeneratingDuel, setIsGeneratingDuel] = useState(false);
  const [duelQuestions, setDuelQuestions] = useState<DuelQuestion[] | null>(null);
  const [currentDuelIdx, setCurrentDuelIdx] = useState(0);
  const [userDuelScore, setUserDuelScore] = useState(0);
  const [peerDuelScore, setPeerDuelScore] = useState(0);
  const [selectedDuelAnswer, setSelectedDuelAnswer] = useState<number | null>(null);
  const [duelFinished, setDuelFinished] = useState(false);

  // New room creation state
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      if (pomodoroMode === 'focus') {
        setPomodoroMode('break');
        setTimerSeconds(5 * 60);
      } else {
        setPomodoroMode('focus');
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, pomodoroMode]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: StudyRoomMessage = {
      id: Date.now().toString(),
      sender: 'You',
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextChat = [...chatMessages, userMsg];
    setChatMessages(nextChat);
    const query = inputMessage;
    setInputMessage('');

    // Check if user asked AI coach or if question is posed
    if (
      query.toLowerCase().includes('ai') ||
      query.toLowerCase().includes('coach') ||
      query.includes('?') ||
      query.toLowerCase().includes('how') ||
      query.toLowerCase().includes('why')
    ) {
      setIsAiCoachThinking(true);
      try {
        const res = await fetch('/api/group-study/ai-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomTopic: currentRoom.title,
            question: query,
            recentChat: nextChat.slice(-4),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const aiMsg: StudyRoomMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'EduGenie AI Coach',
            isAi: true,
            text: `${data.reply}\n\n💡 Peer Debate Prompt: ${data.peerDiscussionPrompt}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setChatMessages((prev) => [...prev, aiMsg]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAiCoachThinking(false);
      }
    }
  };

  const handleStartDuel = async () => {
    setIsGeneratingDuel(true);
    setDuelFinished(false);
    setUserDuelScore(0);
    setPeerDuelScore(0);
    setCurrentDuelIdx(0);
    setSelectedDuelAnswer(null);

    try {
      const res = await fetch('/api/group-study/generate-duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTopic: currentRoom.title,
          count: 3,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDuelQuestions(data.questions);
      setActiveTab('duel');
    } catch (e) {
      console.error(e);
      alert('Could not start duel challenge. Please try again.');
    } finally {
      setIsGeneratingDuel(false);
    }
  };

  const handleSelectDuelOption = (optIndex: number) => {
    if (selectedDuelAnswer !== null || !duelQuestions) return;
    setSelectedDuelAnswer(optIndex);

    const isCorrect = optIndex === duelQuestions[currentDuelIdx].correctIndex;
    if (isCorrect) {
      setUserDuelScore((prev) => prev + 100);
    }

    // Simulate peer answer with plausible accuracy (80%)
    const peerIsCorrect = Math.random() > 0.3;
    if (peerIsCorrect) {
      setPeerDuelScore((prev) => prev + 100);
    }
  };

  const handleNextDuelQuestion = () => {
    if (!duelQuestions) return;
    if (currentDuelIdx + 1 < duelQuestions.length) {
      setCurrentDuelIdx((prev) => prev + 1);
      setSelectedDuelAnswer(null);
    } else {
      setDuelFinished(true);
    }
  };

  const handleCreateRoom = () => {
    if (!newRoomTitle.trim()) return;
    const newRoom: StudyRoom = {
      id: `room-${Date.now()}`,
      title: newRoomTitle.trim(),
      subject,
      activeCount: 1,
      currentPomodoroPhase: 'focus',
      pomodoroSecondsLeft: 25 * 60,
      sharedNotes: `### ${newRoomTitle.trim()} Study Board\n- Collaborative objectives\n- Key formulas and resources`,
      members: [
        { id: 'you', name: 'You (Host)', avatar: '👑', status: 'studying', focusTopic: 'Host Session', streakDays: 1 }
      ]
    };

    setRooms((prev) => [newRoom, ...prev]);
    setSelectedRoomId(newRoom.id);
    setNewRoomTitle('');
    setShowCreateRoomModal(false);
  };

  const currentQ = duelQuestions?.[currentDuelIdx];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Group Study & Peer Collaboration Arena</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Live Sync Hub
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synchronized Pomodoro focus sessions, collaborative notes, AI room moderators, and rapid peer duels.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateRoomModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Room</span>
          </button>
        </div>

        {/* Room Switcher Pills */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-slate-500 text-[11px] shrink-0 font-medium">Active Pods:</span>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 cursor-pointer border ${
                selectedRoomId === room.id
                  ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{room.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                {room.members.length + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Room Top Bar + Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Synchronized Pomodoro & Active Peers (1 col) */}
        <div className="space-y-4">
          {/* Synchronized Pomodoro Timer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Synchronized Room Timer</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  pomodoroMode === 'focus'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                {pomodoroMode === 'focus' ? 'Focus Interval' : 'Rest Break'}
              </span>
            </div>

            {/* Big Countdown Display */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mb-2">
                {formatTimer(timerSeconds)}
              </div>
              <p className="text-[11px] text-slate-400">
                {pomodoroMode === 'focus' ? 'Deep Work — All members focusing' : 'Water break! Stretch & chat.'}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30 transition-all"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pause Sync' : 'Resume Sync'}</span>
              </button>

              <button
                onClick={() => {
                  setTimerSeconds(pomodoroMode === 'focus' ? 25 * 60 : 5 * 60);
                  setIsTimerRunning(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Ambient Audio Selector */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Ambient Sound:</span>
              </span>
              <select
                value={ambientAudio}
                onChange={(e) => setAmbientAudio(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="none">Muted</option>
                <option value="lofi">Lo-Fi Study Beats</option>
                <option value="rain">Library Rain</option>
                <option value="whitenoise">Binaural White Noise</option>
              </select>
            </div>
          </div>

          {/* Online Study Buddies */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Room Members ({currentRoom.members.length + 1})</span>
              </h3>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>All In Sync</span>
              </span>
            </div>

            {/* Current user */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-base">⭐</span>
                <div>
                  <span className="font-bold text-white block">You (Study Leader)</span>
                  <span className="text-[10px] text-purple-300">Active session</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Focusing
              </span>
            </div>

            {/* Peer List */}
            <div className="space-y-2">
              {currentRoom.members.map((member) => (
                <div
                  key={member.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{member.avatar}</span>
                    <div>
                      <span className="font-semibold text-slate-200 block">{member.name}</span>
                      <span className="text-[10px] text-slate-400">{member.focusTopic}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span>{member.streakDays}d</span>
                    </span>

                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${
                        member.status === 'ready_for_duel'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/50 animate-pulse'
                          : member.status === 'on_break'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                      }`}
                    >
                      {member.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Duel Trigger Button */}
            <button
              onClick={handleStartDuel}
              disabled={isGeneratingDuel}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 transition-all disabled:opacity-40"
            >
              <Swords className="w-4 h-4" />
              <span>{isGeneratingDuel ? 'Generating Challenge...' : 'Challenge Pod to Peer Duel!'}</span>
            </button>
          </div>
        </div>

        {/* Center & Right Column: Interactive Room Workspaces (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Workspace Tabs Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Room Chat & AI Coach</span>
              </button>

              <button
                onClick={() => setActiveTab('duel')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'duel'
                    ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Peer Duel Arena</span>
                {duelQuestions && !duelFinished && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Shared Study Board</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Chat & AI Coach */}
          {activeTab === 'chat' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-[520px]">
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'You' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-400">
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.isAi
                          ? 'bg-indigo-950/60 border border-indigo-500/40 text-indigo-100 shadow-md'
                          : msg.sender === 'You'
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.isAi && (
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>EduGenie AI Coach Nudge</span>
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isAiCoachThinking && (
                  <div className="flex items-center gap-2 text-xs text-indigo-300 p-2 bg-indigo-950/40 rounded-xl border border-indigo-800/40 w-max animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Study Coach is formulating a guidance prompt for the pod...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Chat with your pod or ask '@AI Coach' a question..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/70"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white cursor-pointer transition-colors shadow-md shadow-purple-600/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Peer Duel Arena */}
          {activeTab === 'duel' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5 min-h-[520px]">
              {duelQuestions && !duelFinished && currentQ ? (
                <div className="space-y-5 animate-fadeIn">
                  {/* Duel Header Scoreboard */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="text-center border-r border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-purple-400">Your Score</span>
                      <div className="text-2xl font-black text-white">{userDuelScore} pts</div>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Pod Rivals</span>
                      <div className="text-2xl font-black text-white">{peerDuelScore} pts</div>
                    </div>
                  </div>

                  {/* Question Progress */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      Round {currentDuelIdx + 1} of {duelQuestions.length}
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono">
                      Rapid-Fire Assessment
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    {currentQ.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedDuelAnswer === optIdx;
                      const isCorrect = currentQ.correctIndex === optIdx;
                      const hasAnswered = selectedDuelAnswer !== null;

                      let style = 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/60 text-slate-200';
                      if (hasAnswered) {
                        if (isCorrect) style = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold';
                        else if (isSelected && !isCorrect) style = 'bg-rose-950/40 border-rose-500 text-rose-200 line-through';
                        else style = 'bg-slate-950/30 border-slate-900 text-slate-500 opacity-60';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectDuelOption(optIdx)}
                          disabled={hasAnswered}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${style} ${
                            !hasAnswered ? 'cursor-pointer' : 'cursor-default'
                          }`}
                        >
                          <span>{opt}</span>
                          {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation & Next */}
                  {selectedDuelAnswer !== null && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                      <p>{currentQ.explanation}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={handleNextDuelQuestion}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-all"
                        >
                          {currentDuelIdx + 1 < duelQuestions.length ? 'Next Round' : 'View Duel Outcome'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : duelFinished ? (
                /* Duel Results */
                <div className="text-center py-10 space-y-5 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Duel Concluded!</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {userDuelScore > peerDuelScore
                        ? 'Victory! You led the pod in rapid recall.'
                        : userDuelScore === peerDuelScore
                        ? 'Tie Game! Incredible pod performance.'
                        : 'Great effort! Your peers edged ahead this round.'}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-w-xs mx-auto flex justify-around">
                    <div>
                      <span className="text-[10px] text-slate-400">Your Score</span>
                      <div className="text-2xl font-black text-purple-400">{userDuelScore} pts</div>
                    </div>
                    <div className="border-r border-slate-800" />
                    <div>
                      <span className="text-[10px] text-slate-400">Pod Score</span>
                      <div className="text-2xl font-black text-amber-400">{peerDuelScore} pts</div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartDuel}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30"
                  >
                    <Swords className="w-4 h-4" />
                    <span>Rematch Duel Challenge</span>
                  </button>
                </div>
              ) : (
                /* Duel Idle State */
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                    <Swords className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Ready for a Synchronized Duel?</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Test your reflexes and conceptual depth against pod members with a 3-question rapid-fire challenge.
                  </p>
                  <button
                    onClick={handleStartDuel}
                    disabled={isGeneratingDuel}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingDuel ? 'Generating...' : 'Launch Pod Duel Now'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Shared Study Notes */}
          {activeTab === 'notes' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Collaborative Study Scratchpad (Markdown)</span>
                </span>
                <span className="text-[10px] text-slate-400">Auto-saved to room</span>
              </div>

              <textarea
                value={currentRoom.sharedNotes}
                onChange={(e) => {
                  const val = e.target.value;
                  setRooms((prev) =>
                    prev.map((r) => (r.id === currentRoom.id ? { ...r, sharedNotes: val } : r))
                  );
                }}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500/70"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Room */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create a New Study Room</h3>
            <p className="text-xs text-slate-400">
              Set up a collaborative room with a synchronized timer and AI coach for your study group or class.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room Title & Focus Subject:
              </label>
              <input
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                placeholder="e.g. MCAT Organic Chemistry Study Pod"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/70"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomTitle.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer shadow-md shadow-purple-600/30"
              >
                Launch Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
