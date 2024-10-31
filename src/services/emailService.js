import emailjs from "emailjs-com";
import { Resend } from 'resend';

const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);

export const sendEmailHot = async (user, temperature) => {
  const lastEmailTimestamp = localStorage.getItem("lastEmailTimestamp");
  const now = new Date().getTime();

  if (!lastEmailTimestamp || now - lastEmailTimestamp > 10 * 60 * 1000) {
    if (user) {
      const emailData = {
        // to: user.email,
        to: "virozzegt@gmail.com",
        from: "Acme <onboarding@resend.dev>",
        subject: "Temperature Alert - High Temperature Detected!",
        html: `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Temperature Alert</title>
              <style>
                .email-container {
                  max-width: 580px;
                  margin: 0 auto;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 32px 24px;
                  background-color: #ffffff;
                }
                .header {
                  border-bottom: 2px solid #38a169; /* Green border */
                  padding-bottom: 16px;
                  margin-bottom: 24px;
                }
                .logo {
                  color: #38a169; /* Green logo */
                  font-size: 20px;
                  font-weight: 600;
                  letter-spacing: -0.025em;
                  margin: 0;
                }
                .alert-badge {
                  display: inline-block;
                  background-color: #f0fff4; /* Light green background */
                  color: #38a169; /* Green text */
                  padding: 4px 12px;
                  border-radius: 6px;
                  font-size: 14px;
                  font-weight: 500;
                  margin-top: 8px;
                }
                .temperature {
                  font-size: 48px;
                  font-weight: 700;
                  color: #38a169; /* Green temperature */
                  margin: 24px 0;
                  font-feature-settings: "tnum";
                  font-variant-numeric: tabular-nums;
                }
                .message {
                  color: #374151;
                  line-height: 1.6;
                  margin-bottom: 24px;
                }
                .info-grid {
                  background-color: #f0fff4; /* Light green background */
                  border-radius: 8px;
                  padding: 16px;
                  margin-bottom: 24px;
                }
                .info-item {
                  margin-bottom: 12px;
                }
                .info-label {
                  font-size: 13px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  color: #6b7280;
                  margin-bottom: 4px;
                }
                .info-value {
                  font-size: 15px;
                  color: #111827;
                  font-weight: 500;
                }
                .footer {
                  color: #6b7280;
                  font-size: 13px;
                  border-top: 1px solid #e5e7eb;
                  padding-top: 16px;
                  margin-top: 32px;
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
              <div class="email-container">
                <div class="header">
                  <h1 class="logo">Temperature Monitor</h1>
                  <div class="alert-badge">Critical Alert</div>
                </div>

                <div class="temperature">
                  ${temperature}°C
                </div>

                <div class="message">
                  <p>AI-Ponics has detected high temperature within your system!</p>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">Above Critical Threshold</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Time Detected</div>
                    <div class="info-value">${new Date().toLocaleString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Required Action</div>
                    <div class="info-value">Immediate Inspection Required</div>
                  </div>
                </div>

                <div class="message">
                  <p>Recommended actions:</p>
                  <ul style="padding-left: 20px; margin: 12px 0;">
                    <li>Make sure the area is well ventilated</li>
                    <li>Move to a different area with lower room temperature</li>
                    <li>Monitor for additional fluctuations</li>
                  </ul>
                </div>

                <div class="footer">
                  <p>This is an automated alert from your monitoring system. Do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>`,
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