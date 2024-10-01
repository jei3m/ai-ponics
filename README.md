# AI-Ponics

## Overview

AI-Ponics is an advanced web application built with React JS, designed to monitor and manage plants in an aeroponic system using technology. The website integrates Gemini AI for image detection and analysis, providing insights into the state of the plants. Additionally, it utilizes the Blynk API for live updates from sensor monitoring, ensuring real-time data for optimal plant care.

## Features

- **Plant State Detection**: Leveraging Gemini AI, the application can analyze images of the plant to assess their health and growth status.
  
- **Real-Time Sensor Monitoring**: Integration with the Blynk API allows for continuous monitoring of environmental conditions through various sensors. Users receive live updates on factors such as humidity, and temperature. Ensuring a controlled and optimized growing environment.

- **Firebase Integration**: Firebase provides backend services such as user authentication (via Google), real-time database storage, and cloud-based data sync. This ensures seamless data management, user profiles, and real-time updates across devices.

- **User-Friendly Interface**: The React JS-based frontend with the implementation of Ant Design provides an intuitive and interactive user experience, making it easy to visualize plant health data and sensor readings.

- **Multiple Blynk API Keys**: Users can now implement multiple Blynk API keys, allowing seamless switching between Aeroponic systems.

## Technologies Used

- **React JS**: For building a dynamic and responsive user interface.
- **Gemini AI**: For image and text prompt analysis tailored to aeroponic systems.
- **Blynk API**: For real-time sensor data integration and monitoring.
- **Firebase**: For user authentication and synchronization of data.

## Installation

To set up AI-Ponics locally, follow these steps:

1. **Clone the Repository**

    ```bash
    git clone https://github.com/yourusername/ai-ponics.git
    cd ai-ponics
    ```

2. **Install Dependencies**

    ```bash
    npm install
    ```

3. **Set Up Environment Variables**

    Create a `.env` file in the root directory and add your Gemini AI and Blynk API credentials.

    ```env
    REACT_APP_GEMINI_API_KEY=your_gemini_api_key
    ```

4. **Start the Development Server**

    ```bash
    npm start
    ```

5. **Open Your Browser**

    Navigate to `http://localhost:3000` to view the application.

## Usage

- **Upload Plant Images**: Use the interface to upload images of plants. The AI will analyze the images and provide insights into plant health.
- **View Sensor Data**: Access live updates from your aeroponic system's sensors to monitor environmental conditions and make adjustments as needed.
- **AI-Chatbot**: Interact with an AI-powered chatbot for real-time advice on plant care, troubleshooting, and system optimization.

