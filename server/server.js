import cors from 'cors';
import express from 'express';
import fs from 'fs-extra';
import https from 'https';
import OpenAI from 'openai';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import Database from './Database.js';
import HttpError from './HttpError.js';
import storyFunctionCallSchema from '../story_function_call_schema.json' assert { type: 'json' };

const app = express();
const PORT = 3015;

const wordMappings = JSON.parse(await fs.readFile('server/word_mappings.json', 'utf8'));

const GPT_MODEL = 'gpt-4o-mini';
const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are an expert author that can write short stories for children to use to learn to read. Your task is to write the perfect, age-appropriate short story given the topic, sentence count and any other details. Return the title and sentences of the story. Ensure that the sentences are organized into an array of strings.`,
};

const openai = new OpenAI();

app.use(cors());
app.use(express.json());

// Serve static files from the 'web' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../web/dist')));

app.get('/stories', async (req, res) => {
  res.json({ stories: await db.getAllStories() });
});

app.post('/stories', async (req, res) => {
  try {
    console.log(req.body);
    const story = await createStory(req.body);
    res.json({
      story,
      wordMappings: getRelevantWordMappings(story.sentences)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create the story.' });
    console.error(error);
  }
});

function getRelevantWordMappings(sentences) {
  const words = sentences.map(sentence => sentence.split(' ')).flat();
  const relevantWordMappings = {};
  for (const word of words) {
    const strippedWord = word.replace(/[^a-zA-Z]/g, '')
    if (wordMappings[strippedWord]) {
      relevantWordMappings[strippedWord] = wordMappings[strippedWord];
    }
    else if (wordMappings[strippedWord.toLowerCase()]) {
      relevantWordMappings[strippedWord] = wordMappings[strippedWord.toLowerCase()];
    }
  }
  return relevantWordMappings;
}

async function createStory(storyDetails) {
  const { topic, sentenceCount, grade } = storyDetails;

  const prompt = `Create a story for a child in grade "${grade}" with the topic:

<topic>${topic}</topic>

The story should not include words that are too difficult for a child in this grade. The story should include some sight words appropriate for this grade.

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
          name: 'provide_story'
        }
      },
      tools: [{
        type: 'function',
        'function': storyFunctionCallSchema
      }]
    });

    try {
      const { content: _, tool_calls } = completion.choices[0].message;

      // Find the tool call with function name "provide_story"
      const provideStoryCall = tool_calls.find(call =>
        call.type === 'function' && call.function.name === 'provide_story');

      if (provideStoryCall) {
        const story = JSON.parse(provideStoryCall.function.arguments);
        console.log(`Inserting story: ${JSON.stringify(story, null, 2)}`);
        await db.insertStory({
          title: story.title,
          sentences: JSON.stringify(story.sentences),
          grade: storyDetails.grade,
          topic: storyDetails.topic,
        });
        return story;
      }
      else {
        throw new HttpError(404, 'Function provide_story not found in tool_calls.');
      }
    } catch (error) {
      console.error(error);
      throw new HttpError(500, 'Failed to parse function arguments as JSON.');
    }
  }
  catch (error) {
    console.error("Error parsing story:", error);
    throw new HttpError(500, 'Failed to parse the story.');
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
  key: fs.readFileSync('server/key.pem', 'utf8'),
  cert: fs.readFileSync('server/cert.pem', 'utf8'),
};

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
  console.log(`HTTPS Server is running on https://${getLocalIPAddress()}:${PORT}`);
});

const db = new Database();
db.setup();
