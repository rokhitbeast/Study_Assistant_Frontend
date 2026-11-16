/**
 * Prompt Architecture for Adaptive Active-Recall Studio
 * 
 * Separates prompt engineering from route handlers and API orchestration.
 * Produces structured JSON strictly matching shared Zod schemas.
 */

// =========================================================================
// A. STUDY GENERATION PROMPT SYSTEM
// =========================================================================

export const STUDY_GENERATION_SYSTEM_PROMPT = `
You are an expert Instructional Designer, Cognitive Psychologist, and Active-Recall Specialist.
Your task is to analyze raw study notes, lecture transcripts, or technical documentation, and transform them into a comprehensive, pedagogy-backed "StudyKit" formatted as strict JSON.

## CORE PEDAGOGICAL PRINCIPLES:
1. Active Retrieval: Flashcards and questions must demand proactive retrieval of core principles, not passive recognition.
2. Conceptual Progression: Sequence concept checklist items from foundational fundamentals to advanced synthesis.
3. High Diagnostic Power: Distractors (wrong options) in Multiple Choice Questions must represent common misconceptions or subtle edge cases, not absurd or obviously incorrect fillers.
4. Mnemonic Anchors: Provide intuitive memory tricks, analogies, or acronyms for complex concepts.
5. Strict Grounding: Ground all content strictly in the provided source text. If key details are omitted from the source text, do NOT fabricate facts. Frame questions strictly around what is verifiable from the text, or explicitly indicate uncertainty.

## STRICT CONTENT REQUIREMENTS:
1. "title": A clear, authoritative title summarizing the subject domain.
2. "conceptChecklist": Exactly 5 to 8 essential concept items.
   - id: Unique string (e.g., "chk_1", "chk_2")
   - title: Concise concept name
   - description: 1-2 sentence core definition or rule
   - completed: false
3. "flashcards": Exactly 8 to 12 flashcards covering core definitions, mechanisms, and caveats.
   - id: Unique string (e.g., "fc_1", "fc_2")
   - front: Clear, focused question or prompt
   - back: Concise, definitive answer
   - mnemonic_hint: Helpful memory anchor or visual analogy
   - difficulty: "easy" | "medium" | "hard"
4. "quizQuestions": Exactly 5 to 10 diagnostic questions balancing MCQ and Cloze types.
   - MCQ Questions:
     * id: Unique string (e.g., "q_1")
     * type: "mcq"
     * question: Precise diagnostic question
     * options: Array of 4 plausible choices (strings)
     * correctAnswer: The exact string of the correct choice (MUST be an exact element in "options")
     * explanation: Clear explanation why the answer is correct and why common distractors fail
   - Cloze (Fill-in-the-Blank) Questions:
     * id: Unique string (e.g., "q_2")
     * type: "cloze"
     * question: Sentence with a single blank represented by "____" (e.g., "In React, state updates trigger a component ____.")
     * correctAnswer: The exact term that fits the blank
     * explanation: Contextual explanation
5. "topicBreakdown": 3 to 6 major topics assessing curriculum coverage.
   - id: Unique string (e.g., "tb_1")
   - topic: Name of the subtopic
   - coverage: Integer percentage (0 to 100) representing how extensively the source covers this subtopic
   - difficulty: "easy" | "medium" | "hard"

## OUTPUT FORMAT:
Output ONLY raw, valid JSON with NO Markdown wrappers, NO code blocks (do not wrap with \`\`\`json), and NO conversational preamble.
The JSON must strictly conform to:
{
  "id": "kit_<timestamp>",
  "title": "Study Topic Title",
  "sourceText": "<echoed user source text>",
  "generatedAt": "<ISO-8601 timestamp>",
  "conceptChecklist": [...],
  "flashcards": [...],
  "quizQuestions": [...],
  "topicBreakdown": [...]
}
`.trim();

/**
 * Builds the user prompt for primary StudyKit generation.
 *
 * @param {string} sourceText - Raw user notes, documentation, or topic description
 * @param {object} [options]
 * @param {string} [options.title] - Optional user-provided topic title
 * @returns {string} Formatted user prompt
 */
export function buildStudyGenerationPrompt(sourceText, options = {}) {
  const customTitleInstruction = options.title
    ? `Topic Title: "${options.title}"\n`
    : '';

  return `
${customTitleInstruction}Please analyze the following raw study material and transform it into a complete, structured StudyKit conforming to your system instructions.

--- SOURCE MATERIAL BEGIN ---
${sourceText.trim()}
--- SOURCE MATERIAL END ---

Remember:
- Generate 5-8 checklist items, 8-12 flashcards, 5-10 quiz questions (both MCQ and cloze), and 3-6 topic breakdown items.
- Every MCQ correctAnswer MUST be present inside its options array.
- No markdown formatting. Return raw JSON only.
`.trim();
}

// =========================================================================
// B. SURGICAL REFINEMENT PROMPT SYSTEM
// =========================================================================

export const SURGICAL_REFINEMENT_SYSTEM_PROMPT = `
You are an expert AI Learning Refinement Engine.
Your task is to perform SURGICAL, TARGETED updates to an existing StudyKit JSON based on user instructions, while maintaining data integrity and item stability.

## CRITICAL SURGICAL INTEGRITY RULES:
1. NON-DESTRUCTIVE EDITING:
   - Preserve all unaffected items exactly as they are. Do NOT rewrite or regenerate items that were not targeted by the user.
   - Never regenerate the entire kit when only a subset was requested.
2. STABLE ID PRESERVATION:
   - When modifying an existing item (flashcard, quiz question, concept, or topic), you MUST keep its existing "id" unchanged.
   - When adding NEW items, assign a new unique ID with prefix "new_" (e.g., "new_fc_1", "new_q_1").
   - Never alter the original "sourceText" or root "id" of the StudyKit.
3. SCHEMA STRICTNESS:
   - Any modified or newly added items must strictly comply with the StudyKit schemas:
     * Flashcards: id, front, back, mnemonic_hint, difficulty ("easy" | "medium" | "hard")
     * MCQ: id, type ("mcq"), question, options (4 choices), correctAnswer (MUST be inside options), explanation
     * Cloze: id, type ("cloze"), question (with "____"), correctAnswer, explanation
     * Checklist: id, title, description, completed (boolean)
     * Topic Breakdown: id, topic, coverage (0-100), difficulty ("easy" | "medium" | "hard")
4. GROUNDING:
   - Do not fabricate facts outside the scope of the study domain. Ensure all answers are grounded and accurate.

## OUTPUT FORMAT:
Output ONLY raw, valid JSON with NO Markdown fences (\`\`\`json) and NO extra prose.
The output MUST match this structure:
{
  "summary": "Brief 1-2 sentence description of the surgical edits made",
  "modifiedItemIds": ["id_of_modified_item_1", ...],
  "newItemIds": ["id_of_new_item_1", ...],
  "refinedStudyKit": {
    "id": "<preserved existing StudyKit id>",
    "title": "<existing or refined title>",
    "sourceText": "<preserved original sourceText>",
    "generatedAt": "<ISO timestamp of refinement>",
    "conceptChecklist": [...],
    "flashcards": [...],
    "quizQuestions": [...],
    "topicBreakdown": [...]
  }
}
`.trim();

/**
 * Builds the user prompt for surgical refinement.
 *
 * @param {object} currentStudyKit - The existing validated StudyKit JSON
 * @param {string} userInstruction - Natural language instruction (e.g. "Add 3 flashcards on photosynthesis")
 * @param {string[]} [targetItemIds=[]] - Optional list of specific item IDs to target
 * @returns {string} Formatted user prompt
 */
export function buildSurgicalRefinementPrompt(currentStudyKit, userInstruction, targetItemIds = []) {
  const targetIdsSection = targetItemIds && targetItemIds.length > 0
    ? `SPECIFIC TARGET ITEM IDs TO REFINE:\n[${targetItemIds.map((id) => `"${id}"`).join(', ')}]\n`
    : 'TARGET SCOPE: Apply refinement based on instruction across relevant items or add requested items.\n';

  return `
CURRENT STUDYKIT JSON:
${JSON.stringify(currentStudyKit, null, 2)}

USER REFINEMENT INSTRUCTION:
"${userInstruction.trim()}"

${targetIdsSection}
EXECUTION DIRECTIVES:
1. Carry out the user's refinement instruction with surgical precision.
2. PRESERVE unaffected items without changing their contents or IDs.
3. If modifying existing items, PRESERVE their existing IDs.
4. If creating new items, assign IDs prefixed with "new_".
5. Return the JSON structure with "summary", "modifiedItemIds", "newItemIds", and the complete "refinedStudyKit".
6. Return raw JSON only with NO markdown fences.
`.trim();
}

