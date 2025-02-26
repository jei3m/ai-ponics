import React, { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  Constants,
} from "@videosdk.live/react-sdk";
import { authToken, createStream } from "../API";
import Header from "./components/Header";
import Chat from "../pages/Chat";
import "./css/DiseaseDetection.css";
import { UserAuth } from "../context/AuthContext";
import { Spin } from "antd";
import {
  fetchSensorData,
  getStatusConfig,
  StatusMessage,
} from "../services/sensorService";

function JoinView({ initializeStream, setMode }) {
  const [streamId, setStreamId] = useState("");

  const handleAction = async (mode) => {
    setMode(mode);
    await initializeStream(streamId);
  };

  return (
    <div className="join-container">
      <input
        type="text"
        placeholder="Enter Stream Id"
        value={streamId}
        onChange={(e) => setStreamId(e.target.value)}
        className="input-box"
      />

      <div className="button-container">
        <button
          className="btn"
          onClick={() => handleAction(Constants.modes.SEND_AND_RECV)}
        >
          Create Live Stream as Host
        </button>
        <button
          className="btn"
          onClick={() => handleAction(Constants.modes.SEND_AND_RECV)}
        >
          Join as Host
        </button>
        <button
          className="btn"
          onClick={() => handleAction(Constants.modes.RECV_ONLY)}
        >
          Join as Audience
        </button>
      </div>
    </div>
  );
}

function LSContainer({ streamId, onLeave }) {
  const [joined, setJoined] = useState(false);

  const { join } = useMeeting({
    onMeetingJoined: () => setJoined(true),
    onMeetingLeft: onLeave,
    onError: (error) => alert(error.message),
  });

  return (
    <div className="container">
      <h3>Stream Id: {streamId}</h3>
      {joined ? <StreamView /> : <button onClick={join}>Join Stream</button>}
    </div>
  );
}

function StreamView() {
  const { participants } = useMeeting();

  return (
    <div>
      <LSControls />
      {[...participants.values()]
        .filter((p) => p.mode === Constants.modes.SEND_AND_RECV)
        .map((p) => (
          <Participant participantId={p.id} key={p.id} />
        ))}
    </div>
  );
}

function Participant({ participantId }) {
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(participantId);

  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const setupStream = (stream, ref, condition) => {
    if (ref.current && stream) {
      ref.current.srcObject = condition
        ? new MediaStream([stream.track])
        : null;
      condition && ref.current.play().catch(console.error);
    }
  };

  useEffect(() => setupStream(micStream, audioRef, micOn), [micStream, micOn]);
  useEffect(
    () => setupStream(webcamStream, videoRef, webcamOn),
    [webcamStream, webcamOn]
  );

  return (
    <div>
      <p>
        {displayName} | Webcam: {webcamOn ? "ON" : "OFF"} | Mic:{" "}
        {micOn ? "ON" : "OFF"}
      </p>
      <audio ref={audioRef} autoPlay muted={isLocal} />
      {webcamOn && (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          height="200"
          width="300"
        />
      )}
    </div>
  );
}

function LSControls() {
  const { leave, toggleMic, toggleWebcam, changeMode, meeting } = useMeeting();
  const currentMode = meeting.localParticipant.mode;

  return (
    <div className="controls">
      <button onClick={leave}>Leave</button>

      {currentMode === Constants.modes.SEND_AND_RECV && (
        <>
          <button onClick={toggleMic}>Toggle Mic</button>{" "}
          <button onClick={toggleWebcam}>Toggle Camera</button>
        </>
      )}

      <button
        onClick={() =>
          changeMode(
            currentMode === Constants.modes.SEND_AND_RECV
              ? Constants.modes.RECV_ONLY
              : Constants.modes.SEND_AND_RECV
          )
        }
      >
        {currentMode === Constants.modes.SEND_AND_RECV
          ? "Switch to Audience Mode"
          : "Switch to Host Mode"}
      </button>
    </div>
  );
}

function DiseaseDetection() {
  const [streamId, setStreamId] = useState(null);
  const [mode, setMode] = useState(Constants.modes.SEND_AND_RECV);
  const { currentUser } = UserAuth();
  const [isApiKeyValid, setIsApiKeyValid] = useState(true);
  const [isDeviceOnline, setIsDeviceOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const[flowRate, setFlowRate] = useState(null);
  const [selectedApiKey, setSelectedApiKey] = useState(null);

  const fetchSelectedApiKey = async () => {
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
  
      const {
        selectedApiKey = '',
      } = docSnap.data();
  
      setSelectedApiKey(selectedApiKey);
  
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchSelectedApiKey();
  }, [selectedApiKey]);
  
  useEffect(() => {

    if (!selectedApiKey) {
      console.error("API key is missing!");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchData = async () => {
      try {
        await fetchSensorData({
          selectedApiKey,
          setIsDeviceOnline,
          setTemperature,
          setHumidity,
          setFlowRate,
          setIsLoading,
          setIsApiKeyValid,
        });
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedApiKey]);
  
  // Initialize Stream
  const initializeStream = async (id) => {
    setIsLoading(true);
    try {
      const newStreamId = id || (await createStream({ token: authToken }));
      setStreamId(newStreamId);
    } catch (error) {
      console.error("Stream initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onStreamLeave = () => setStreamId(null);

  // Status configuration for stream
  const statusConfig = getStatusConfig(
    selectedApiKey,
    isApiKeyValid,
    isDeviceOnline,
    isLoading
  );
  const activeStatus = statusConfig.find((status) => status.when);

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <Header />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "0.4rem",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            maxWidth: "100vw",
            borderRadius: "14px",
            height: "fit-content",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            padding: "1.8rem",
          }}
        >
          {activeStatus ? (
            <div style={{ textAlign: "center", paddingTop: "20px" }}>
              <StatusMessage {...activeStatus} />
              {isLoading && <Spin />}
            </div>
          ) : (
            <>
              {!streamId ? (
                <JoinView
                  initializeStream={initializeStream}
                  setMode={setMode}
                />
              ) : (
                <MeetingProvider
                  config={{
                    meetingId: streamId,
                    micEnabled: true,
                    webcamEnabled: true,
                    name: currentUser?.displayName || "Guest",
                    mode,
                  }}
                  token={authToken}
                >
                  <LSContainer streamId={streamId} onLeave={onStreamLeave} />
                </MeetingProvider>
              )}

              {streamId && <Chat />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiseaseDetection;
