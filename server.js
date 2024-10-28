const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
  try {
    const response = await axios.post('https://api.resend.com/emails', req.body, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});