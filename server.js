const express = require('express');
const { rateLimit } = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute.' }
});

const modes = {
  general: 'You are SUPREME AI, a helpful, accurate general assistant.',
  coding: 'You are SUPREME AI, an expert programming tutor. Explain code clearly.',
  learning: 'You are SUPREME AI, a patient educational tutor. Teach step by step.',
  writing: 'You are SUPREME AI, a writing and editing assistant.',
  creative: 'You are SUPREME AI, a creative brainstorming assistant.'
};

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'SUPREME AI', version: '2.0' });
});

app.get('/api/config', (req, res) => {
  res.json({
    name: 'SUPREME AI',
    modes: Object.keys(modes),
    aiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post('/api/chat', limiter, async (req, res) => {
  try {
    const { message, mode = 'general', history = [] } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A message is required.' });
    }

    if (message.length > 12000) {
      return res.status(400).json({ error: 'Message too long.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'AI provider is not configured on the server yet.'
      });
    }

    const selectedMode = modes[mode] || modes.general;

    const validHistory = Array.isArray(history)
      ? history.slice(-12).filter(m =>
          m && ['user', 'assistant'].includes(m.role) &&
          typeof m.content === 'string' &&
          m.content.length <= 12000
        )
      : [];

    const messages = [
      { role: 'system', content: selectedMode },
      ...validHistory,
      { role: 'user', content: message.trim() }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4.1-mini',
        messages,
        max_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Provider error status:', response.status);
      return res.status(502).json({ error: 'AI provider request failed.' });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || 'No response received.'
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('SUPREME AI v2 running on port ' + port);
});
