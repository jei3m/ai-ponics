#include "config.h"

// ESP32 Libraries
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <ESP_Mail_Client.h> 

// OLED Libraries
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Blynk credentials
char auth[] = BLYNK_AUTH_TOKEN;

BlynkTimer timer;

// DHT22 sensor setup
#define DHTPIN 27 // Pin of DHT22 sensor
#define DHTTYPE DHT22  
DHT dht(DHTPIN, DHTTYPE);

// Water flow sensor setup
#define FLOW_SENSOR_PIN 26 // Pin of Water Flow sensor
volatile int flowPulseCount = 0;
float flowRate = 0.0;
unsigned long oldTime = 0;

// pH sensor setup
#define PH_PIN 33         
float ph_value = 0.0;      
float calibph686 = 2.42;   // Calculated Voltage at pH 6.86 
float calibph4 = 3.17;     // Calculated Voltage at pH 4.01 
unsigned int samples = 10;  
float adc_resolution = 4096.0; // ESP32 ADC resolution

// Email setup
SMTPSession smtp;

// Interval for Temp Alert
unsigned long lastEmailTempSent = 0;
const unsigned long emailTempInterval = 10 * 60 * 1000; // Interval is set to 10 minutes

// Interval for Pump Alert
unsigned long lastEmailPumpSent = 0;
const unsigned long emailPumpInterval = 10 * 60 * 1000; // Interval is set to 10 minutes

// OLED setup
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1 // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void IRAM_ATTR pulseCounter() {
  flowPulseCount++;
}

// Function to calculate pH level
float readPH() {
  float avg_value = 0.0;
  for (int i = 0; i < samples; i++) {
      avg_value += analogRead(PH_PIN);
      delay(10);
  }
  float adc_raw = avg_value / samples;
  float voltage = adc_raw * 3.3 / adc_resolution;

  // Calculate slope (m) and intercept (b)
  double m = (4.01 - 6.86) / (calibph4 - calibph686);
  double b = 6.86 - m * calibph686;

  // Calculate pH value
  double ph_act = m * voltage + b;

  return ph_act;
}

// Function to send Temperature email alert
void sendTempAlert(float temperature) {
  if (millis() - lastEmailTempSent >= emailTempInterval) {
    Serial.println("Preparing email...");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.println("Preparing email...");
    display.display();

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
    String htmlContent = R"(
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Temperature Alert</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 580px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #38a169; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #38a169; font-size: 30px; font-weight: 600; letter-spacing: -0.025em; margin: 0;">AI-Ponics</h1>
            <div style="display: inline-block; background-color: #ffe6e6; color: #e74c3c; padding: 4px 12px; border-radius: 6px; font-size: 18px; font-weight: 500; margin-top: 8px;">Temperature Alert</div>
          </div>

          <div style="font-size: 48px; font-weight: 700; color: #e74c3c; margin: 24px 0; font-feature-settings: 'tnum'; font-variant-numeric: tabular-nums;">)" + String(temperature) + R"(°C</div>

          <div style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
            <p style="font-size: 16px;">AI-Ponics has detected high temperature within your system!</p>
          </div>

          <div style="background-color: #f0fff4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="margin-bottom: 12px;">
              <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px;">Status</div>
              <div style="font-size: 15px; color: #111827; font-weight: 500;">Above Critical Threshold</div>
            </div>
            <div style="margin-bottom: 12px;">
              <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px;">Required Action</div>
              <div style="font-size: 15px; color: #111827; font-weight: 500;">
                Immediate action is required. Please follow the steps below:
                <ul style="font-size: 14px; color: #111827; font-weight: 400; margin-top: 8px; padding-left: 20px;">
                  <li>Ensure proper airflow within the system and remove any obstructions.</li>
                  <li>If applicable, reduce the environmental temperature by adjusting the AC or moving the system to a cooler location.</li>
                  <li>Monitor the temperature and ensure that it returns to a safe range (below 36°C).</li>
                </ul>
              </div>
            </div>
          </div>

          <div style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;">
            <p>This is an automated alert from your monitoring system. Do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
    )";

    message.html.content = htmlContent.c_str();
    message.html.charSet = "utf-8";
    message.html.transfer_encoding = Content_Transfer_Encoding::enc_7bit;

    // Connect to the SMTP server
    if (!smtp.connect(&session)) {
      Serial.println("Failed to connect to SMTP server: " + smtp.errorReason());
      display.setCursor(0, 10);
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.println("Failed to connect to SMTP server: " + smtp.errorReason());
      display.display();
      delay(2000);
      return;
    } else {
      Serial.println("SMTP Connected.");
      display.setCursor(0, 10);
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.println("SMTP Connected.");
      display.display();
      delay(2000);
    }

    // Send the email
    if (!MailClient.sendMail(&smtp, &message)) {
      Serial.println("Failed to send email: " + smtp.errorReason());
    } else {
      Serial.println("Email Alert sent!");
      display.clearDisplay();
      display.setCursor(0, 0);
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.println("Email Alert sent!");
      display.display();
      delay(2000);
      lastEmailTempSent = millis();
    }

    // Close the SMTP session
    smtp.closeSession();
  } else {
    Serial.println("Email interval not reached.");
    display.setCursor(0, 40);
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.println("Email interval not reached.");
    display.display();
    delay(2000);
  }
}

// Function to send Temperature email alert
void sendPumpAlert() {
  if (millis() - lastEmailPumpSent >= emailPumpInterval) {
    Serial.println("Preparing email...");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.println("Preparing email...");
    display.display();

    // Set up SMTP session configuration
    ESP_Mail_Session session;
    session.server.host_name = SMTP_HOST;
    session.server.port = SMTP_PORT;
    session.login.email = EMAIL_SENDER_ACCOUNT;
    session.login.password = EMAIL_SENDER_PASSWORD;
    session.login.user_domain = ""; 

    // Set up the message
    SMTP_Message message;
    message.sender.name = "ESP32 Pump Alert";
    message.sender.email = EMAIL_SENDER_ACCOUNT;
    message.subject = "Pump Alert!";
    message.addRecipient("Recipient", EMAIL_RECIPIENT);

    // HTML content for email
    String htmlContent = R"(
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pump Alert</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 580px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #38a169; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #38a169; font-size: 30px; font-weight: 600; letter-spacing: -0.025em; margin: 0;">AI-Ponics</h1>
            <div style="display: inline-block; background-color: #ffe6e6; color: #e74c3c; padding: 4px 12px; border-radius: 6px; font-size: 18px; font-weight: 500; margin-top: 8px;">Pump Alert</div>
          </div>

          <div style="font-size: 48px; font-weight: 700; color: #e74c3c; margin: 24px 0; font-feature-settings: 'tnum'; font-variant-numeric: tabular-nums;">0 L/min</div>

          <div style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
            <p style="font-size: 16px;">AI-Ponics has detected that the pump is not operational.</p>
          </div>

          <div style="background-color: #f0fff4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="margin-bottom: 12px;">
              <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px;">Status</div>
              <div style="font-size: 15px; color: #111827; font-weight: 500;">Water Flow Rate: 0 L/min</div>
            </div>
            <div style="margin-bottom: 12px;">
              <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px;">Required Action</div>
              <div style="font-size: 15px; color: #111827; font-weight: 500;">
                Immediate action is required. Please follow the steps below:
                <ul style="font-size: 14px; color: #111827; font-weight: 400; margin-top: 8px; padding-left: 20px;">
                  <li>Verify that the pump is powered on and properly connected.</li>
                  <li>Inspect the water flow sensor to ensure it is functioning correctly.</li>
                  <li>Check for any blockages in the water flow path that may be obstructing the pump.</li>
                  <li>If the issue persists, inspect the pump for potential mechanical faults.</li>
                </ul>
              </div>
            </div>
          </div>

          <div style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;">
            <p>This is an automated alert from your monitoring system. Do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
    )";

    message.html.content = htmlContent.c_str();
    message.html.charSet = "utf-8";
    message.html.transfer_encoding = Content_Transfer_Encoding::enc_7bit;

    // Connect to the SMTP server
    if (!smtp.connect(&session)) {
      Serial.println("Failed to connect to SMTP server: " + smtp.errorReason());
      display.setCursor(0, 10);
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.println("Failed to connect to SMTP server: " + smtp.errorReason());
      display.display();
      delay(2000);
      return;
    } else {
      Serial.println("SMTP Connected.");
      display.setCursor(0, 10);
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.println("SMTP Connected.");
      display.display();
      delay(2000);
    }

    // Send the email
    if (!MailClient.sendMail(&smtp, &message)) {
      Serial.println("Failed to send email: " + smtp.errorReason());
    } else {
      Serial.println("Email Alert sent!");
      display.clearDisplay();
      display.setCursor(0, 0);
      display.setTextSize(1);
      display.setTextColor(SSD1306_WHITE);
      display.println("Email Alert sent!");
      display.display();
      delay(2000);
      lastEmailPumpSent = millis();
    }

    // Close the SMTP session
    smtp.closeSession();
  } else {
    Serial.println("Email interval not reached.");
    display.setCursor(0, 40);
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.println("Email interval not reached.");
    display.display();
    delay(2000);
  }
}

// Function to send sensor data to Blynk API
void sendSensor() {
  // Units for temperature is Celsius
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); 

  // Read pH value
  ph_value = readPH();

  // Send temperature and humidity to Blynk API
  Blynk.virtualWrite(V0, temperature); // Pin V0 is for Temperature
  Blynk.virtualWrite(V1, humidity); // Pin V1 is for Humidity
  Blynk.virtualWrite(V3, ph_value); // Pin V3 is for pH

  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.print("\nHumidity : ");
  Serial.println(humidity);
  Serial.print("pH Value : ");
  Serial.println(ph_value);

  // Check temperature and send email if above threshold
  if (temperature > 36) {
    sendTempAlert(temperature);
  }

  // Calculate flow rate
  unsigned long currentTime = millis();

  // Send calculated flow rate to Blynk API
  detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));
  flowRate = (flowPulseCount / 7.5); // 7.5 pulses per liter per minute
  Serial.print("Flow Rate: ");
  Serial.println(flowRate);
  Blynk.virtualWrite(V2, flowRate); // Pin V2 is for Flow Rate
  flowPulseCount = 0; // Reset after sending data
  oldTime = currentTime;
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  // Check flow rate and send email equal to 0
  if (flowRate = 0) {
    sendPumpAlert();
  }

  // Display sensor data at OLED Screen
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.println("Temp: " + String(temperature) + " C");
  display.println("Humidity: " + String(humidity) + " %");
  display.println("Flow: " + String(flowRate) + " L/min");
  display.println("pH: " + String(ph_value));
  display.display();

}

void setup() {
  Serial.begin(115200);

  // Initialize pH sensor pin
  pinMode(PH_PIN, INPUT);

  // Initialize OLED display
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { // Address 0x3C for 128x64
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();

  // Connect to WiFi
  Serial.print("Connecting to WiFi...");
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Connecting to WiFi...");
  display.display();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  delay(5000); // Delay for 5 seconds

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected.");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("WiFi Connected.");
    display.display();
    delay(1000);

    // Initialize Blynk
    Blynk.begin(auth, WIFI_SSID, WIFI_PASS);

    // Initialize DHT sensor
    dht.begin();

    // Initialize water flow sensor
    pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

    // Set up timer to read sensor data every second
    timer.setInterval(1000L, sendSensor);
  } else {
    Serial.println("\nFailed to connect to WiFi!");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("WiFi Connection Failed!");
    display.println("\nRestarting...");
    display.display();
    delay(3000);
    ESP.restart(); // Restart the ESP32 to try again
  }
}

void loop() {
  Blynk.run();
  timer.run();
}