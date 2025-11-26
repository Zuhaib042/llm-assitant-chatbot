import express from 'express';
import { generate } from './chatbot.js';
import cors from 'cors';
const app = express()
const port = 3001;
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Welcome to Chat DPT')
})

app.post('/chat', async (req, res) => {
  const { message, threadId } = req.body;
  console.log('Message', message, threadId)

  // validate fields
  if (!message || !threadId) {
    res.status(400).json({ message: 'All fields are required!' });
    return;
  }

  const llmResponse = await generate(message, threadId);
  console.log("LLM RESPONSE", llmResponse)
  res.json({ message: llmResponse })
})

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})