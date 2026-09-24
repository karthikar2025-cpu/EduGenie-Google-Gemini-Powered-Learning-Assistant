import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize GoogleGenAI SDK on server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Middleware
app.use(express.json({ limit: '10mb' }));

// Helper with automatic fallback for high demand (503) spikes
async function generateWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-flash-latest'
  ];
  let lastErr: any;
  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || '') + String(err?.status || '');
        if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('ResourceExhausted')) {
          console.warn(`Model ${model} (attempt ${attempt + 1}) experienced high demand spike. Retrying/Falling back...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
  }
  throw lastErr;
}

// Helper error handler
function handleGenAiError(res: express.Response, error: any, customMsg = 'Gemini API Error') {
  console.error(customMsg, error);
  const errMsg = error?.message || 'An error occurred while generating response with Gemini.';
  res.status(500).json({ error: errMsg, details: String(error) });
}

// 1. Socratic / Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      mode = 'socratic',
      subject = 'General Learning',
      gradeLevel = 'College / University'
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    let systemInstruction = `You are EduGenie, an expert, enthusiastic, and empathetic AI learning mentor and academic coach powered by Google Gemini.
Subject context: ${subject}. Target learner level: ${gradeLevel}.

Teaching Mode: `;

    if (mode === 'socratic') {
      systemInstruction += `SOCRATIC COACH.
Do NOT simply give away answers directly. Guide the student step-by-step using thought-provoking questions, reflective prompts, and subtle hints. Praise their correct reasoning, gently challenge false assumptions, and help them experience the "Eureka!" moment on their own. Break complex problems into smaller sub-steps.`;
    } else if (mode === 'deep_dive') {
      systemInstruction += `DEEP DIVE EXPLAINER.
Provide a thorough, conceptually rich, intuitive explanation. Use vivid real-world analogies, explain the underlying "why" (first principles), walk through the mathematical or logical mechanics, provide practical examples, and address common misconceptions.`;
    } else if (mode === 'eli5') {
      systemInstruction += `ELI5 (Explain Like I'm 5 / Simple Storyteller).
Explain the concept using extreme clarity, simple vocabulary, everyday household metaphors, and memorable storytelling without jargon. Make it engaging, humorous, and intuitive for anyone.`;
    } else if (mode === 'drillmaster') {
      systemInstruction += `EXAM DRILLMASTER.
Act as a tough but supportive coach. Ask sharp, high-yield diagnostic questions. When the user responds, critique their precision immediately, point out edge cases, award points, and challenge them with the next progressive difficulty question.`;
    } else if (mode === 'code_mentor') {
      systemInstruction += `CODE & ALGORITHM MENTOR.
Provide clean, idiomatic code examples, annotate with helpful comments, explain time and space complexity (Big-O), highlight edge cases, and show debugging thought process.`;
    }

    systemInstruction += `
Format your response as a valid JSON object matching the required schema:
- "reply": The main formatted markdown response text (use clear headings, bullet points, bold key terms, and code blocks if relevant).
- "keyTakeaways": 2 to 4 concise bullet points summarizing the core insight.
- "suggestedFollowUps": 3 natural, intriguing follow-up questions or prompts the learner can click to explore next.
- "conceptTitle": Short 2-4 word summary title of the topic discussed.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-8)) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text || turn.reply || '' }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: `Student message: ${message}` }],
    });

    const response = await generateWithFallback({
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: 'Markdown response text.' },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key bullet points for quick retention.'
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Three suggested follow-up questions.'
            },
            conceptTitle: { type: Type.STRING, description: 'Topic title.' }
          },
          required: ['reply', 'keyTakeaways', 'suggestedFollowUps', 'conceptTitle']
        },
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/chat');
  }
});

// 2. Interactive Concept Mindmap Generator
app.post('/api/mindmap', async (req, res) => {
  try {
    const { topic, depth = 'detailed', subject = 'General' } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const systemInstruction = `You are EduGenie's Concept Architect. Your task is to generate a comprehensive, hierarchical mental model and mindmap for the topic: "${topic}" (${subject}).
Structure the topic into core pillars, key sub-concepts, fundamental mechanisms, applications, and common pitfalls.
Create rich, informative nodes that provide clear definitions, intuitive analogies, and mini-quizzes to verify mastery.`;

    const response = await generateWithFallback({
      contents: `Generate a structured concept mindmap for: "${topic}". Depth level: ${depth}. Provide 3 to 5 primary branches, and 2 to 3 sub-branches under each.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING, description: 'High-level synthesis of this topic.' },
            prerequisites: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Concepts to know beforehand.'
            },
            rootNode: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                summary: { type: Type.STRING },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                      keyInsight: { type: Type.STRING },
                      children: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            description: { type: Type.STRING },
                            exampleOrFormula: { type: Type.STRING },
                            checkQuestion: { type: Type.STRING }
                          },
                          required: ['id', 'label', 'description']
                        }
                      }
                    },
                    required: ['id', 'label', 'description', 'children']
                  }
                }
              },
              required: ['id', 'label', 'summary', 'children']
            }
          },
          required: ['topic', 'summary', 'prerequisites', 'rootNode']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/mindmap');
  }
});

// 3. Active Recall Flashcard Generator
app.post('/api/flashcards', async (req, res) => {
  try {
    const { topic, count = 8, difficulty = 'balanced', notes = '' } = req.body;
    if (!topic && !notes) {
      return res.status(400).json({ error: 'Topic or source notes required.' });
    }

    const systemInstruction = `You are a cognitive science expert specializing in Active Recall, Spaced Repetition, and Mnemonic Retention.
Generate high-yield, engaging flashcards for the learner. Each flashcard must have:
- Front: A clear, challenging prompt, conceptual question, or fill-in-the-blank that forces the brain to retrieve knowledge.
- Back: A crisp, authoritative explanation highlighting the exact core mechanism.
- Mnemonic: A clever memory hook, rhyme, or visual metaphor to guarantee long-term retention.
- Category: Sub-topic category.`;

    const promptText = `Topic: "${topic}". Difficulty: ${difficulty}. Desired flashcards count: ${Math.min(Math.max(count, 4), 16)}.
${notes ? `Source Notes / Content:\n${notes}` : ''}`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            overview: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  mnemonic: { type: Type.STRING },
                  category: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                },
                required: ['id', 'front', 'back', 'mnemonic', 'category', 'difficulty']
              }
            }
          },
          required: ['deckTitle', 'overview', 'cards']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/flashcards');
  }
});

// 4. Adaptive Quiz Engine
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic, count = 5, difficulty = 'intermediate', focusArea = '' } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const systemInstruction = `You are EduGenie's Adaptive Testing Specialist.
Generate challenging, high-quality multiple choice assessment questions that test true conceptual understanding and diagnostic reasoning rather than rote trivia.
Include plausible distractors (common misconceptions) and comprehensive explanations for why the correct answer is right and why each wrong choice is incorrect.`;

    const promptText = `Generate ${Math.min(Math.max(count, 3), 10)} quiz questions for topic: "${topic}".
Difficulty: ${difficulty}.
${focusArea ? `Focus Area: ${focusArea}` : ''}`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            topic: { type: Type.STRING },
            targetDifficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctIndex: { type: Type.INTEGER, description: '0-based index of correct option' },
                  explanation: { type: Type.STRING, description: 'Deep explanation of the answer and common traps' },
                  hint: { type: Type.STRING, description: 'A gentle nudge hint' },
                  conceptTested: { type: Type.STRING }
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'hint', 'conceptTested']
              }
            }
          },
          required: ['quizTitle', 'topic', 'targetDifficulty', 'questions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/quiz');
  }
});

// 5. Feynman Technique Lab Evaluator
app.post('/api/feynman', async (req, res) => {
  try {
    const { topic, userExplanation, targetAudience = 'A curious 10-year-old' } = req.body;
    if (!topic || !userExplanation) {
      return res.status(400).json({ error: 'Topic and user explanation are required.' });
    }

    const systemInstruction = `You are Richard Feynman's digital protege. You evaluate student explanations using the famed Feynman Technique:
1. Simplicity & Clarity: Can a non-expert understand it without heavy terminology?
2. Accuracy: Is it scientifically or factually correct?
3. Pinpointing Jargon: Identify unnecessary jargon or buzzwords that hide a lack of understanding.
4. Identifying Holes: Where does the explanation break down or hand-wave?
5. The Master Rewrite: Show how to explain this exact concept in simple, brilliant everyday language.`;

    const promptText = `Topic: "${topic}"
Target Audience: "${targetAudience}"
Student's explanation:
"""
${userExplanation}
"""`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallGrade: { type: Type.STRING, description: 'e.g. A, B+, C' },
            clarityScore: { type: Type.INTEGER, description: '0 to 100' },
            accuracyScore: { type: Type.INTEGER, description: '0 to 100' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'What the student explained well'
            },
            jargonOrBuzzwords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  feedback: { type: Type.STRING },
                  simpleAlternative: { type: Type.STRING }
                },
                required: ['term', 'feedback', 'simpleAlternative']
              }
            },
            knowledgeGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Missing concepts or flawed assumptions'
            },
            polishedFeynmanExplanation: {
              type: Type.STRING,
              description: 'Exemplary version of the explanation using vivid analogies and zero unnecessary jargon'
            },
            encouragingAdvice: { type: Type.STRING }
          },
          required: [
            'overallGrade',
            'clarityScore',
            'accuracyScore',
            'strengths',
            'jargonOrBuzzwords',
            'knowledgeGaps',
            'polishedFeynmanExplanation',
            'encouragingAdvice'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/feynman');
  }
});

// 6. Step-by-Step Problem Solver & Hint Ladder
app.post('/api/step-solver', async (req, res) => {
  try {
    const { problem, subject = 'Mathematics / STEM' } = req.body;
    if (!problem) {
      return res.status(400).json({ error: 'Problem statement is required.' });
    }

    const systemInstruction = `You are an elite STEM problem solver and educator.
Break down the problem using cognitive scaffolding:
- Provide a ladder of 3 progressive hints:
  1. Conceptual hint (guides initial intuition)
  2. Formula/Strategy hint (points to the right theorem or method)
  3. Execution hint (shows how to start the algebra/code)
- Detailed step-by-step solution with mathematical/logical justifications.
- Final answer clearly stated.
- Self-check verification step.`;

    const response = await generateWithFallback({
      contents: `Solve and scaffold this problem in ${subject}:\n\n${problem}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemSummary: { type: Type.STRING },
            category: { type: Type.STRING },
            hints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  hintText: { type: Type.STRING }
                },
                required: ['level', 'title', 'hintText']
              }
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  heading: { type: Type.STRING },
                  action: { type: Type.STRING },
                  mathOrCode: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['stepNumber', 'heading', 'action', 'explanation']
              }
            },
            finalAnswer: { type: Type.STRING },
            verificationCheck: { type: Type.STRING }
          },
          required: ['problemSummary', 'category', 'hints', 'steps', 'finalAnswer', 'verificationCheck']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/step-solver');
  }
});

// 7. Study Roadmap & Schedule Architect
app.post('/api/study-plan', async (req, res) => {
  try {
    const { goal, durationWeeks = 4, dailyHours = 2, currentLevel = 'Beginner' } = req.body;
    if (!goal) {
      return res.status(400).json({ error: 'Goal is required.' });
    }

    const systemInstruction = `You are EduGenie's Master Curriculum Architect.
Generate an actionable, balanced, and motivating day-by-day learning roadmap to take a student from their current level to mastery.
Ensure spaced repetition, interleaving of practice questions, milestone mock tests, and rest days.`;

    const promptText = `Goal: "${goal}".
Duration: ${durationWeeks} weeks.
Daily available study time: ${dailyHours} hours/day.
Learner level: ${currentLevel}.`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            estimatedHoursTotal: { type: Type.INTEGER },
            coreCompetencies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  weeklyGoal: { type: Type.STRING },
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayNumber: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        focus: { type: Type.STRING },
                        estimatedMinutes: { type: Type.INTEGER },
                        taskType: { type: Type.STRING, description: 'theory, practice, quiz, review, or project' }
                      },
                      required: ['dayNumber', 'title', 'focus', 'estimatedMinutes', 'taskType']
                    }
                  }
                },
                required: ['weekNumber', 'theme', 'weeklyGoal', 'days']
              }
            },
            proStudyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['title', 'estimatedHoursTotal', 'coreCompetencies', 'weeks', 'proStudyTips']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/study-plan');
  }
});

// 8. Cornell Notes & Cheat Sheet Synthesizer
app.post('/api/notes-synthesizer', async (req, res) => {
  try {
    const { rawText, format = 'cornell', title = 'Learning Notes' } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: 'Text content is required.' });
    }

    const systemInstruction = `You are a Cornell note-taking and academic synthesis specialist.
Transform raw, messy, or unstructured notes/text into high-yield, beautifully organized educational summaries.`;

    const promptText = `Title: "${title}". Format requested: "${format}".
Source Content:
"""
${rawText}
"""`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            highLevelSummary: { type: Type.STRING },
            cornellCues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cueQuestion: { type: Type.STRING },
                  mainNote: { type: Type.STRING }
                },
                required: ['cueQuestion', 'mainNote']
              }
            },
            keyFormulasOrTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definitionOrFormula: { type: Type.STRING },
                  importance: { type: Type.STRING }
                },
                required: ['term', 'definitionOrFormula']
              }
            },
            quickReviewPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['title', 'highLevelSummary', 'cornellCues', 'keyFormulasOrTerms', 'quickReviewPoints']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/notes-synthesizer');
  }
});

// 9. Adaptive & Personalized Learning Path Generator
app.post('/api/adaptive-path', async (req, res) => {
  try {
    const {
      topicOrGoal,
      diagnosticScore = 70,
      learningStyle = 'visual_analogy',
      pace = 'steady',
      subject = 'General Learning',
      gradeLevel = 'College / Undergraduate'
    } = req.body;

    if (!topicOrGoal) {
      return res.status(400).json({ error: 'Topic or Goal is required.' });
    }

    const systemInstruction = `You are EduGenie's Adaptive Learning Scientist.
Your objective is to design a personalized skill tree and mastery trajectory for: "${topicOrGoal}".
Student Profile:
- Subject: ${subject}
- Grade Level: ${gradeLevel}
- Diagnostic Level / Prior Score: ${diagnosticScore}%
- Preferred Learning Modality: ${learningStyle} (tailor analogies & hooks specifically to this style!)
- Pace: ${pace}

Organize the learning path into 4 distinct skill tiers:
Tier 1: Foundational Prerequisites (bridge existing gaps)
Tier 2: Core Mechanics & Conceptual Principles
Tier 3: Applied Scenarios & Multi-step Challenges
Tier 4: Boss Level Mastery & Synthesis (transfer of knowledge)

Each node must have a tailored analogy or hook customized to the student's learning style, remediation tips if they struggle, and an unlock prerequisite relationship.`;

    const response = await generateWithFallback({
      contents: `Design an adaptive, personalized skill tree for: "${topicOrGoal}". Diagnostic score: ${diagnosticScore}%. Modality: ${learningStyle}. Pacing: ${pace}.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pathTitle: { type: Type.STRING },
            diagnosticSummary: { type: Type.STRING },
            estimatedMasteryWeeks: { type: Type.INTEGER },
            adaptivePacing: { type: Type.STRING },
            recommendedLearningStyleHook: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  tier: { type: Type.INTEGER, description: '1, 2, 3, or 4' },
                  description: { type: Type.STRING },
                  targetMasteryConcept: { type: Type.STRING },
                  tailoredAnalogyOrHook: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  remediationTips: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  unlockPrerequisites: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  status: { type: Type.STRING, description: 'unlocked, in_progress, or locked' }
                },
                required: [
                  'id',
                  'title',
                  'tier',
                  'description',
                  'targetMasteryConcept',
                  'tailoredAnalogyOrHook',
                  'estimatedMinutes',
                  'remediationTips',
                  'unlockPrerequisites',
                  'status'
                ]
              }
            },
            recalibrationTriggers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'pathTitle',
            'diagnosticSummary',
            'estimatedMasteryWeeks',
            'adaptivePacing',
            'recommendedLearningStyleHook',
            'nodes',
            'recalibrationTriggers'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/adaptive-path');
  }
});

// 10. Group Study AI Coach / Moderator
app.post('/api/group-study/ai-coach', async (req, res) => {
  try {
    const { roomTopic, question, recentChat = [] } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const systemInstruction = `You are EduGenie's Study Room AI Mentor in a collaborative virtual study room.
Topic: "${roomTopic || 'Collaborative Study'}".
Encourage peer collaboration, guide discussions without simply handing out answers, provide helpful analogies, or suggest a quick collaborative exercise for the group to test each other.
Keep your response concise, motivating, and friendly (under 120 words).`;

    const prompt = `Recent room messages:\n${recentChat.map((m: any) => `${m.sender}: ${m.text}`).join('\n')}\n\nStudent question for the AI coach: "${question}"`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            peerDiscussionPrompt: { type: Type.STRING, description: 'A question for peers in the room to discuss with each other' }
          },
          required: ['reply', 'peerDiscussionPrompt']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/group-study/ai-coach');
  }
});

// 11. Group Study Peer Duel Challenge Generator
app.post('/api/group-study/generate-duel', async (req, res) => {
  try {
    const { roomTopic = 'General Knowledge', count = 3 } = req.body;

    const systemInstruction = `You are EduGenie's Peer Duel Quiz Master.
Generate ${count} rapid-fire, high-yield multiple-choice challenge questions for a synchronized multiplayer peer duel on: "${roomTopic}".`;

    const response = await generateWithFallback({
      contents: `Generate ${count} multiplayer challenge duel questions for topic: "${roomTopic}".`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/group-study/generate-duel');
  }
});

// 12. Teacher Intervention Plan Generator
app.post('/api/teacher-intervention', async (req, res) => {
  try {
    const {
      classroomSubject = 'AP Computer Science',
      strugglingTopic = 'Dynamic Programming & Memoization',
      studentCountStruggling = 4,
    } = req.body;

    const systemInstruction = `You are EduGenie's Master Instructional Coach and Pedagogy Specialist.
Analyze why students commonly fail or get confused by: "${strugglingTopic}" in ${classroomSubject}.
Provide an actionable, differentiated intervention plan:
1. Root cause cognitive breakdown (the misconception).
2. A 20-minute small-group differentiated breakout activity with concrete steps.
3. 2 Scaffolded practice problems with common misstep warnings and coaching hints.
4. Talking points for a supportive 1-on-1 teacher-student conference.`;

    const response = await generateWithFallback({
      contents: `Create teacher intervention plan for topic: "${strugglingTopic}", subject: "${classroomSubject}". Students struggling: ${studentCountStruggling}.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classroomSubject: { type: Type.STRING },
            strugglingTopic: { type: Type.STRING },
            rootCauseAnalysis: { type: Type.STRING },
            differentiatedGroupActivity: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                durationMinutes: { type: Type.INTEGER },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['title', 'description', 'durationMinutes', 'steps']
            },
            scaffoldedPracticeProblems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  commonMisstep: { type: Type.STRING },
                  coachingHint: { type: Type.STRING }
                },
                required: ['question', 'commonMisstep', 'coachingHint']
              }
            },
            oneOnOneTalkingPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'classroomSubject',
            'strugglingTopic',
            'rootCauseAnalysis',
            'differentiatedGroupActivity',
            'scaffoldedPracticeProblems',
            'oneOnOneTalkingPoints'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/teacher-intervention');
  }
});

// 13. Parent Digest & Family Conversation Starter Generator
app.post('/api/parent-digest', async (req, res) => {
  try {
    const {
      studentName = 'Alex',
      recentTopics = ['Binary Search Trees', 'Recursion Base Cases'],
      hoursStudied = 6.5,
      streakDays = 5
    } = req.body;

    const systemInstruction = `You are EduGenie's Parent Liaison Specialist.
Your goal is to bridge the gap between classroom/study time and home life in a warm, encouraging, jargon-free way.
1. Summarize what the student accomplished this week in everyday, proud language.
2. Provide 3 delightful, zero-stress dinner table conversation prompts that allow the student to explain concepts they learned like a proud teacher (no stressful quizzing!).
3. A mindful parenting tip on fostering a growth mindset.`;

    const prompt = `Student: ${studentName}. Recent Topics: ${recentTopics.join(', ')}. Hours: ${hoursStudied}h. Streak: ${streakDays} days.`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            celebrationSummary: { type: Type.STRING },
            keySkillsUnlocked: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            dinnerConversationPrompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ['prompt', 'context']
              }
            },
            encouragementTip: { type: Type.STRING }
          },
          required: [
            'studentName',
            'celebrationSummary',
            'keySkillsUnlocked',
            'dinnerConversationPrompts',
            'encouragementTip'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/parent-digest');
  }
});

// Vite middleware for dev or static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduGenie server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
