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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// 4. Adaptive Quiz & Practice Test Engine
app.post('/api/quiz', async (req, res) => {
  try {
    const {
      topic,
      count = 5,
      difficulty = 'intermediate',
      focusArea = '',
      mode = 'diagnostic',
      examStyle = 'standard',
      sourceText = '',
      subject = 'General Education',
      gradeLevel = 'College / Undergraduate'
    } = req.body;

    if (!topic && !sourceText) {
      return res.status(400).json({ error: 'Topic or source text is required.' });
    }

    const questionCount = Math.min(Math.max(Number(count) || 5, 3), 20);

    const styleDescriptions: Record<string, string> = {
      standard: 'Standard standardized academic multiple-choice format with conceptual clarity and high validity.',
      ap_collegiate: 'Advanced Placement / Collegiate Exam rigor with multi-tiered stems, stimulus charts/data, and analytical depth.',
      stem_quantitative: 'Rigorous calculation and quantitative problem solving with numerical scenarios, formulas, and exact units.',
      clinical_vignette: 'Case-based clinical or situational scenarios testing differential reasoning, decision trees, and best practice evaluation.'
    };

    const systemInstruction = `You are EduGenie's Principal Assessment Designer & Psychometric Testing Specialist.
Academic Context:
- Subject: ${subject}
- Grade Level: ${gradeLevel}
- Assessment Mode: ${mode} (${mode === 'practice_exam' ? 'Full simulated timed practice exam' : mode === 'custom_mcq' ? 'Targeted multiple choice mastery' : 'Diagnostic formative assessment'})
- Exam Style: ${examStyle} - ${styleDescriptions[examStyle] || styleDescriptions.standard}

Guidelines for Item Generation:
1. Construct unambiguous, high-yield multiple-choice questions testing genuine conceptual understanding, problem-solving, and cognitive depth (Bloom's Taxonomy).
2. Avoid trivial recall or grammatical clues. Distractors must represent plausible, realistic misconceptions, common calculation pitfalls, or cognitive biases.
3. For EVERY option (A, B, C, D), generate a precise distractor rationale explaining why that option is correct or specifically why it is a false lead.
4. Estimate realistic time-to-solve in seconds (e.g. 60-120 seconds).
5. Categorize each question by subtopic, difficulty level, and cognitive Bloom level (Remembering, Understanding, Applying, Analyzing, Evaluating).
${sourceText ? `Base the questions primarily on the provided source notes/textbook text: "${sourceText.slice(0, 3000)}"` : ''}`;

    const promptText = `Generate a ${questionCount}-question ${mode === 'practice_exam' ? 'comprehensive practice exam' : 'assessment'} for: "${topic || 'Provided Source Notes'}".
Target Difficulty: ${difficulty}.
Exam Style: ${examStyle}.
${focusArea ? `Focus Area / Core Competencies: ${focusArea}` : ''}
Ensure varied Bloom cognitive levels, distractor breakdowns for all options, and actionable explanations.`;

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
            examStyle: { type: Type.STRING },
            mode: { type: Type.STRING },
            recommendedTimeMinutes: { type: Type.INTEGER },
            overviewDescription: { type: Type.STRING },
            subtopicsCovered: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
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
                  explanation: { type: Type.STRING, description: 'Deep pedagogical explanation of the correct answer' },
                  hint: { type: Type.STRING, description: 'Socratic nudge without spoiling the answer' },
                  conceptTested: { type: Type.STRING },
                  bloomLevel: {
                    type: Type.STRING,
                    description: 'Remembering, Understanding, Applying, Analyzing, or Evaluating'
                  },
                  subtopic: { type: Type.STRING },
                  difficulty: { type: Type.STRING, description: 'easy, medium, or hard' },
                  timeEstimateSeconds: { type: Type.INTEGER },
                  distractorRationales: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        optionIndex: { type: Type.INTEGER },
                        optionLetter: { type: Type.STRING },
                        text: { type: Type.STRING },
                        rationale: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN }
                      },
                      required: ['optionIndex', 'optionLetter', 'text', 'rationale', 'isCorrect']
                    }
                  }
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'hint', 'conceptTested']
              }
            }
          },
          required: ['quizTitle', 'topic', 'targetDifficulty', 'questions', 'recommendedTimeMinutes']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/quiz');
  }
});

// 4b. Practice Test Diagnostic Analysis
app.post('/api/quiz/diagnostics', async (req, res) => {
  try {
    const {
      quizTitle,
      topic,
      examStyle = 'standard',
      totalQuestions,
      correctCount,
      timeTakenSeconds = 0,
      questionSummaries = []
    } = req.body;

    const percentage = Math.round(((correctCount || 0) / (totalQuestions || 1)) * 100);

    const systemInstruction = `You are EduGenie's Senior Learning Analytics & Diagnostic Specialist.
Given a student's performance on a quiz or practice exam:
- Topic: ${topic}
- Exam Style: ${examStyle}
- Score: ${correctCount} / ${totalQuestions} (${percentage}%)
- Time Taken: ${Math.round(timeTakenSeconds / 60)} minutes

Analyze their results to:
1. Provide an objective Projected Grade / Percentile estimation (e.g. AP 5 / 92nd percentile, or College A-).
2. Identify the root-cause cognitive misconceptions behind any missed items.
3. Formulate a 3-step prioritized action plan for targeted remediation.`;

    const promptText = `Analyze this test attempt:
Test Title: "${quizTitle}"
Score: ${correctCount}/${totalQuestions} (${percentage}%)
Questions Summary: ${JSON.stringify(questionSummaries.slice(0, 15))}`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectedGradeOrPercentile: { type: Type.STRING },
            summaryAssessment: { type: Type.STRING },
            misconceptionInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  misconception: { type: Type.STRING },
                  remedy: { type: Type.STRING },
                  questionIndex: { type: Type.INTEGER }
                },
                required: ['misconception', 'remedy', 'questionIndex']
              }
            },
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['projectedGradeOrPercentile', 'summaryAssessment', 'misconceptionInsights', 'nextSteps']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/quiz/diagnostics');
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

// 7. Personalized Study Plan & Schedule Architect
app.post('/api/study-plan', async (req, res) => {
  try {
    const {
      goal,
      subject = 'General STEM',
      gradeLevel = 'College / Undergraduate',
      durationWeeks = 4,
      dailyHours = 2,
      currentLevel = 'Beginner',
      targetOutcome = 'Exam Mastery & High Grade',
      weakAreas = '',
      schedulePreference = '5 days/week'
    } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required.' });
    }

    const systemInstruction = `You are EduGenie's Principal Learning Strategist & Study Plan Architect.
Create a highly personalized, realistic, and motivating day-by-day study roadmap tailored to the student's:
- Subject: ${subject}
- Academic Level: ${gradeLevel}
- Specific Goal: ${goal}
- Target Outcome: ${targetOutcome}
- Known Weaknesses / Focus Areas: ${weakAreas || 'Foundational to advanced progression'}
- Available Time: ${dailyHours} hours/day across ${durationWeeks} weeks (${schedulePreference})
- Starting Level: ${currentLevel}

Pedagogical Structure:
1. Break down into sequential milestone weeks (Theory -> Guided Application -> Synthesis & Timed Practice -> Final Exam Readiness).
2. For each day, provide a concrete title, specific concept focus, time allocation, and recommended action.
3. Recommend corresponding EduGenie tools ('quiz', 'chat', 'flashcards', 'solver', 'notes') to keep study sessions engaging.
4. Include evidence-based cognitive retention advice (spaced repetition, Pomodoro intervals, active recall).`;

    const promptText = `Generate a personalized ${durationWeeks}-week study plan for:
Subject: "${subject}"
Goal: "${goal}"
Target Outcome: "${targetOutcome}"
Daily Study Time: ${dailyHours} hours/day
Starting Proficiency: ${currentLevel}
Weak Areas: ${weakAreas || 'None specified'}`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            targetOutcome: { type: Type.STRING },
            estimatedHoursTotal: { type: Type.INTEGER },
            coreCompetencies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            personalizedAdvice: { type: Type.STRING },
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
                        taskType: { type: Type.STRING, description: 'theory, practice, quiz, review, or project' },
                        keyAction: { type: Type.STRING, description: 'Specific active exercise to complete' },
                        recommendedTool: { type: Type.STRING, description: 'quiz, chat, flashcards, solver, or notes' }
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

// 7b. Free-Response Answer Evaluator & Diagnostic Feedback
app.post('/api/answer-feedback', async (req, res) => {
  try {
    const {
      question,
      studentAnswer,
      subject = 'General Education',
      gradeLevel = 'College / Undergraduate',
      rubricOrCriteria = ''
    } = req.body;

    if (!question || !studentAnswer) {
      return res.status(400).json({ error: 'Question and student answer are required.' });
    }

    const systemInstruction = `You are EduGenie's Lead Educational Evaluator & Diagnostic Feedback Specialist.
Your mission is to provide rigorous, constructive, encouraging, and clear feedback on a student's answer.
Academic Context:
- Subject: ${subject}
- Grade Level: ${gradeLevel}

Evaluation Guidelines:
1. Be objective, supportive, and pedagogically precise.
2. Praise specific accurate points and sound intuition first.
3. Explicitly itemize 'areasNeedingImprovement'—identifying what was missing, incomplete, or flawed.
4. Highlight any cognitive misconceptions with clear explanations and the exact correction.
5. Provide a polished 'modelAnswer' demonstrating how a master student or subject expert would formulate a top-tier response.
6. Provide a quick follow-up challenge question to immediately reinforce learning.`;

    const promptText = `Question / Problem Prompt:
"""
${question}
"""

Student's Submitted Answer:
"""
${studentAnswer}
"""

${rubricOrCriteria ? `Grading Criteria / Rubric:\n${rubricOrCriteria}` : ''}`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scorePercentage: { type: Type.INTEGER, description: 'Score from 0 to 100' },
            gradeLetter: { type: Type.STRING, description: 'e.g. A+, A, B+, B, C, D, or F' },
            quickVerdict: { type: Type.STRING, description: '1-sentence encouraging summary verdict' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'What the student explained or solved correctly'
            },
            areasNeedingImprovement: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Concrete areas that were incomplete, missing, or need work'
            },
            misconceptionsIdentified: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  misconception: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  correction: { type: Type.STRING }
                },
                required: ['misconception', 'explanation', 'correction']
              }
            },
            modelAnswer: {
              type: Type.STRING,
              description: 'Exemplary, well-reasoned model answer with complete clarity'
            },
            actionableNextStep: { type: Type.STRING },
            followUpChallenge: { type: Type.STRING }
          },
          required: [
            'scorePercentage',
            'gradeLetter',
            'quickVerdict',
            'strengths',
            'areasNeedingImprovement',
            'misconceptionsIdentified',
            'modelAnswer',
            'actionableNextStep'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/answer-feedback');
  }
});

// 8. Concise Notes & High-Yield Synthesizer
app.post('/api/notes-synthesizer', async (req, res) => {
  try {
    const {
      rawText,
      format = 'cornell',
      lengthPreference = 'balanced',
      title = 'Study Materials Synthesis',
      subject = 'General Education',
      gradeLevel = 'College / Undergraduate'
    } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'Study materials / text content is required.' });
    }

    const systemInstruction = `You are EduGenie's Master Academic Synthesizer.
Your goal is to summarize lengthy study materials (textbooks, lecture transcripts, research articles, or notes) into extraordinarily concise, high-yield, structured study notes.
Subject: ${subject}
Academic Level: ${gradeLevel}
Target Format: ${format} (options: 'cornell', 'cheat_sheet', 'executive_outline', 'flashcard_qa')
Density Preference: ${lengthPreference} ('ultra_concise', 'balanced', or 'comprehensive')

Key Pedagogical Requirements:
1. Distill complex text down to its fundamental conceptual pillars without losing critical nuances or formulas.
2. Formulate active-recall Cornell cues (inquisitive prompt questions on the left, punchy structured notes on the right).
3. Extract essential definitions, equations, or theorems with importance annotations.
4. Pinpoint frequent 'examTraps'—the most common misconceptions or errors students make on this topic.
5. Provide actionable 'cheatSheetRules' or memory aids.`;

    const promptText = `Title: "${title}". Format: "${format}". Density: "${lengthPreference}".
Lengthy Source Material:
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
            highLevelSummary: { type: Type.STRING, description: 'Punchy 2-3 sentence executive summary' },
            readingTimeMinutes: { type: Type.INTEGER, description: 'Estimated minutes to read original vs notes' },
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
            },
            examTraps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tricky questions or common errors on tests'
            },
            cheatSheetRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Golden rules, mnemonics, or shortcuts'
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

// 8b. Step-by-Step Concept Explainer
app.post('/api/concept-explainer', async (req, res) => {
  try {
    const {
      concept,
      subject = 'STEM & General Science',
      gradeLevel = 'College / Undergraduate',
      targetAudience = 'A determined student seeking deep intuition'
    } = req.body;

    if (!concept) {
      return res.status(400).json({ error: 'Concept name is required.' });
    }

    const systemInstruction = `You are EduGenie's Lead Socratic Concept Explainer.
Your mission is to break down difficult, counterintuitive, or intimidating concepts step-by-step so any student can achieve true, lasting mastery.
Target Concept: "${concept}"
Subject Context: ${subject}
Level: ${gradeLevel}

Pedagogical Structure:
1. Provide a memorable real-world intuitive metaphor that grounds the abstraction immediately.
2. Break the explanation down into 4-6 progressive chronological steps:
   - Step 1: The Core Motivation / Why does this concept exist?
   - Step 2: The Core Mechanism / How does it work physically or logically?
   - Step 3: The Formal Rules, Mathematics, or Pathway.
   - Step 4: A concrete Walkthrough / Worked Example.
   - Step 5: The Crucial Nuance or Caveat.
3. Call out the exact common misconceptions students struggle with.
4. Provide 2 interactive self-check questions with detailed answers so students can verify their grasp.`;

    const promptText = `Explain this difficult concept step by step:
Concept: "${concept}"
Subject: "${subject}"
Grade Level: "${gradeLevel}"
Audience: "${targetAudience}"`;

    const response = await generateWithFallback({
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptName: { type: Type.STRING },
            coreIntuitionSummary: { type: Type.STRING },
            difficultyLevel: { type: Type.STRING, description: 'Foundational, Intermediate, or Advanced' },
            category: { type: Type.STRING },
            intuitiveMetaphor: { type: Type.STRING, description: 'Vivid, memorable analogy' },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  stageTitle: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  analogyOrVisual: { type: Type.STRING },
                  keyRuleOrFormula: { type: Type.STRING },
                  pitfallToAvoid: { type: Type.STRING }
                },
                required: ['stepNumber', 'stageTitle', 'subtitle', 'explanation']
              }
            },
            realWorldScenario: { type: Type.STRING },
            commonMisconceptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            selfCheckQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['question', 'answer', 'explanation']
              }
            },
            masteryTakeaway: { type: Type.STRING }
          },
          required: [
            'conceptName',
            'coreIntuitionSummary',
            'difficultyLevel',
            'category',
            'intuitiveMetaphor',
            'steps',
            'realWorldScenario',
            'commonMisconceptions',
            'selfCheckQuestions',
            'masteryTakeaway'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/concept-explainer');
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

// 14. Multimodal Document & Image Analysis (Summarize, Visual Solver, Key Terms, Flashcards)
app.post('/api/document-vision/analyze', async (req, res) => {
  try {
    const {
      fileData,
      mimeType = 'image/png',
      fileName = 'uploaded_document',
      mode = 'summarize',
      userPrompt = '',
      subject = 'General Education',
      gradeLevel = 'College / Undergraduate'
    } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'File data (base64) is required.' });
    }

    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');

    const systemInstruction = `You are EduGenie's Multimodal Academic Vision and Document Specialist.
Analyze the provided document, image, chart, whiteboard, handwritten problem, or PDF page.
Academic Context:
- Subject: ${subject}
- Grade Level: ${gradeLevel}
- Processing Mode: ${mode}
${userPrompt ? `- User Specific Focus: "${userPrompt}"` : ''}

Your tasks:
1. Identify the document type ('diagram', 'handwritten_notes', 'textbook_page', 'scientific_paper', or 'syllabus_or_assignment').
2. Provide an accurate, pedagogical executive summary of the content.
3. Extract key insights, mechanisms, or principles.
4. If equations, formulas, or specialized terminology appear in the visual or text, extract them with contextual explanations.
5. If the user requested problem solving or if a problem/exercise is detected, generate a step-by-step mathematical/conceptual solution with step justifications and a sanity check.
6. Provide 4 thoughtful follow-up questions for deeper student exploration.
7. Generate 3 high-yield active recall flashcard prompts derived directly from the document.`;

    const promptText = `Analyze this ${mimeType.includes('pdf') ? 'PDF document' : 'image'} in detail.
File name: "${fileName}".
Mode: "${mode}".
${userPrompt ? `Specific focus/question: "${userPrompt}"` : 'Extract key takeaways, core formulas, and pedagogical insights.'}`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    ];

    const response = await generateWithFallback({
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mode: { type: Type.STRING },
            documentTitle: { type: Type.STRING },
            detectedType: {
              type: Type.STRING,
              description: 'diagram, handwritten_notes, textbook_page, scientific_paper, or syllabus_or_assignment'
            },
            executiveSummary: { type: Type.STRING },
            keyInsightsOrPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            extractedFormulasOrTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  termOrFormula: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  locationContext: { type: Type.STRING }
                },
                required: ['termOrFormula', 'explanation']
              }
            },
            stepByStepSolution: {
              type: Type.OBJECT,
              properties: {
                identifiedProblem: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stepNumber: { type: Type.INTEGER },
                      action: { type: Type.STRING },
                      justification: { type: Type.STRING }
                    },
                    required: ['stepNumber', 'action', 'justification']
                  }
                },
                finalResultOrTakeaway: { type: Type.STRING },
                verificationSanityCheck: { type: Type.STRING }
              },
              required: ['identifiedProblem', 'steps', 'finalResultOrTakeaway', 'verificationSanityCheck']
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            flashcardPrompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  mnemonic: { type: Type.STRING }
                },
                required: ['front', 'back']
              }
            }
          },
          required: [
            'mode',
            'documentTitle',
            'detectedType',
            'executiveSummary',
            'keyInsightsOrPoints',
            'suggestedQuestions'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/document-vision/analyze');
  }
});

// 15. Multimodal Document & Image Question Answering (Q&A)
app.post('/api/document-vision/qa', async (req, res) => {
  try {
    const {
      fileData,
      mimeType = 'image/png',
      question,
      subject = 'General Education',
      gradeLevel = 'College / Undergraduate'
    } = req.body;

    if (!fileData || !question) {
      return res.status(400).json({ error: 'File data and question are required.' });
    }

    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');

    const systemInstruction = `You are EduGenie's Multimodal Study Tutor specializing in visual and document-based inquiry.
A student is asking a specific question regarding the uploaded image, diagram, textbook page, or PDF.
Subject: ${subject}, Grade Level: ${gradeLevel}.

Requirements:
1. Ground your answer strictly in the visual/textual evidence presented in the file.
2. If citing a diagram part, figure, paragraph, or formula, reference where it is located.
3. Provide a clear, intuitive answer.
4. Formulate a Socratic follow-up question that challenges the student to think one step further.
5. List 2-3 related concepts.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Question about this document/image: "${question}"`,
          },
        ],
      },
    ];

    const response = await generateWithFallback({
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            directEvidenceOrQuote: { type: Type.STRING },
            socraticFollowUp: { type: Type.STRING },
            relatedConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'question',
            'answer',
            'directEvidenceOrQuote',
            'socraticFollowUp',
            'relatedConcepts'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGenAiError(res, error, 'Error in /api/document-vision/qa');
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
