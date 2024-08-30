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
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AI document iterator. You will receive documents which are a combination of garbage AI-generated content and pinned user-validated content. User-validated content is tagged ~<like this>~. Please do not change any text between ~< and >~ - this is your only true input. Modify every piece of non-pinned text to make the document make sense, though try to maintain roughly the same length between black sections.'
        },
        {
          role: 'user',
          content: `Here is the document content: ${prompt}`
        }
      ],
      "temperature": 0.9
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
