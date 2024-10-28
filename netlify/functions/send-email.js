const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const response = await axios.post('https://api.resend.com/emails', req.body, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
};