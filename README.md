# AI-Ponics

![Image](https://github.com/user-attachments/assets/928c6c75-8484-407c-848c-7263147f3f78)

AI-Ponics is a web application developed to monitor and manage plants in an aeroponic system. It utilizes advanced technologies like Gemini AI for image detection and interactive chatbot functionality, Blynk API for real-time sensor monitoring,  OpenWeather API for current weather forecast, and Firebase for backend services, including plant data storage and user authentication.

## Features

 **Plant State Detection**
- **Gemini 2.0 Flash** is used to analyze images of plants uploaded by users. It assesses the plant's health and growth, offering insights such as whether the plant is thriving or needs attention. The AI can also detect symptoms of common plant diseases or issues related to nutrition and environmental conditions.

**Real-Time Sensor Monitoring**
- **Blynk API** integrates various environmental sensors, providing real-time data on factors like temperature, humidity, and other parameters that influence plant growth. This data is accessible through the appâs dashboard, ensuring users can monitor their aeroponic system remotely and act accordingly.

**Plant Intelligence**
- A custom knowledge base implemented to enhance the AI chatbotâs responses with precise, data-backed insights on plant care, environmental factors, disease management, and optimal growth strategies for various crops. 

**Weather Forecast**
 - The OpenWeather API is used to provide users with weather forecasts based on their set address. This allows users to anticipate environmental conditions and adjust their aeroponic system accordingly.  This forecast is accessible through the app's dashboard, enabling users to optimize their aeroponic system based on current weather conditions.
 
**Firebase Integration**
- **Firebase** is used for user authentication (via Google), storing user data in the cloud, and synchronizing real-time changes across devices. This ensures seamless access to plant information and system controls from multiple devices.

**AI-Powered Chatbot**
- The **Gemini 2.0 Flash** chatbot delivers real-time, personalized plant care advice by analyzing sensor data, current weather forecast, and user input. It answers specific user queries to help maintain plant health within aeroponic systems.

**Email Notifications**
- Users will receive email alerts when critical environmental conditions, like temperature thresholds, are reached. This feature helps ensure that the user is alerted if immediate actions are required.

**Multiple Blynk API Keys**
- The application supports the use of **multiple Blynk API keys**, enabling users to manage different aeroponic systems and switch between them seamlessly, which is especially useful for users with multiple setups.

## Technologies Used

**React JS**
- A JavaScript based framework created by Meta. This is the framework of choice due to its component based architecture, which facilitates the creation of dynamic and responsive user interfaces. Additionally, it has multiple supported libraries which are implemented to reduce the time needed for development.

**Ant Design**
- A comprehensive React UI library developed by Ant Group. It provides a rich set of high-quality components and design principles, enabling developers to build consistent user interfaces efficiently.

**Gemini 2.0 Flash**
- A multimodal large language model developed by Google, chosen for its ability to both analyze plant images and function as a chatbot. This model leverages sensor data,  plant information, and current weather forecast as context, allowing it to provide more accurate insights by combining image detection with conversational capabilities.

**Blynk API**
- A low-code IoT cloud platform which is ideal for IoT projects like AI-Ponics, as it offers real-time data integration and monitoring for various sensors. Its ease of use and extensive support for hardware integration, and API support made it the perfect choice for this project.

**OpenWeather API**
- A weather data service that delivers real-time and forecasted weather information based on user-defined locations. This data is utilized in the Weather Forecast feature and is also integrated into the AI chatbot, allowing users to make informed decisions and optimize their aeroponic system based on current environmental conditions.

**Firebase**
- A comprehensive backend platform developed by Google, chosen for its services such as user authentication, real-time database management, and cloud storage. Firebase efficiently handles user profiles, and enables real-time data synchronization across devices, making it an ideal solution for the AI-Ponics web application.

## Parts

### **ESP32 Development Board**
- A low-cost, versatile microcontroller. Chosen for its built-in WiFi module and direct compatibility with the Blynk API. Additionally it has support for Email libraries which are then utilized for the Email notification feature of the system.

![Image](https://github.com/user-attachments/assets/41a04621-ba4c-4440-af4f-1e572a43edca)


### **DHT22**
- A temperature and humidity sensor. This is used for monitoring environmental conditions, with a temperature range of -40Â°C to 80Â°C and a humidity range of 0% to 100%. While its accuracy is Â±0.5Â°C for temperature and Â±1%.

![Image](https://github.com/user-attachments/assets/23f49f05-ef8f-48cc-85aa-bf335c50f4be)


### **YF-S201**
- A Hall Effect water flow sensor with a working flow rate of 1 to 30 liters per minute and an accuracy of Â±10%, used for monitoring the pump operation of the AI-Ponics system.

![Image](https://github.com/user-attachments/assets/c9811138-0278-4bb1-bf75-0ca1785fb7f3)

### **PH-4502C**
- An analog pH sensor module designed for measuring the acidity or alkalinity of a solution, with a measurement range of 0 to 14 pH. It features an adjustable potentiometer for calibration and provides an analog voltage output corresponding to the pH level. Used in the AI-Ponics system to monitor  optimal nutrient solution conditions.

![Image](https://github.com/user-attachments/assets/6682ce8d-7d46-4129-adb0-a6f2a5172d39)


### **0.96 OLED Screen**
- A compact display with a resolution of 128x64 pixels, commonly used to show real-time data such of sensor readings, and email alert status, in the AI-Ponics system.

![Image](https://github.com/user-attachments/assets/57ce72b4-f97a-4060-8605-ef03667b44b8)


## Schematic

The schematic diagram below illustrates the connections between the ESP32 Dev Board and the aforementioned sensors:

![Image](https://github.com/user-attachments/assets/c39699b8-886d-4988-b4f2-5487bd710778)

### DHT22

![Image](https://github.com/user-attachments/assets/84ef0929-5de7-4a24-a241-93d825834378)

The 3.3V pin is connected to the positive terminal of the DHT22 sensor, while the GND pin is connected to the negative terminal of the sensor. The data pin of the DHT22 sensor is connected to the D27 pin of the ESP32 Dev Board.

### YF-S201

![Image](https://github.com/user-attachments/assets/6a865d2e-c72d-472c-bb8e-967aaf142d0d)

The positive terminal is connected to the VIN pin of the Dev Board, and the negative terminal is connected to the GND pin located just above the VIN pin on the Dev Board. While the signal pin is connected to the D26 pin of the Dev Board. The VIN pin of the Dev Board is used to power the Water Flow Sensor instead of other power options. Since the VIN pin on the ESP32 Dev Board can function as either an input or an output pin, depending on how the module is powered.

### OLED Display

![Image](https://github.com/user-attachments/assets/2fbda1f2-2a9d-48e7-ae38-5d7659c5e01e)

The VCC pin of the OLED display is connected in parallel with the positive terminal of the DHT22 sensor at the 3.3V pin of the ESP32 module, while the GND pin of the OLED is connected in parallel with the DHT22 sensor at the GND pin of the ESP32 module. The SCL pin is connected to the D22 pin (default I2C clock line) of the ESP32, and the SDA pin is connected to the D21 pin. The ESP32 has flexible I2C pin assignments, allowing any I2C pin to be configured as SDA or SCL. However, GPIO21 (SDA) and GPIO22 (SCL) are commonly used as default I2C pins for compatibility with existing code, and libraries.

### PH-4502C

![Image](https://github.com/user-attachments/assets/1d0d9d82-6f38-48cb-90e7-c3b4780fb559)

The V+ pin of the sensor is connected to the VIN pin of the ESP32 module, in parallel with the VCC pin of the YF-S201 Water Flow Sensor. The G pin of the sensor is connected to the GND pin located next to the VIN pin of the module. The analog output pin (Po) is connected to the D33 pin of the module.

Before connecting the Po pin, the sensor's potentiometer is adjusted first to ensure the analog voltage reaches 2.50V. After adjusting the potentiometer, the sensor is further calibrated via code using a two-point calibration method with buffer solutions at pH 4.01 and pH 6.86.
