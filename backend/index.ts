import express from 'express';
import cors from 'cors';
import axios from 'axios';
require('dotenv').config();

// Access the OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const app = express();
const port = 3000;

app.use(cors());

app.get('/api/generate', async (req, res) => {
  const prompt = req.query.prompt as string;
  console.log('Received prompt:', prompt); // Debugging statement

  if (!prompt) {
    return res.status(400).send('Prompt is required');
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Recreate this text to fit the new title, keeping the sections marked between ~< and >~ intact.'
        },
        {
          role: 'user',
          content: `Title:
"How to start a renewable energy business"
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

    const generatedContent = response.data.choices[0].message.content;
    res.json({ content: generatedContent });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error calling OpenAI API:', error.response ? error.response.data : error.message); // Detailed logging
    } else {
      console.error('Unexpected error:', error); // Handle unexpected errors
    }
    res.status(500).send('Error generating content');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:3000`);
});