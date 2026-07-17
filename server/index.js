require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cubesRouter = require('./routes/cubes');
const breloquesRouter = require('./routes/breloques');
const sortsRouter = require('./routes/sorts');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.use('/api/cubes', cubesRouter);
app.use('/api/breloques', breloquesRouter);
app.use('/api/sorts', sortsRouter);
app.use('/api/auth', authRouter);

// Express 5 route automatiquement les erreurs des handlers async ici.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erreur: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
