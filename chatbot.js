import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY })

const myCache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // 24 hours

export async function generate(mesg, threadId) {

  const baseMessages = [
      {
        role: "system",
        content: `You are a small personal assistant who answers the asked questions. You have access to the following tools:
        1. searchWeb({query}) //Search the latest information and realtime data on the internet`,
      }
  ];

  const messages = myCache.get(threadId) ? myCache.get(threadId) : baseMessages;

  messages.push({
    role: "user",
    content: mesg
  })

  const MAX_RETRIES = 10;
  let count = 0;

  while(true) {
    if (count > MAX_RETRIES) {
      return "I could not find the solution, please try again."
    }
    count++;
    const completion = await groq.chat.completions.create({
      temperature: 0,
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: [
        {
          "type": "function",
          "function": {
            "name": "webSearch",
            "description": "Search the latest information and realtime data on the internet",
            "parameters": {
              "type": "object",
              "properties": {
                  "query": {
                  "type": "string",
                  "description": "The search query to perform search on."
                  },
              },
            "required": ["query"]
            }
          }
        }
      ],
      tool_choice:  'auto'
    });
    // console.log(JSON.stringify(completion.choices[0].message, null, 2))

    messages.push(completion.choices[0].message)

    const toolCalls = completion.choices[0].message?.tool_calls
    if (!toolCalls) {
      // here we end the chatbot response
      myCache.set(threadId, messages);
      console.log(myCache)
      return completion.choices[0].message.content
    }

    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const functionParams = tool.function.arguments;

      if (functionName == "webSearch"){
        const toolResult = await webSearch(JSON.parse(functionParams))
        console.log(`tool result: ${toolResult}`)
        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: toolResult
        })
      }
    }
  }

}

async function webSearch({query}) {
  console.log("calling webSearch..... ")
  const response = await tvly.search(query)
  // console.log("Response:", response)
  const results = response.results
  const finalResults = results.map(result => result.content ).join('\n\n')
  return finalResults
}