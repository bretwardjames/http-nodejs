// server.js
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import libphonenumber from 'google-libphonenumber';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// ES6 __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

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

// Serve the CSS file
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'style.css'));
});

// Serve the Scripts file
app.get('/scripts.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'scripts.js'));
});

// Serve the JavaScript file
app.get('/embedForm.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'embedForm.js'));
});

// Middleware to handle API requests
app.post('/proxy', async (req, res) => {
  let { apiName, endpoint, method, data, headers } = req.body;

  if (!apiName || !endpoint || !method) {
    return res.status(400).send('Missing required parameters: apiName, endpoint, method');
  }

  const apiKey = process.env[`${apiName}_API_KEY`]
  const apiUrl = process.env[`${apiName}_API_URL`]

  let authHeader

  if (apiName === 'KEAP') {
    authHeader = { 'X-KEAP-API-KEY': `${apiKey}` }
  } else if (apiName === 'NUMVERIFY') {
    endpoint += `&access_key=${apiKey}`
  } else {
    authHeader = { 'Authorization': `Bearer ${apiKey}` }
  }

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

app.post('/validatePhone', async (req, res) => {
  const { phoneNumber, countryCode } = req.body;

  if (!phoneNumber) {
    return res.status(400).send('Missing required parameters: phoneNumber');
  }

  try {
    // Parse phone number with country code if provided, otherwise use default
    const parsedNumber = phoneUtil.parseAndKeepRawInput(phoneNumber, countryCode || 'US');

    // Check if the number is valid
    if (!phoneUtil.isValidNumber(parsedNumber)) {
      return res.status(400).json({ valid: false, message: "Invalid phone number" });
    }

    // Get the national (local) number without any formatting characters
    const nationalNumber = parsedNumber.getNationalNumber().toString();
    return res.json({ valid: true, local_format: nationalNumber });

  } catch (e) {
    return res.status(400).json({ valid: false, message: e.message });
  }

});

// Initialize the Google Sheets API client
async function getAuth() {
  const credentials = {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Ensure newline characters are correctly interpreted
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const authClient = await auth.getClient();
  google.options({ auth: authClient });
  return authClient;
}

async function checkAndUpdateSheet(data) {
  const auth = await getAuth();
  const spreadsheetId = '117qpB4qG_yIQSkPFApYDKmFieVer1b9Jj2sKYz1cyk4'; // Replace with your Google Sheets ID
  const range = 'raw_applications!A:Z'; // Adjust the range according to your sheet structure

  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch the data from the sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });
  const headers = response.data.values.shift();
  const rows = response.data.values.map(row => {
    const rowData = {};
    row.forEach((cell, i) => {
      rowData[headers[i]] = cell;
    });
    return rowData;
  });

  let matchingRow = null;
  let matchingRowIndex = -1;

  // Find matching row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.email?.toLowerCase() === data.email?.toLowerCase() || row.uuid === data.uuid || row.ipAddress === data.ip || row.phone === data.phone) {
      matchingRow = row;
      matchingRowIndex = i;
      break;
    }
  }

  let newUUID = uuidv4();
  if (matchingRow) {
    // Update existing row
    Object.keys(data).forEach(key => {
      if (key === 'inf_field_Email') {
        matchingRow[key] = data['inf_field_Email'].toLowerCase();
      } else if (key === 'inf_field_Phone1') {
        matchingRow[key] = data['inf_field_Phone1'];

      } else if (key === 'inf_field_FirstName') {
        matchingRow[key] = data['inf_field_FirstName'];

      } else if (key === 'inf_field_LastName') {
        matchingRow[key] = data['inf_field_LastName'];

      } else {
        matchingRow[key] = data[key];

      }
    });
    const updatedRow = headers.map(header => matchingRow[header] || '');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `raw_applications!A${matchingRowIndex + 2}:Z${matchingRowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });
  } else {
    const newRow = headers.map(header => data[header] || '');
    newRow[headers.indexOf('uuid')] = newUUID; // Ensure the UUID is set in the correct column
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'raw_applications!A:Z',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow]
      }
    });
  }

  return newUUID;
}

// Middleware to handle checking and updating the Google Sheet
// Middleware to handle checking and updating the Google Sheet
app.post('/check-and-update-sheet', async (req, res) => {
  try {
    const data = req.body;
    // Capture the user's IP address from the request headers
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    data.ipAddress = userIp;

    const newUUID = await checkAndUpdateSheet(data);
    res.status(200).send({ uuid: newUUID });
  } catch (error) {
    console.error('Error checking and updating sheet:', error);
    res.status(500).send('An error occurred while checking and updating the sheet.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});