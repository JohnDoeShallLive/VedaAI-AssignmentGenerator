import axios from 'axios';
import { z } from 'zod';
import { AssignmentDocument } from '../models/assignment.model';
import { Section, Question } from '@vedaai/types';

// Zod schemas for validation
const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(8),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  marks: z.number().positive(),
  answer: z.string().optional(),
});

const SectionSchema = z.object({
  title: z.string(),
  instruction: z.string(),
  questions: z.array(QuestionSchema).min(1),
});

const PaperSchema = z.object({
  timeAllowed: z.string(),
  sections: z.array(SectionSchema).min(1),
});

export type GeneratedPaperAIResult = z.infer<typeof PaperSchema>;

// System Prompt
const SYSTEM_PROMPT = `
You are an expert educator assistant. Generate a structured exam question paper as a valid JSON object.
Do NOT include any text, code blocks, or formatting fences (like \`\`\`json) outside the JSON object.
Follow the schema exactly.
`;

// Build User Prompt
export function buildUserPrompt(assignment: AssignmentDocument, extractedText?: string): string {
  const configs = assignment.questionTypes
    .map(q => `- ${q.label}: ${q.count} questions × ${q.marksEach} marks each`)
    .join('\n');

  return `
Generate a question paper with the following configuration:

Subject: ${assignment.subject}
Assignment Title: ${assignment.title}
Additional Instructions: ${assignment.additionalInfo || "None"}
Reference Material / Extracted Text: ${extractedText || "None provided"}

Question Type Configuration:
${configs}

Respond ONLY with a JSON object matching this schema:
{
  "timeAllowed": "string (e.g. '45 minutes', '1 hour', '3 hours')",
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "id": "A1",
          "text": "Clear, subject-specific question text",
          "difficulty": "easy | moderate | hard",
          "marks": 2,
          "answer": "Brief, concise answer for the answer key (1-3 sentences)"
        }
      ]
    }
  ]
}

Rules:
- Map each question type to one section (Section A, Section B, Section C...) in order.
- Set correct question marks inside each section matching the question type configuration.
- Assign appropriate, logical question IDs in sequence (e.g., MCQ1, MCQ2... or A1, A2... or Q1, Q2...).
- Distribute question difficulty logically: approximately 40% easy, 40% moderate, 20% hard.
- Ensure questions are comprehensive, curriculum-appropriate, and directly derived from the reference material if provided.
- Do NOT output markdown code blocks. Respond only with raw JSON.
`;
}

// High-fidelity dynamic fallback generator
export function generateMockPaper(assignment: AssignmentDocument): GeneratedPaperAIResult {
  console.log('[ai.service]: Generating high-fidelity mock paper result');
  
  const subject = assignment.subject.toLowerCase();
  const sections: Section[] = [];
  
  // Dynamic question database based on subject
  const getSubjectQuestion = (type: string, index: number): { text: string; answer: string; difficulty: 'easy' | 'moderate' | 'hard' } => {
    const difficulties: ('easy' | 'moderate' | 'hard')[] = ['easy', 'moderate', 'hard'];
    const difficulty = difficulties[index % 3];

    if (subject.includes('science') || subject.includes('physic') || subject.includes('chem') || subject.includes('bio')) {
      if (type === 'mcq') {
        const mcqs = [
          { text: 'Which of the following is the primary unit of electric current? \n(a) Volt \n(b) Ampere \n(c) Ohm \n(d) Watt', answer: '(b) Ampere. It measures the rate of flow of electric charge.', difficulty: 'easy' as const },
          { text: 'What is the chemical symbol for the element Gold? \n(a) Ag \n(b) Au \n(c) Fe \n(d) Pb', answer: '(b) Au. The symbol is derived from its Latin name Aurum.', difficulty: 'easy' as const },
          { text: 'Which component in human blood is primarily responsible for oxygen transportation? \n(a) White Blood Cells \n(b) Platelets \n(c) Red Blood Cells \n(d) Plasma', answer: '(c) Red Blood Cells contain hemoglobin which binds to oxygen molecules.', difficulty: 'moderate' as const },
          { text: 'During cellular respiration, in which organelle is ATP synthesized? \n(a) Nucleus \n(b) Ribosome \n(c) Mitochondrion \n(d) Golgi Apparatus', answer: '(c) Mitochondrion is the powerhouse of the cell where aerobic respiration occurs.', difficulty: 'moderate' as const },
        ];
        return mcqs[index % mcqs.length];
      }
      if (type === 'short') {
        const shortQ = [
          { text: 'Explain Ohm\'s Law and state its formula.', answer: 'Ohm\'s Law states that the current passing through a conductor is directly proportional to the potential difference across it, provided physical conditions remain constant. Formula: V = I * R.', difficulty: 'easy' as const },
          { text: 'Distinguish between physical and chemical changes with one example each.', answer: 'Physical changes are temporary, reversible, and do not create new substances (e.g. melting ice). Chemical changes are permanent, irreversible, and yield new substances (e.g. burning wood).', difficulty: 'moderate' as const },
          { text: 'State the function of stomata in plant leaves.', answer: 'Stomata are microscopic pores that regulate gas exchange (carbon dioxide intake and oxygen release) during photosynthesis and control water loss via transpiration.', difficulty: 'easy' as const },
        ];
        return shortQ[index % shortQ.length];
      }
      if (type === 'diagram') {
        const diagrams = [
          { text: 'Draw a labelled schematic diagram of an electric circuit containing a cell, switch, ammeter, resistor and voltmeter across the resistor.', answer: 'Schematic should show series connections for cell, switch, ammeter and resistor, with a voltmeter connected in parallel across the resistor. Arrow marks flow from positive to negative terminal.', difficulty: 'moderate' as const },
          { text: 'Observe a typical animal cell diagram and identify the organelles that synthesize proteins and packages secretory substances.', answer: 'Proteins are synthesized by ribosomes (often attached to rough ER), and packaging is handled by the Golgi apparatus.', difficulty: 'hard' as const },
        ];
        return diagrams[index % diagrams.length];
      }
      if (type === 'numerical') {
        const num = [
          { text: 'Calculate the total resistance when three resistors of 2 ohms, 4 ohms, and 6 ohms are connected in parallel.', answer: 'For parallel circuits, 1/Rp = 1/R1 + 1/R2 + 1/R3 = 1/2 + 1/4 + 1/6 = (6 + 3 + 2)/12 = 11/12. Therefore, Rp = 12/11 = 1.09 ohms.', difficulty: 'hard' as const },
          { text: 'An object is placed at a distance of 15 cm in front of a convex lens of focal length 10 cm. Find the position and nature of the image formed.', answer: 'Using lens formula 1/f = 1/v - 1/u. Here f = +10, u = -15. So 1/v = 1/10 + 1/-15 = 1/30. v = +30 cm. The image is real, inverted and formed at 30cm on the other side.', difficulty: 'hard' as const },
        ];
        return num[index % num.length];
      }
      // long answer
      const longAns = [
        { text: 'Describe the structure and functioning of human nephron with a neat explanation of ultrafiltration, reabsorption, and secretion.', answer: 'The nephron is the functional unit of kidney. In the Bowman capsule, blood undergoes ultrafiltration. Useful substances (glucose, salts, water) are selectively reabsorbed along the Henle loop and tubules. Waste is secreted into collecting ducts as urine.', difficulty: 'hard' as const },
        { text: 'State the modern periodic law. Explain how atomic size, valency, and metallic character change while moving down a group and across a period.', answer: 'Modern Periodic Law states that properties of elements are periodic functions of atomic numbers. Down group: atomic size & metallic nature increase, valency remains constant. Across period: size & metallic nature decrease, valency increases then decreases.', difficulty: 'hard' as const },
      ];
      return longAns[index % longAns.length];
    } else if (subject.includes('math') || subject.includes('algebra') || subject.includes('geom')) {
      if (type === 'mcq') {
        const mathMCQ = [
          { text: 'What is the value of x if 3x - 7 = 14? \n(a) 5 \n(b) 6 \n(c) 7 \n(d) 8', answer: '(c) 7. Solving: 3x = 21 => x = 7.', difficulty: 'easy' as const },
          { text: 'If a triangle has sides 6 cm, 8 cm and 10 cm, what type of triangle is it? \n(a) Equilateral \n(b) Isosceles \n(c) Right-angled \n(d) Acute-angled', answer: '(c) Right-angled. Since 6^2 + 8^2 = 36 + 64 = 100 = 10^2.', difficulty: 'easy' as const },
          { text: 'Find the value of log(100) to base 10. \n(a) 1 \n(b) 2 \n(c) 10 \n(d) 100', answer: '(b) 2. Since 10^2 = 100, the logarithm is 2.', difficulty: 'easy' as const },
          { text: 'What is the derivative of x^2 + 5x with respect to x? \n(a) 2x \n(b) 2x + 5 \n(c) x + 5 \n(d) 2x^2 + 5', answer: '(b) 2x + 5. Using the power rule.', difficulty: 'moderate' as const },
          { text: 'If sin(θ) = 3/5, what is the value of cos(θ) for an acute angle θ? \n(a) 4/5 \n(b) 3/4 \n(c) 5/4 \n(d) 1/5', answer: '(a) 4/5. Using the identity sin^2(θ) + cos^2(θ) = 1.', difficulty: 'moderate' as const }
        ];
        return mathMCQ[index % mathMCQ.length];
      }
      if (type === 'short') {
        const mathShort = [
          {
            text: `Evaluate the quadratic equation: x^2 - 5x + 6 = 0 and solve for roots.`,
            answer: 'Factorizing gives (x - 2)(x - 3) = 0. Therefore, the roots are x = 2 and x = 3.',
            difficulty: 'moderate' as const
          },
          {
            text: 'Find the 10th term of the Arithmetic Progression (AP): 2, 7, 12, 17...',
            answer: 'Here a = 2, d = 5. Using formula an = a + (n-1)d, a10 = 2 + 9(5) = 47.',
            difficulty: 'easy' as const
          },
          {
            text: 'State the Pythagorean theorem and write its algebraic expression.',
            answer: 'In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides. Expression: a^2 + b^2 = c^2.',
            difficulty: 'easy' as const
          }
        ];
        return mathShort[index % mathShort.length];
      }
      if (type === 'numerical') {
        const mathNum = [
          {
            text: `A sum of money doubles itself in 8 years under simple interest. Find the rate of interest per annum.`,
            answer: 'Let Principal be P. Interest = P. Time = 8. SI = (P * R * T)/100 => P = (P * R * 8)/100 => R = 100/8 = 12.5% per annum.',
            difficulty: 'hard' as const
          },
          {
            text: 'Calculate the area of a circle whose circumference is 44 cm. (Take pi = 22/7)',
            answer: 'Circumference = 2 * pi * r = 44 => 2 * (22/7) * r = 44 => r = 7 cm. Area = pi * r^2 = (22/7) * 49 = 154 sq cm.',
            difficulty: 'moderate' as const
          },
          {
            text: 'Solve the system of linear equations: 2x + 3y = 12 and x - y = 1.',
            answer: 'From second equation, x = y + 1. Substitute in first: 2(y + 1) + 3y = 12 => 5y = 10 => y = 2. Then x = 3.',
            difficulty: 'moderate' as const
          }
        ];
        return mathNum[index % mathNum.length];
      }
      const mathLong = [
        {
          text: `Prove that the angles opposite to equal sides of an isosceles triangle are equal.`,
          answer: 'By drawing a bisector to the base from vertex, we prove two sub-triangles congruent by SAS. Hence, base angles are equal by CPCT.',
          difficulty: 'hard' as const
        },
        {
          text: 'Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact.',
          answer: 'Let XY be tangent to circle at P. Take point Q on XY. Since Q lies outside circle, OQ > OP. Thus, OP is shortest distance from O to XY, implying OP is perpendicular to XY.',
          difficulty: 'hard' as const
        }
      ];
      return mathLong[index % mathLong.length];
    } else {
      // General Humanities / English / History
      if (type === 'mcq') {
        const mcqs = [
          {
            text: 'Who was the first President of independent India? \n(a) Dr. B.R. Ambedkar \n(b) Mahatma Gandhi \n(c) Dr. Rajendra Prasad \n(d) Jawaharlal Nehru',
            answer: '(c) Dr. Rajendra Prasad served from 1950 to 1962.',
            difficulty: 'easy' as const
          },
          {
            text: 'Which historical document begins with the words "We the People"? \n(a) The Magna Carta \n(b) The Constitution of the United States \n(c) The Declaration of Independence \n(d) The Articles of Confederation',
            answer: '(b) The Constitution of the United States begins with this preamble.',
            difficulty: 'easy' as const
          },
          {
            text: 'Who wrote the play "Romeo and Juliet"? \n(a) William Wordsworth \n(b) William Shakespeare \n(c) John Milton \n(d) Geoffrey Chaucer',
            answer: '(b) William Shakespeare wrote the tragedy in the late 16th century.',
            difficulty: 'easy' as const
          },
          {
            text: 'Which civilization constructed the ancient city of Machu Picchu? \n(a) The Aztecs \n(b) The Mayans \n(c) The Incas \n(d) The Mesopotamians',
            answer: '(c) The Incas built it in the Andes Mountains of Peru.',
            difficulty: 'moderate' as const
          }
        ];
        return mcqs[index % mcqs.length];
      }
      if (type === 'short') {
        const shortQ = [
          {
            text: 'Discuss two major consequences of the Industrial Revolution in Europe.',
            answer: '1. Massive urbanization as agricultural workers shifted to industrial cities. 2. Emergence of two main social classes: factory owners (capitalists) and industrial workers (proletariat).',
            difficulty: 'moderate' as const
          },
          {
            text: 'Briefly explain the main cause of the Boston Tea Party of 1773.',
            answer: 'It was a political protest by the Sons of Liberty in Boston against the Tea Act imposed by the British government, which taxed imported tea without colonial representation.',
            difficulty: 'moderate' as const
          },
          {
            text: 'Define the term "Democracy" and state its literal Greek origin.',
            answer: 'Democracy is a system of government where power is vested in the people. The word comes from the Greek "demos" (people) and "kratos" (power/rule).',
            difficulty: 'easy' as const
          }
        ];
        return shortQ[index % shortQ.length];
      }
      const longAns = [
        {
          text: 'Analyze the significance of the French Revolution in promoting global democracy.',
          answer: 'The French Revolution introduced the core democratic ideals of liberty, equality, and fraternity. It triggered the collapse of absolute monarchies globally and paved the way for constitutional governments.',
          difficulty: 'hard' as const
        },
        {
          text: 'Examine the key factors that led to the outbreak of World War I in 1914.',
          answer: 'The key factors included the rise of intense nationalism, imperialistic rivalry, secret alliance systems (Triple Entente vs. Triple Alliance), and the immediate catalyst: the assassination of Archduke Franz Ferdinand.',
          difficulty: 'hard' as const
        }
      ];
      return longAns[index % longAns.length];
    }
  };

  // Build sections from configs
  const sectionsAlphabet = 'ABCDE';
  
  assignment.questionTypes.forEach((config, secIdx) => {
    const secLetter = sectionsAlphabet[secIdx % sectionsAlphabet.length];
    const qList: Question[] = [];
    
    for (let i = 0; i < config.count; i++) {
      const qNum = i + 1;
      const questionId = `${config.type.toUpperCase()}${qNum}`;
      const questionTemplate = getSubjectQuestion(config.type, i);
      
      qList.push({
        id: questionId,
        text: questionTemplate.text,
        difficulty: questionTemplate.difficulty,
        marks: config.marksEach,
        answer: questionTemplate.answer,
      });
    }

    sections.push({
      title: `Section ${secLetter}`,
      instruction: `Attempt all questions in this section. Each question carries ${config.marksEach} ${config.marksEach === 1 ? 'mark' : 'marks'}.`,
      questions: qList,
    });
  });

  // Calculate sum of questions
  const totalQuestionsCount = assignment.questionTypes.reduce((sum, q) => sum + q.count, 0);
  
  // Decide time allowed
  let timeAllowed = '45 minutes';
  if (totalQuestionsCount > 15) {
    timeAllowed = '3 hours';
  } else if (totalQuestionsCount > 7) {
    timeAllowed = '1.5 hours';
  }

  // Determine total marks
  const totalMarks = assignment.questionTypes.reduce((sum, q) => sum + (q.count * q.marksEach), 0);

  return {
    timeAllowed,
    sections,
  };
}

export async function generatePaperFromLLM(
  assignment: AssignmentDocument,
  extractedText?: string
): Promise<GeneratedPaperAIResult> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const isGroqConfigured = groqApiKey && groqApiKey.trim() !== '' && groqApiKey !== 'your_groq_api_key_here';
  const isOpenaiConfigured = openaiApiKey && openaiApiKey.trim() !== '' && openaiApiKey !== 'your_openai_api_key_here';

  if (!isGroqConfigured && !isOpenaiConfigured) {
    console.log('[ai.service]: No API key detected for Groq or OpenAI. Falling back to dynamic mock paper generator.');
    return generateMockPaper(assignment);
  }

  const userPrompt = buildUserPrompt(assignment, extractedText);

  try {
    let url = 'https://api.openai.com/v1/chat/completions';
    let apiKey = '';
    let model = 'gpt-4o-mini';

    if (isGroqConfigured) {
      console.log('[ai.service]: Making request to Groq endpoint...');
      url = 'https://api.groq.com/openai/v1/chat/completions';
      apiKey = groqApiKey!;
      model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    } else {
      console.log('[ai.service]: Making request to OpenAI GPT-4o-mini endpoint...');
      apiKey = openaiApiKey!;
    }

    const response = await axios.post(
      url,
      {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 40000, // 40 second timeout
      }
    );

    const jsonString = response.data?.choices?.[0]?.message?.content;
    if (!jsonString) {
      throw new Error(`Received empty response from ${isGroqConfigured ? 'Groq' : 'OpenAI'}`);
    }

    const parsedJson = JSON.parse(jsonString);
    
    // Validate schema with Zod
    const validatedResult = PaperSchema.parse(parsedJson);
    console.log(`[ai.service]: Successfully parsed and validated ${isGroqConfigured ? 'Groq' : 'OpenAI'} response.`);
    
    return validatedResult;
  } catch (error: any) {
    console.error(`[ai.service]: ${isGroqConfigured ? 'Groq' : 'OpenAI'} API Call failed or validation errored:`, error?.message || error);
    console.log('[ai.service]: Errored out during LLM call. Falling back to mock paper generator to ensure zero crash experience.');
    
    // Provide fallback
    return generateMockPaper(assignment);
  }
}

export async function extractTextFromFile(filePath: string): Promise<string> {
  const fs = require('fs');
  const path = require('path');
  const pdfParse = require('pdf-parse');

  const ext = path.extname(filePath).toLowerCase();
  
  if (!fs.existsSync(filePath)) {
    console.error(`[ai.service]: File not found at path: ${filePath}`);
    return '';
  }

  try {
    if (ext === '.pdf') {
      console.log(`[ai.service]: Parsing PDF file: ${filePath}`);
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      console.log(`[ai.service]: Successfully extracted ${data.text ? data.text.length : 0} characters from PDF.`);
      return data.text || '';
    } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      console.log(`[ai.service]: Running OCR via Groq Vision for image file: ${filePath}`);
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_api_key_here') {
        console.warn('[ai.service]: Groq API Key not configured. Skipping image OCR.');
        return '';
      }

      // Convert image to base64
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      const base64Url = `data:${mimeType};base64,${base64Image}`;

      // Call Groq Vision API
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract and transcribe all text (like poems, notes, questions, descriptions) from this image. Do not write any introduction, pleasantries, or commentary. Simply output the transcribed text exactly as it appears in the image.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64Url
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        }
      );

      const extractedText = response.data?.choices?.[0]?.message?.content;
      if (!extractedText) {
        throw new Error('Groq Vision returned empty text');
      }

      console.log(`[ai.service]: Successfully extracted ${extractedText.length} characters using Groq Vision OCR.`);
      return extractedText;
    } else {
      console.warn(`[ai.service]: Unsupported file type: ${ext}`);
      return '';
    }
  } catch (error: any) {
    console.error(`[ai.service]: File text extraction failed for ${filePath}:`, error.message || error);
    return '';
  }
}
