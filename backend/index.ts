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
  const prompt = req.body as Array<{ placeholder?: number; pinned?: string; unpinned?: string }>;
  console.log('Received prompt:', prompt);

  if (!prompt) {
    return res.status(400).send('Prompt is required');
  }

  let attempt = 0;
  const maxRetries = 3;
  let success = false;
  let generatedContent = '';

  while (attempt < maxRetries && !success) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Recreate this text to fit the new title, replacing "placeholder" with generated text as "unpinned" in the same place, and keeping the sections marked as "pinned" intact.'
          },
          {
            role: 'user',
            content: `Title:
            How to start a renewable energy business
            Content:
            ${prompt}`
          }
        ],
        "temperature": 0.7,
        "max_tokens": 500
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      });

      generatedContent = response.data.choices[0].message.content;
      console.log('Generated content:', generatedContent);

      const inputPinnedText = extractPinnedTextFromArray(prompt);
      const outputPinnedText = extractPinnedTextFromString(generatedContent);

      if (comparePinnedText(inputPinnedText, outputPinnedText)) {
        success = true;
      } else {
        console.log('Pinned text was altered, retrying...');
        attempt++;
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
function extractPinnedTextFromArray(contentArray: Array<{ placeholder?: number; pinned?: string; unpinned?: string }>): string[] {
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
 * Compares two arrays of pinned text.
 * Returns true if they are identical, false otherwise.
 */
function comparePinnedText(inputPinnedText: string[], outputPinnedText: string[]): boolean {
  if (inputPinnedText.length !== outputPinnedText.length) {
    return false;
  }
  for (let i = 0; i < inputPinnedText.length; i++) {
    if (inputPinnedText[i] !== outputPinnedText[i]) {
      return false;
    }
  }
  return true;
}
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

