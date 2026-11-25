const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'SUPREME AI', version: '1.1.0' });
});

app.get('/api/config', (req, res) => {
  res.json({
    name: 'SUPREME AI',
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.AI_MODEL || 'gpt-4.1-mini'
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a message.' });
    }

    if (message.length > 12000) {
      return res.status(400).json({ error: 'Message is too long.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'AI is not configured yet. The administrator must configure the server API key.'
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are SUPREME AI, a helpful, accurate and friendly AI assistant.'
          },
          { role: 'user', content: message.trim() }
        ],
        max_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('AI provider error:', data);
      return res.status(502).json({ error: 'The AI provider could not complete your request.' });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || 'No response received.'
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong while processing your message.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('SUPREME AI running on port ' + port);
});
