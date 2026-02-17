const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const superAdminRoutes = require('./routes/superAdminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const devoteeRoutes = require('./routes/devoteeRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/devotee', devoteeRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate({ logging: false });
    console.log('✅ Connection to the database has been established successfully.');

    await sequelize.sync({ alter: true, logging: false });
    console.log('✅ Database synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
 