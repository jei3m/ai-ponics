import { useState, useEffect } from "react";
import axios from "axios";
import { differenceInDays } from "date-fns";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";
import { useApiKey } from "../context/ApiKeyContext";
import { sendEmailHot, sendEmailCold } from './emailService';

export const useSensorsLogic = () => {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [plantingDate, setPlantingDate] = useState("");
  const [daysSincePlanting, setDaysSincePlanting] = useState(0);
  const [temperatureAlert, setTemperatureAlert] = useState("");
  const [plantName, setPlantName] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [toastShown, setToastShown] = useState(false);
  const { selectedApiKey } = useApiKey();

  useEffect(() => {
    if (!selectedApiKey) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsApiKeyValid(true);

    const fetchSensorData = async () => {
      try {
        const temperatureResponse = await axios.get(
          `https://blynk.cloud/external/api/get?token=${selectedApiKey}&V0`,
        );
        const humidityResponse = await axios.get(
          `https://blynk.cloud/external/api/get?token=${selectedApiKey}&V1`,
        );
        setTemperature(temperatureResponse.data);
        setHumidity(humidityResponse.data);

        if (temperatureResponse.data > 73) {
          setTemperatureAlert("Temperature too high!");
          sendEmailHot(user, temperatureResponse.data);
        } else if (temperatureResponse.data < 15) {
          setTemperatureAlert("Temperature too low!");
          sendEmailCold(user, temperatureResponse.data);
        } else {
          setTemperatureAlert("");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data from Blynk:", error);
        setIsApiKeyValid(false);
        setTemperature(null);
        setHumidity(null);
        setTemperatureAlert("Error fetching data");
        if (!toastShown) {
          toast.error(
            "Error fetching data. Please check your API token and try again.",
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              onClose: () => setToastShown(false),
            },
          );
          setToastShown(true);
        }
        setIsLoading(false);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);

    return () => clearInterval(interval);
  }, [selectedApiKey, toastShown, user]);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.plantingDate) {
            setPlantingDate(data.plantingDate);
          }
          if (data.plantName) {
            setPlantName(data.plantName);
          }
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (plantingDate) {
      const selectedDate = new Date(plantingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days = differenceInDays(today, selectedDate);
      setDaysSincePlanting(days >= 0 ? days : 0);

      const currentUser = auth.currentUser;
      if (currentUser) {
        setDoc(
          doc(db, "users", currentUser.uid),
          {
            plantingDate: plantingDate,
            daysSincePlanting: days >= 0 ? days : 0,
          },
          { merge: true },
        );
      }
    }
  }, [plantingDate]);

  return {
    temperature,
    humidity,
    plantingDate,
    daysSincePlanting,
    temperatureAlert,
    plantName,
    user,
    isLoading,
    isApiKeyValid,
    selectedApiKey, 
    auth, 
    setDoc, 
    doc, 
    db,
    setPlantingDate,
    setPlantName,
  };
};