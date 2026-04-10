const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const documentRoutes = require('./routes/documentRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Serve static files from uploads (for previewing)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'DocuFlow AI API is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
