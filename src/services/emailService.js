import emailjs from "emailjs-com";
import { Resend } from 'resend';
import ReactDOMServer from 'react-dom/server';
import EmailTemplate from '../components/template/emailTemplate';

const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);

export const sendEmailHot = async (user, temperature) => {
  const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
  const now = new Date().getTime();

  if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
    if (user) {
      const emailData = {
        to: user.email,
        from: "Acme <onboarding@resend.dev>",
        subject: "Temperature Alert - High Temperature Detected!",
        html: ReactDOMServer.renderToStaticMarkup(<EmailTemplate temperature={temperature} />),
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

export const sendEmailCold = (user, temperature) => {
  const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
  const now = new Date().getTime();

  if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
    if (user) {
      const templateParams = {
        to_name: user.displayName || "User",
        message: `Temperature is too cold! ${temperature}°C`,
        user_email: user.email,
      };

      emailjs
        .send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          templateParams,
          process.env.REACT_APP_EMAILJS_USER_ID,
        )
        .then(
          (response) => {
            console.log(
              "Email successfully sent!",
              response.status,
              response.text,
            );
            localStorage.setItem("lastEmailTimestamp", now);
          },
          (err) => {
            console.error("Failed to send email:", err);
          },
        );
    }
  } else {
    console.log("Email not sent: 10 minutes have not passed yet.");
  }
};