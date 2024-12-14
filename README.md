
![aiponics-header](https://github.com/user-attachments/assets/a548adbf-15fe-4a52-8c93-8f899280ab0d)

## Overview

AI-Ponics is a web application built with React JS, designed to monitor and manage plants in an aeroponic system using technology. The website integrates Gemini AI for image detection and analysis, providing insights into the state of the plants. Additionally, it utilizes the Blynk API for live updates from sensor monitoring, ensuring real-time data for optimal plant care.

## Features

- **Plant State Detection**: Leveraging Gemini AI, the application can analyze images of the plant to assess their health and growth status.
  
- **Real-Time Sensor Monitoring**: Integration with the Blynk API allows for continuous monitoring of environmental conditions through various sensors. Users receive live updates on factors such as humidity, and temperature.

- **Firebase Integration**: Firebase provides backend services such as user authentication (via Google), real-time database storage, and cloud-based data sync. This ensures seamless data management, user profiles, and real-time updates across devices.

- **AI-Chatbot Integration**: The application includes an AI-powered chatbot that provides real-time advice on plant care based on the sensor data. Images can also be sent to the chatbot for further analysis.

- **Email Notifications**: Users will receive email notifications whenever critical temperature thresholds are reached. Such as when it is too cold for the plant to grow, or when it is too hot for the plant to survive.

- **User-Friendly Interface**: The React JS-based frontend with the implementation of Ant Design provides an intuitive and interactive user experience, making it easy to visualize plant health data and sensor readings.

- **Multiple Blynk API Keys**: Users can now implement multiple Blynk API keys, allowing seamless switching between different Aeroponic systems.

## Technologies Used

- **React JS**: For building a dynamic and responsive user interface.
- **Gemini AI**: For image and text prompt analysis tailored to aeroponic systems.
- **Blynk API**: For real-time sensor data integration and monitoring.
- **Firebase**: For user authentication and synchronization of data.

## Installation

To set up AI-Ponics locally, follow these steps:

1. **Clone the Repository**

    ```bash
    git clone https://github.com/jei3m/ai-ponics.git
    cd ai-ponics
    ```

2. **Install Dependencies**

    ```bash
    npm install
    ```

3. **Set Up Environment Variables**

    Create a `.env` file in the root directory and add your Gemini AI and Firebase credentials.

    ```env
    REACT_APP_GEMINI_API_KEY=your_gemini_api_key
    REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
    REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
    ```

4. **Start the Development Server**

    ```bash
    npm start
    ```

5. **Open Your Browser**

    Navigate to `http://localhost:3000` to view the application.

## Usage

- **Upload Plant Images**: Use the interface to upload images of plants. The AI will analyze the images and provide insights about the plant.
- **View Sensor Data**: Access live updates from your aeroponic system's sensors to monitor environmental conditions.
- **AI-Chatbot**: Interact with an AI-powered chatbot for real-time advice on plant care, troubleshooting, and system optimization.
