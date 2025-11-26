const inputEle = document.getElementById('input');
const askBtn = document.getElementById('askBtn');
const chatContainer = document.getElementById('chatContainer');

const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)

console.log(threadId)
inputEle?.addEventListener('keyup', handleEnter);
askBtn.addEventListener('click', handleEnter)

const loading = document.createElement('div');
loading.className = 'my-6 animate-pulse'
loading.textContent = 'Thinking...'

async function generate(text) {
  // 1. append message to ui
  const msg = document.createElement('div');
  msg.className = `my-6 bg-neutral-800 p-3 rounded-xl max-w-fit ml-auto`
  msg.textContent = text;
  chatContainer?.appendChild(msg)
  inputEle.value = '';
  // 2. Send it to the LLM,
  chatContainer.appendChild(loading)
  const llmResponse = await callServer(text)
  loading.remove()
  // 3. Append response to the ui
  const assistantMsg = document.createElement('div');
  assistantMsg.className = `max-w-fit`
  assistantMsg.textContent = llmResponse;
  chatContainer?.appendChild(assistantMsg)
}

async function callServer(inputText) {
  console.log("threadId", threadId)
  const response = await fetch('http://localhost:3001/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ threadId: threadId, message: inputText }),
  })

  if (!response.ok) {
    throw new Error("Error generating the response")
  }

  const result = await response.json();
  return result.message;
}

async function handleEnter(e) {
  const text = inputEle?.value.trim();
  if (!text) return;
  console.log("e", e.type)
  if (e.type === 'keyup' && e.key === 'Enter') {
    await generate(text)
  } else if (e.type === 'click') {
    await generate(text)
  }
}
