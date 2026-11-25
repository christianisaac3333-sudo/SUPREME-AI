const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'SUPREME AI', version: '1.0.0' });
});

app.get('/api/config', (req, res) => {
  res.json({
    name: 'SUPREME AI',
    features: [
      'AI Chat',
      'Coding Assistant',
      'Learning Assistant',
      'Writing Assistant',
      'Document Analysis',
      'Web Research',
      'Image Tools'
    ],
    aiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log('SUPREME AI running on port ' + port);
});
