import ReactDOMServer from 'react-dom/server';
import EmailTemplateHot from '../components/template/emailTemplateHot';
import EmailTemplateCold from '../components/template/emailTemplateCold';

// const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);

export const sendEmailHot = async (user, temperature) => {
  const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
  const now = new Date().getTime();

  if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) { // Check if the last email was sent more than 10 minutes ago
    if (user) {
      const emailData = {
        to: user.email,
        from: "AI-Ponics@jeiem.site",
        subject: "Temperature Alert - High Temperature Detected!",
        html: ReactDOMServer.renderToStaticMarkup(<EmailTemplateHot temperature={temperature} />),
        text: `Temperature Alert: The current temperature is ${temperature}°C, which exceeds the safe threshold. Please check your equipment immediately.`,
      };

      try {
        const response = await fetch('/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_RESEND_API_KEY}`
          },
          body: JSON.stringify(emailData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Network response was not ok: ${response.status} - ${errorData.message}`);
        }

        const data = await response.json();
        console.log("Email successfully sent!", data);
        localStorage.setItem("lastEmailTimestamp", now);
      } catch (err) {
        console.error("Failed to send email:", err);
      }
    }
  } else {
    console.log("Email not sent: 10 minutes have not passed yet.");
  }
};

// Lettuce survives extreme cold temps but the function's still here as an additional feature
export const sendEmailCold = async (user, temperature) => {
  const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
  const now = new Date().getTime();

  if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) { 
    if (user) {
      const emailData = {
        to: user.email,
        from: "AI-Ponics@jeiem.site",
        subject: "Temperature Alert - Low Temperature Detected!",
        html: ReactDOMServer.renderToStaticMarkup(<EmailTemplateCold temperature={temperature} />),
        text: `Temperature Alert: The current temperature is ${temperature}°C, which falls below the safe threshold. Please check your equipment immediately.`,
      };

      try {
        const response = await fetch('/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_RESEND_API_KEY}`
          },
          body: JSON.stringify(emailData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Network response was not ok: ${response.status} - ${errorData.message}`);
        }

        const data = await response.json();
        console.log("Email successfully sent!", data);
        localStorage.setItem("lastEmailTimestamp", now);
      } catch (err) {
        console.error("Failed to send email:", err);
      }
    }
  } else {
    console.log("Email not sent: 10 minutes have not passed yet.");
  }
};

