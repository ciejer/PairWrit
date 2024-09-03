import express from 'express';
import cors from 'cors';
import axios from 'axios';
require('dotenv').config();

// Access the OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  console.log('Received req:', req);
  const prompt = req.body as Array<{ placeholder?: number; pinned?: string; title?: string }>;
  console.log('Received prompt:', JSON.stringify(prompt));

  if (!prompt) {
    return res.status(400).send('Prompt is required');
  }

  let attempt = 0;
  const maxRetries = 3;
  let success = false;
  let generatedContent = '';

  const presetMultiplier = 2;
  let staticDiffAllowed = 100;
  let percentDiffAllowed = 0.7;

  while (attempt < maxRetries && !success) {
    try {
      // Assuming prompt is a JSON string
      let user_prompt = JSON.stringify([{ title: req.body.title }, ...prompt]);
      console.log('User prompt:', user_prompt);
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Populate this json array representing a document, replacing each "placeholder" character count with fully written "draft" text in the same place.
            You must keep the "pinned" text as is - do not even fix typos!
            You may receive a "template" string to guide your writing. This template will contain Markdown, and is to be used for structure and style only.
            You may receive a "style" string to guide your writing. If set, this set of rules should be followed for the entire document.
            Do not include any content from the template in your final document unless it makes sense in context.
            The document (as shown by the draft and pinned sections together) should make sense, be coherent, and be valid Markdown.
            Each placeholder object should be replaced with a single draft object, and filled with text of roughly the same character count given in the placeholder integer.
            You must have no placeholder objects left after this draft!
            Consider flow between pinned text and drafts - they will be displayed immediately adjacent as a single body of text, so think about punctuation and spacing.
            You must consider Markdown formatting for the overall document.
            Example input:
              {
                "title": "Expanding Market Reach",
                "template": "Preparing wood for a furnace involves focusing on **proper seasoning**. We should concentrate on **reducing moisture content** and **ensuring adequate airflow** to optimize combustion. By implementing **stacking methods** and **covering techniques**, we can minimize our **fuel consumption**.",
                "style": "NZ English",
                "document": [
                  {"placeholder": 40, "id": "a1b2"},
                  {"pinned": "sustainability", "id": "c3d4"},
                  {"placeholder": 25, "id": "e5f6"},
                  {"pinned": "reducing waste", "id": "g7h8"},
                  {"placeholder": 5, "id": "i9j0"},
                  {"pinned": "conserving resources", "id": "k1l2"},
                  {"placeholder": 17, "id": "m3n4"},
                  {"pinned": "recycling programs", "id": "o5p6"},
                  {"placeholder": 5, "id": "q7r8"},
                  {"pinned": "energy-efficient", "id": "s9t0"},
                  {"placeholder": 32, "id": "u1v2"},
                  {"pinned": "environmental impact", "id": "w3x4"},
                  {"placeholder": 1, "id": "y5z6"}
              ]
            }
            Example output:[{"draft": "Expanding market reach involves focusing on **"}, {"pinned", "sustainability"}, {"draft": " initiatives**. We should concentrate on "}, {"pinned", "reducing waste"}, {"draft": " and "}, {"pinned", "conserving resources"}, {"draft": " to appeal to **eco-conscious consumers**. By implementing "}, {"pinned", "recycling programs"}, {"draft": " and "}, {"pinned", "energy-efficient"}, {"draft": " practices, we can minimise our "}, {"pinned", "environmental impact"}, {"draft": "."}]`
          },
          {
            role: 'user',
            content: user_prompt
          }
        ],
        "temperature": 0.5,
        "max_tokens": 4000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });

      generatedContent = response.data.choices[0].message.content;
      console.log('Generated content:', generatedContent);

      const outputArray = JSON.parse(generatedContent);

      if (comparePinnedText(JSON.parse(user_prompt), outputArray, staticDiffAllowed, percentDiffAllowed)) {
        success = true;
      } else {
        console.log('Pinned text was altered, retrying...');
        attempt++;
        staticDiffAllowed *= presetMultiplier;
        percentDiffAllowed *= presetMultiplier;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      res.status(500).send('Error generating content');
      return;
    }
  }

  if (success) {
    res.json({ content: generatedContent });
  } else {
    console.log('Failed to generate valid content after multiple attempts');
    res.status(500).send('Failed to generate valid content after multiple attempts');
  }
});

/**
 * Extracts pinned text from the given array of content objects.
 */
function extractPinnedTextFromArray(contentArray: Array<{ placeholder?: number; pinned?: string; title?: string }>): string[] {
  return contentArray
    .filter(item => item.pinned)
    .map(item => item.pinned!.trim());
}

/**
 * Extracts pinned text from the given string content.
 */
function extractPinnedTextFromString(content: string): string[] {
  const regex = /~<([^>]+)>~/g;
  const pinnedText: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    pinnedText.push(match[1].trim());
  }
  return pinnedText;
}

/**
 * Compares two arrays of content objects.
 * Returns true if the keys are in the same order and all placeholders are replaced by drafts.
 */
function comparePinnedText(inputArray: Array<{ placeholder?: number; pinned?: string; title?: string }>, outputArray: Array<{ draft?: string; pinned?: string; title?: string }>, staticDiffAllowed: number, percentDiffAllowed: number): boolean {
  console.log("input:", JSON.stringify(inputArray));
  console.log("output:", JSON.stringify(outputArray));
  if (inputArray.length !== outputArray.length) {
    console.error('Array lengths do not match');
    return false;
  }

  for (let i = 0; i < inputArray.length; i++) {
    const inputItem = inputArray[i];
    const outputItem = outputArray[i];

    if (inputItem.title && inputItem.title !== outputItem.title) {
      console.error(`Title mismatch at index ${i}: expected "${inputItem.title}", got "${outputItem.title}"`);
      return false;
    }

    if (inputItem.pinned && normalizeWhitespace(inputItem.pinned) !== normalizeWhitespace(outputItem.pinned || '')) {
      console.error(`Pinned text mismatch at index ${i}: expected "${normalizeWhitespace(inputItem.pinned)}", got "${normalizeWhitespace(outputItem.pinned || '')}"`);
      return false;
    }

    if (inputItem.placeholder && !outputItem.draft) {
      console.error(`Missing draft for placeholder at index ${i}`);
      return false;
    }
    if (inputItem.placeholder && outputItem.draft) {
      console.log("% of length:", outputItem.draft.length * percentDiffAllowed);
      console.log("Static diff allowed:", staticDiffAllowed);
      console.log("Placeholder:", inputItem.placeholder);
      console.log("Draft length:", outputItem.draft.length);
      let maxDiffAllowed = Math.max(staticDiffAllowed, outputItem.draft.length * percentDiffAllowed);
      console.log("Max diff allowed:", maxDiffAllowed);
      let currentDiff = Math.abs(inputItem.placeholder - outputItem.draft.length);
      console.log("Current diff:", currentDiff);
      if (currentDiff > maxDiffAllowed) {
        console.error(`Incorrect length ${outputItem.draft.length} for placeholder ${inputItem.placeholder} at index ${i}`);
        return false;
      }
    }
  }

  return true;
}
/**
 * Normalizes whitespace in a string by replacing multiple spaces with a single space.
 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

