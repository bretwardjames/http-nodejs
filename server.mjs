// server.js
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import libphonenumber from 'google-libphonenumber';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// ES6 __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
console.log('Server URL:', serverUrl);

const app = express();

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

// CORS configuration
const corsOptions = {
  origin: [serverUrl, 'https://davidbayercoaching.com', 'https://davidbayer.com', 'https://mindhackprogram.com', 'https://powerfullivingexperience.com', 'https://tx227.infusionsoft.app', 'https://tx227.infusionsoft.com'], // Replace with your allowed domain(s)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Allowed domains
const allowedDomains = [serverUrl, 'https://davidbayercoaching.com', 'https://davidbayer.com', 'https://mindhackprogram.com', 'https://powerfullivingexperience.com', 'https://tx227.infusionsoft.app', 'https://tx227.infusionsoft.com'];

const adminPassword = process.env.ADMIN_PASSWORD || 'defaultPassword';

function authMiddleware(req, res, next) {
  const password = req.body.password || req.query.password;
  if (password === adminPassword) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

app.get('/admin', authMiddleware, (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

app.get('/ple-data-to-update', authMiddleware, (req, res) => {
  const pleVariables = Object.keys(process.env)
    .filter(key => key.startsWith('PLE_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});

  res.json(pleVariables);
});

app.post('/update-ple', authMiddleware, async (req, res) => {
  const updates = req.body;
  Object.keys(updates).forEach(key => {
    if (key.startsWith('PLE_')) {
      process.env[key] = updates[key];
    }
  });
  res.send('Variables updated successfully');
});

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

// Serve the Scripts file
app.get('/calendar-scripts.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'calendar-scripts.js'));
});

app.get('/ple-scripts.js', (req, res) => {
  console.log(req);
  res.sendFile(path.join(__dirname, 'ple-scripts.js'));
});

app.get('/ple-upsell.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'ple-upsell.js'));
});

app.get('/checkout-cookies.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout-cookies.js'));
});

app.get('/calendarButton.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'calendarButton.js'));
});

app.get('/embedForm.js', (req, res) => {
  console.log('Requesting embedForm.js');
  const originalFilePath = path.join(__dirname, 'embedForm.js');
  console.log('Original file path:', originalFilePath);
  fs.readFile(originalFilePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading embedForm.js');
      return;
    }
    console.log('Read embedForm.js');
    // Define the parameters you want to inject
    const config = {
      hosted: serverUrl || 'https://http-nodejs-production-5fbc.up.railway.app'
    };

    // Inject parameters into the script
    let modifiedData = data
      .replace(/'https:\/\/http-nodejs-production-5fbc.up.railway.app'/g, `'${config.hosted}'`);
    console.log('Modified embedForm.js');
    // Send the modified script content directly
    res.type('application/javascript');
    res.send(modifiedData);
    console.log('Sent embedForm.js');
  });
});

app.get('/embed-calendar-button', (req, res) => {
  console.log('Requesting embed-calendar-button');

  // Extract parameters from the query string
  const title = req.query.title || 'Master the Inner Game of Business';
  const description = req.query.description || 'Default Description';
  const location = req.query.location || 'Default Location';
  const start = req.query.start || '2024-09-16T10:00:00';

  // Read the HTML template
  const originalFilePath = path.join(__dirname, 'calendarButton.html');

  fs.readFile(originalFilePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading calendarButton.html');
      return;
    }

    // Replace placeholders in the HTML
    let modifiedData = data.replace(/{{title}}/g, title);

    // Create a query string with all the parameters
    const queryString = `title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&start=${encodeURIComponent(start)}`;

    // Inject the external JS script in the HTML with all parameters
    modifiedData += `
      <script src="/calendarButton.js?${queryString}"></script>
    `;

    // Send the modified HTML
    res.send(modifiedData);
  });
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

  } else if (apiName === 'IPINFO') {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    endpoint += `${ip}?token=${apiKey}`
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

app.get('/ple-data', (req, res) => {
  const pleVariables = Object.keys(process.env)
    .filter(key => key.startsWith('PLE_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});

  const today = new Date();

  // Check if PLE_endDate is present and if it's in the past
  if (pleVariables.PLE_endDate) {
    const endDate = new Date(pleVariables.PLE_endDate);
    if (endDate < today) {
      // Switch to _next variables if the event is past
      Object.keys(pleVariables).forEach(key => {
        if (!key.startsWith('PLE_promo') && key.endsWith('_next')) {
          const baseKey = key.replace('_next', '');
          pleVariables[baseKey] = pleVariables[key];
        }
      });
    }
  }

  // Check if PLE_promo_switchDate is present and if it's in the past
  if (pleVariables.PLE_promo_switchDate && pleVariables.PLE_promo_switchDate !== '') {
    const promoSwitchDate = new Date(pleVariables.PLE_promo_switchDate);
    if (promoSwitchDate < today) {
      // Switch to _next variables for promo if the switch date is past
      Object.keys(pleVariables).forEach(key => {
        if (key.startsWith('PLE_promo') && key.endsWith('_next')) {
          const baseKey = key.replace('_next', '');
          pleVariables[baseKey] = pleVariables[key];
        }
      });
    }
  }

  // Remove _next variables from the response
  Object.keys(pleVariables).forEach(key => {
    if (key.endsWith('_next')) {
      delete pleVariables[key];
    }
  });

  res.json(pleVariables);
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

  // Find matching row by UUID first
  if (data.uuid) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.uuid === data.uuid && new Date(row.created) > new Date(new Date() - 7 * 24 * 60 * 60 * 1000)) {
        matchingRow = row;
        matchingRowIndex = i;
        break;
      }
    }
  }

  // If no matching UUID, find by other fields
  if (!matchingRow) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if ((row.email?.toLowerCase() === data.email?.toLowerCase() || row.ipAddress === data.ip || row.phone === data.phone) && new Date(row.created) > new Date(new Date() - 7 * 24 * 60 * 60 * 1000)) {
        matchingRow = row;
        matchingRowIndex = i;
        break;
      }
    }
  }

  let newUUID = uuidv4();
  if (matchingRow) {
    // Update existing row
    Object.keys(data).forEach(key => {
      if (key === 'inf_field_Email') {
        matchingRow['email'] = data[key].toLowerCase();
      } else if (key === 'inf_field_Phone1') {
        matchingRow['phone'] = data[key];
      } else if (key === 'inf_field_FirstName') {
        matchingRow['firstName'] = data[key];
      } else if (key === 'inf_field_LastName') {
        matchingRow['lastName'] = data[key];
      } else {
        matchingRow[key] = data[key];
      }
      newUUID = matchingRow.uuid;
    });
    const updatedRow = headers.map(header => matchingRow[header] || '');
    updatedRow[headers.indexOf('updated')] = new Date();
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
    newRow[headers.indexOf('created')] = new Date()
    newRow[headers.indexOf('ipAddress')] = data.ipAddress;
    newRow[headers.indexOf('email')] = data['inf_field_Email'];
    newRow[headers.indexOf('phone')] = data['inf_field_Phone1'];
    newRow[headers.indexOf('firstName')] = data['inf_field_FirstName'];
    newRow[headers.indexOf('lastName')] = data['inf_field_LastName'];
    newRow[headers.indexOf('updated')] = new Date()

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

app.get('/get-sheet-row', async (req, res) => {
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

  // Find matching row by UUID
  if (req.query.uuid) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.uuid === req.query.uuid) {
        matchingRow = row;
        break;
      }
    }
  }

  if (matchingRow) {
    res.json(matchingRow);
  } else {
    res.status(404).send('Row not found');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});