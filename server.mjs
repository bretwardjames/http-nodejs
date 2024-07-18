// server.js
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['https://davidbayercoaching.com', 'https://davidbayer.com', 'https://mindhackprogram.com'], // Replace with your allowed domain(s)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Allowed domains
const allowedDomains = ['https://davidbayercoaching.com', 'https://davidbayer.com', 'https://mindhackprogram.com'];

// Middleware to check referring domain
const checkReferer = (req, res, next) => {
  const referer = req.get('Referer');
  const origin = req.get('Origin');

  if (referer && allowedDomains.some(domain => referer.startsWith(domain))) {
    next();
  } else if (origin && allowedDomains.some(domain => origin.startsWith(domain))) {
    next();
  } else {
    res.status(403).send('Forbidden: Invalid referring domain');
  }
};

// Apply the middleware
app.use(checkReferer);

// Serve the HTML file
app.get('/form.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// Serve the JavaScript file
app.get('/embedForm.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'embedForm.js'));
});

// Middleware to handle API requests
app.post('/proxy', async (req, res) => {
  const { apiName, endpoint, method, data, headers } = req.body;

  if (!apiName || !endpoint || !method) {
    return res.status(400).send('Missing required parameters: apiName, endpoint, method');
  }

  const apiKey = process.env[`${apiName}_API_KEY`]
  const apiUrl = process.env[`${apiName}_API_URL`]

  const authHeader = apiName === 'KEAP' ? { 'X-KEAP-API-KEY': `${apiKey}` } : { 'Authorization': `Bearer ${apiKey}` }

  try {
    const response = await axios({
      url: `${apiUrl}${endpoint}`,
      method: method,
      data: data,
      headers: {
        ...headers,
        ...authHeader, // Add your API key here if required
      },
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error making API request:', error);
    res.status(500).send('An error occurred while making the API request.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});