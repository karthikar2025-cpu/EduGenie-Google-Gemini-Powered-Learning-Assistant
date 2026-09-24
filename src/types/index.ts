export type TeachingMode = 'socratic' | 'deep_dive' | 'eli5' | 'drillmaster' | 'code_mentor';

export type SubjectCategory =
  | 'Computer Science & AI'
  | 'Calculus & Mathematics'
  | 'Physics & Engineering'
  | 'Chemistry & Biology'
  | 'Economics & Finance'
  | 'History & Philosophy'
  | 'General Learning';

export type GradeLevel =
  | 'Middle School'
  | 'High School / AP'
  | 'College / Undergraduate'
  | 'Graduate / Professional'
  | 'Lifelong Curious Learner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  mode?: TeachingMode;
  keyTakeaways?: string[];
  suggestedFollowUps?: string[];
  conceptTitle?: string;
  timestamp: number;
}

export interface MindmapSubChild {
  id: string;
  label: string;
  description: string;
  exampleOrFormula?: string;
  checkQuestion?: string;
  status?: 'unexplored' | 'learning' | 'mastered';
}

export interface MindmapBranch {
  id: string;
  label: string;
  description: string;
  category: string;
  difficulty: string;
  keyInsight?: string;
  children: MindmapSubChild[];
  status?: 'unexplored' | 'learning' | 'mastered';
}

export interface MindmapData {
  topic: string;
  summary: string;
  prerequisites: string[];
  rootNode: {
    id: string;
    label: string;
    summary: string;
    children: MindmapBranch[];
  };
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mnemonic: string;
  category: string;
  difficulty: string;
  confidence?: 'again' | 'hard' | 'good' | 'easy';
  reviewsCount?: number;
}

export interface FlashcardDeck {
  deckTitle: string;
  overview: string;
  cards: Flashcard[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  conceptTested: string;
  userSelectedIndex?: number;
}

export interface QuizData {
  quizTitle: string;
  topic: string;
  targetDifficulty: string;
  questions: QuizQuestion[];
}

export interface JargonItem {
  term: string;
  feedback: string;
  simpleAlternative: string;
}

export interface FeynmanEvaluation {
  overallGrade: string;
  clarityScore: number;
  accuracyScore: number;
  strengths: string[];
  jargonOrBuzzwords: JargonItem[];
  knowledgeGaps: string[];
  polishedFeynmanExplanation: string;
  encouragingAdvice: string;
}

export interface ProblemStep {
  stepNumber: number;
  heading: string;
  action: string;
  mathOrCode?: string;
  explanation: string;
}

export interface ProblemHint {
  level: number;
  title: string;
  hintText: string;
}

export interface StepSolverResult {
  problemSummary: string;
  category: string;
  hints: ProblemHint[];
  steps: ProblemStep[];
  finalAnswer: string;
  verificationCheck: string;
}

export interface DailyTask {
  dayNumber: number;
  title: string;
  focus: string;
  estimatedMinutes: number;
  taskType: 'theory' | 'practice' | 'quiz' | 'review' | 'project';
  completed?: boolean;
}

export interface StudyWeek {
  weekNumber: number;
  theme: string;
  weeklyGoal: string;
  days: DailyTask[];
}

export interface StudyPlanData {
  title: string;
  estimatedHoursTotal: number;
  coreCompetencies: string[];
  weeks: StudyWeek[];
  proStudyTips: string[];
}

export interface CornellCue {
  cueQuestion: string;
  mainNote: string;
}

export interface KeyFormulaOrTerm {
  term: string;
  definitionOrFormula: string;
  importance?: string;
}

export interface CornellNotesData {
  title: string;
  highLevelSummary: string;
  cornellCues: CornellCue[];
  keyFormulasOrTerms: KeyFormulaOrTerm[];
  quickReviewPoints: string[];
}

// Adaptive & Personalized Learning Pathways
export interface SkillNode {
  id: string;
  title: string;
  tier: 1 | 2 | 3 | 4; // 1: Foundation, 2: Core Mechanics, 3: Applied Challenges, 4: Boss Mastery
  description: string;
  targetMasteryConcept: string;
  tailoredAnalogyOrHook: string;
  estimatedMinutes: number;
  remediationTips: string[];
  unlockPrerequisites: string[];
  status: 'locked' | 'unlocked' | 'in_progress' | 'mastered';
  score?: number;
}

export interface AdaptivePathwayData {
  pathTitle: string;
  diagnosticSummary: string;
  estimatedMasteryWeeks: number;
  adaptivePacing: string;
  recommendedLearningStyleHook: string;
  nodes: SkillNode[];
  recalibrationTriggers: string[];
}

// Group Study Room
export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  status: 'studying' | 'on_break' | 'ready_for_duel';
  focusTopic: string;
  streakDays: number;
}

export interface StudyRoomMessage {
  id: string;
  sender: string;
  isAi?: boolean;
  text: string;
  timestamp: string;
}

export interface DuelQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyRoom {
  id: string;
  title: string;
  subject: string;
  activeCount: number;
  currentPomodoroPhase: 'focus' | 'break';
  pomodoroSecondsLeft: number;
  members: GroupMember[];
  sharedNotes: string;
}

// Educator & Parent Dashboard
export interface StudentRecord {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  hoursThisWeek: number;
  quizzesTaken: number;
  avgQuizScore: number;
  feynmanGrade: string;
  status: 'thriving' | 'on_track' | 'needs_support';
  masteredTopics: string[];
  strugglingTopics: string[];
  lastActive: string;
}

export interface TeacherInterventionPlan {
  classroomSubject: string;
  strugglingTopic: string;
  rootCauseAnalysis: string;
  differentiatedGroupActivity: {
    title: string;
    description: string;
    durationMinutes: number;
    steps: string[];
  };
  scaffoldedPracticeProblems: {
    question: string;
    commonMisstep: string;
    coachingHint: string;
  }[];
  oneOnOneTalkingPoints: string[];
}

export interface ParentDigestData {
  studentName: string;
  celebrationSummary: string;
  keySkillsUnlocked: string[];
  dinnerConversationPrompts: {
    prompt: string;
    context: string;
  }[];
  encouragementTip: string;
}

