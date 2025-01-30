// Blynk API setup
#define BLYNK_TEMPLATE_ID "template_id"
#define BLYNK_TEMPLATE_NAME "template_name"
#define BLYNK_AUTH_TOKEN "blynk_auth_token"
#define BLYNK_PRINT Serial

// Email setup
#define SMTP_HOST "smtp.gmail.com" // Gmail SMTP server
#define SMTP_PORT 465
#define EMAIL_SENDER_ACCOUNT "email_sender_account"  
#define EMAIL_SENDER_PASSWORD "email_sender_password"       
#define EMAIL_RECIPIENT "email_recipient"       

// ESP32 Libries
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <ESP_Mail_Client.h> 

// Blynk credentials
char auth[] = BLYNK_AUTH_TOKEN;

// WiFi credentials
char ssid[] = "wifi_name";  // WiFi name
char pass[] = "wifi_password";  // WiFi password

BlynkTimer timer;

// DHT22 sensor setup
#define DHTPIN 27 // Pin of DHT22 sensor
#define DHTTYPE DHT22  
DHT dht(DHTPIN, DHTTYPE);

// Water flow sensor setup
#define FLOW_SENSOR_PIN 26
volatile int flowPulseCount = 0;
float flowRate = 0.0;
unsigned long oldTime = 0;

// Email setup
SMTPSession smtp;

unsigned long lastEmailSent = 0;
const unsigned long emailInterval = 10 * 60 * 1000; // Interval is set to 10 minutes

void IRAM_ATTR pulseCounter() {
  flowPulseCount++;
}

// Function to send email alert
void sendEmailAlert(float temperature) {
  if (millis() - lastEmailSent >= emailInterval) {
    Serial.println("Preparing email...");

    // Set up SMTP session configuration
    ESP_Mail_Session session;
    session.server.host_name = SMTP_HOST;
    session.server.port = SMTP_PORT;
    session.login.email = EMAIL_SENDER_ACCOUNT;
    session.login.password = EMAIL_SENDER_PASSWORD;
    session.login.user_domain = ""; 

    // Set up the message
    SMTP_Message message;
    message.sender.name = "ESP32 Temp Alert";
    message.sender.email = EMAIL_SENDER_ACCOUNT;
    message.subject = "Temperature Alert!";
    message.addRecipient("Recipient", EMAIL_RECIPIENT);

    // HTML content for email
    String htmlContent = "<html>"
    "<head>"
      "<meta charset=\"utf-8\" />"
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
      "<title>Temperature Alert</title>"
    "</head>"
    "<body style=\"margin: 0; padding: 0; background-color: #f3f4f6;\">"
      "<div style=\"max-width: 580px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background-color: #ffffff;\">"
        "<div style=\"border-bottom: 2px solid #38a169; padding-bottom: 16px; margin-bottom: 24px;\">"
          "<h1 style=\"color: #38a169; font-size: 30px; font-weight: 600; letter-spacing: -0.025em; margin: 0;\">Temperature Monitor</h1>"
          "<div style=\"display: inline-block; background-color: #ffe6e6; color: #e74c3c; padding: 4px 12px; border-radius: 6px; font-size: 18px; font-weight: 500; margin-top: 8px;\">Critical Alert</div>"
        "</div>"

        "<div style=\"font-size: 48px; font-weight: 700; color: #e74c3c; margin: 24px 0; font-feature-settings: 'tnum'; font-variant-numeric: tabular-nums;\">" + String(temperature) + "°C</div>"

        "<div style=\"color: #374151; line-height: 1.6; margin-bottom: 24px;\">"
          "<p style=\"font-size: 16px;\">AI-Ponics has detected high temperature within your system!</p>"
        "</div>"

        "<div style=\"background-color: #f0fff4; border-radius: 8px; padding: 16px; margin-bottom: 24px;\">"
          "<div style=\"margin-bottom: 12px;\">"
            "<div style=\"font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px;\">Status</div>"
            "<div style=\"font-size: 15px; color: #111827; font-weight: 500;\">Above Critical Threshold</div>"
          "</div>"
          "<div style=\"margin-bottom: 12px;\">"
            "<div style=\"font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px;\">Time Detected</div>"
            "<div style=\"font-size: 15px; color: #111827; font-weight: 500;\">" + String(millis()) + "</div>"
          "</div>"
          "<div style=\"margin-bottom: 12px;\">"
            "<div style=\"font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px;\">Required Action</div>"
            "<div style=\"font-size: 15px; color: #111827; font-weight: 500;\">Immediate Inspection Required</div>"
          "</div>"
        "</div>"

        "<div style=\"color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;\">"
          "<p>This is an automated alert from your monitoring system. Do not reply to this email.</p>"
        "</div>"
      "</div>"
    "</body>"
  "</html>";

    message.html.content = htmlContent.c_str();
    message.html.charSet = "utf-8";
    message.html.transfer_encoding = Content_Transfer_Encoding::enc_7bit;

    // Connect to the SMTP server
    if (!smtp.connect(&session)) {
      Serial.println("Failed to connect to SMTP server: " + smtp.errorReason());
      return;
    } else {
      Serial.println("Connected to SMTP server.");
    }

    // Send the email
    if (!MailClient.sendMail(&smtp, &message)) {
      Serial.println("Failed to send email: " + smtp.errorReason());
    } else {
      Serial.println("Email sent successfully.");
      lastEmailSent = millis();
    }

    // Close the SMTP session
    smtp.closeSession();
  } else {
    Serial.println("Email not sent: Interval not reached.");
  }
}

// Function to send sensor data to Blynk API
void sendSensor() {
  // Units for temperature is Celsius
  float h = dht.readHumidity();
  float t = dht.readTemperature(); 

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Blynk.virtualWrite(V0, t); // Pin V0 is for Temperature
  Blynk.virtualWrite(V1, h); // Pin V1 is for Humidity
  Serial.print("Temperature : ");
  Serial.print(t);
  Serial.print(" Humidity : ");
  Serial.println(h);

  // Check temperature and send email if above threshold
  if (t > 36) {
    sendEmailAlert(t);
  }

  // Calculate flow rate
  unsigned long currentTime = millis();
  unsigned long elapsedTime = currentTime - oldTime;

  if (elapsedTime > 1000) { // Update every second
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));
    
    flowRate = (flowPulseCount / 7.5); // 7.5 pulses per liter per minute

    Serial.print("Flow Rate: ");
    Serial.println(flowRate);

    Blynk.virtualWrite(V2, flowRate); // Pin V2 is for Flow Rate

    flowPulseCount = 0; // Reset after sending data
    oldTime = currentTime;

    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
  }
}

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(200);
  }
  Serial.println("\nWiFi connected.");
  Serial.println("IP address: " + WiFi.localIP().toString());

  // Initialize Blynk
  Blynk.begin(auth, ssid, pass);

  // Initialize DHT sensor
  dht.begin();

  // Initialize water flow sensor
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  // Set up timer to read sensor data every second
  timer.setInterval(1000L, sendSensor);
}

void loop() {
  Blynk.run();
  timer.run();
}