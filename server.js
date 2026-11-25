const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'SUPREME AI' });
});

app.listen(port, '0.0.0.0', () => {
  console.log('SUPREME AI running on port ' + port);
});
