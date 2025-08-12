const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const empleadosRouter = require('./routes/empleados.routes');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/empleados', empleadosRouter);

module.exports = app;
