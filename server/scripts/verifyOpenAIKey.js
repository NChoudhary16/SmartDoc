/**
 * Checks whether OPENAI_API_KEY in server/.env is accepted by OpenAI.
 * Does not print the full key.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const raw = process.env.OPENAI_API_KEY || '';
const key = raw.trim().replace(/^["']|["']$/g, '');
const apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
const model = process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini';

if (!key) {
  console.log('RESULT: FAIL - OPENAI_API_KEY is missing or empty in server/.env');
  process.exit(1);
}

const masked = key.length <= 8 ? '***' : `${key.slice(0, 4)}...${key.slice(-4)}`;
console.log(`Key present: yes (length ${key.length}, preview ${masked})`);

(async () => {
  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        temperature: 0,
        messages: [{ role: 'user', content: 'reply with: ok' }]
      })
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (res.ok && json?.choices?.length) {
      console.log('RESULT: OK - OpenAI accepted this API key.');
      process.exit(0);
    }

    const errMsg = json?.error?.message || json?.message || text?.slice(0, 200);
    if (res.status === 401) {
      console.log(`RESULT: FAIL - Invalid API key (HTTP ${res.status}).`);
      console.log('Server said:', errMsg);
      process.exit(2);
    }

    console.log(`RESULT: UNCLEAR - HTTP ${res.status} (key may be valid but call failed).`);
    console.log('Server said:', errMsg);
    process.exit(3);
  } catch (e) {
    console.log('RESULT: ERROR -', e.message);
    process.exit(4);
  }
})();
