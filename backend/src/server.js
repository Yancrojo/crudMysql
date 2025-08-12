require('dotenv').config();
const app = require('./app');
const pool = require('./db');
const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to MySQL');
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
})();
