const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const port = process.env.PORT || 3000;\nconst MAX_HISTORY = 10;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));\napp.use('/api/auth', require('./auth-routes'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['text/plain', 'application/pdf'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Only TXT and PDF files are allowed.'), allowed.includes(file.mimetype));
  }
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const modes = {
  general: 'You are SUPREME AI, a helpful, accurate general assistant.',
  coding: 'You are SUPREME AI, a programming tutor. Explain code clearly.',
  learning: 'You are SUPREME AI, a patient educational tutor.',
  writing: 'You are SUPREME AI, a writing and editing assistant.',
  creative: 'You are SUPREME AI, a creative brainstorming assistant.'
};

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'SUPREME AI', version: '3.0' });
});

app.get('/api/config', (req, res) => {
  res.json({ name: 'SUPREME AI', modes: Object.keys(modes), aiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post('/api/upload', limiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a TXT or PDF file.' });

    let content = '';

    if (req.file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(req.file.buffer);
      content = parsed.text;
    } else {
      content = req.file.buffer.toString('utf8');
    }

    content = content.trim();

    if (!content) return res.status(400).json({ error: 'No readable text found in the file.' });

    res.json({
      filename: req.file.originalname.slice(0, 200),
      content: content.slice(0, 30000)
    });
  } catch (e) {
    console.error('Upload error:', e.message);
    res.status(400).json({ error: 'Unable to read this file.' });
  }
});

app.post('/api/chat', limiter, async (req, res) => {
  try {
    const { message, mode = 'general', history = [] } = req.body || {};

    if (typeof message !== 'string' || !message.trim())
      return res.status(400).json({ error: 'A message is required.' });

    if (message.length > 30000)
      return res.status(400).json({ error: 'Message too long.' });

    if (!process.env.OPENAI_API_KEY)
      return res.status(503).json({ error: 'AI provider is not configured.' });

    const validHistory = Array.isArray(history)
      ? history.slice(-MAX_HISTORY).filter(m =>
          m && ['user', 'assistant'].includes(m.role) &&
          typeof m.content === 'string' && m.content.length <= 12000
        )
      : [];

    const messages = [
      { role: 'system', content: modes[mode] || modes.general },
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
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Provider status:', response.status);
      return res.status(502).json({ error: 'AI provider request failed.' });
    }

    res.json({ reply: data.choices?.[0]?.message?.content || 'No response received.' });
  } catch (e) {
    console.error('Chat error:', e.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Request failed.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log('SUPREME AI v3 running on port ' + port);
});
