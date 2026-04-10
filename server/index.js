const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const upload = require('./middleware/upload');
const documentRoutes = require('./routes/documentRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads (for previewing)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/documents', documentRoutes);

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
