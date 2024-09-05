import fs from 'fs-extra';
import https from 'https';
import express from 'express';
import cors from 'cors';
import os from 'os';
import OpenAI from 'openai';

import Database from './Database.js';
import HttpError from './HttpError.js';
import bookFunctionCallSchema from './book_function_call_schema.json' assert { type: 'json' };

const app = express();
const PORT = 3015;

const GPT_MODEL = 'gpt-4o-mini';
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are an expert author that can write short stories for children to use to learn to read. Your task is to write the perfect, age-appropriate short story given the topic, sentence count and any other details. Return the title and story.`,
};

const openai = new OpenAI();

app.use(cors());
app.use(express.json());

// Serve static files from the 'web' directory
app.use(express.static('web'));

app.get('/books', async (req, res) => {
  res.json({ books: await db.getAllBooks() });
});

app.post('/books', async (req, res) => {
  try {
    console.log(req.body);
    const book = await createBook(req.body);
    res.json({ book });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create the book.' });
    console.error(error);
  }
});

async function createBook(bookDetails) {
  const { topic, sentenceCount, age } = bookDetails;

  const prompt = `Create a short story for a child of age ${age} with the following topic: ${topic}

The story should be no more than ${sentenceCount} sentences long.`;

  try {
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        SYSTEM_MESSAGE,
        {
          role: 'user',
          content: prompt
        }
      ],
      tool_choice: {
        type: 'function',
        function: {
          name: 'provide_book'
        }
      },
      tools: [{
        type: 'function',
        'function': bookFunctionCallSchema
      }]
    });

    try {
      const { content: _, tool_calls } = completion.choices[0].message;

      // Find the tool call with function name "provide_book"
      const provideBookCall = tool_calls.find(call =>
        call.type === 'function' && call.function.name === 'provide_book');

      if (provideBookCall) {
        const book = JSON.parse(provideBookCall.function.arguments);
        await db.insertBook({
          title: book.title,
          story: JSON.stringify(book.story),
          age: bookDetails.age,
          topic: bookDetails.topic,
        });
        return book;
      }
      else {
        throw new HttpError(404, 'Function provide_book not found in tool_calls.');
      }
    } catch (error) {
      console.error(error);
      throw new HttpError(500, 'Failed to parse function arguments as JSON.');
    }
  }
  catch (error) {
    console.error("Error parsing book:", error);
    throw new HttpError(500, 'Failed to parse the book.');
  }
}

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

// Create an HTTPS server

// Read SSL certificate files
const credentials = {
  key: fs.readFileSync('key.pem', 'utf8'),
  cert: fs.readFileSync('cert.pem', 'utf8'),
};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
  console.log(`HTTPS Server is running on https://${getLocalIPAddress()}:${PORT}`);
});

const db = new Database();
db.setup();
