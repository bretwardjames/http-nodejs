// server.js
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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