import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  MeetingConsumer,
  useMeeting,
  useParticipant,
  Constants,
} from "@videosdk.live/react-sdk";
import { authToken, createStream } from "../API";
import ReactPlayer from "react-player";
import Header from './components/Header'; 
import Chat from '../pages/Chat';
import './css/DiseaseDetection.css'; 
import { UserAuth } from '../context/AuthContext'; 

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
        <button className="btn" onClick={() => handleAction(Constants.modes.SEND_AND_RECV)}>
          Create Live Stream as Host
        </button>
        <button className="btn" onClick={() => handleAction(Constants.modes.SEND_AND_RECV)}>
          Join as Host
        </button>
        <button className="btn" onClick={() => handleAction(Constants.modes.RECV_ONLY)}>
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

  // Stream initialization logic
  const initializeStream = async (id) => {
    const newStreamId = id || (await createStream({ token: authToken }));
    setStreamId(newStreamId);
  };

  const onStreamLeave = () => setStreamId(null);

  return (
    <div>
      {/* Only show Header if streamId is not set */}
      {!streamId && <Header />}

      <div className="main-content">
        {/* Show Chat only when streamId is set (when the user is in the meeting) */}
        {streamId && <Chat />}

        {authToken && streamId ? (
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
            {/* Stream related content */}
            <LSContainer streamId={streamId} onLeave={onStreamLeave} />
          </MeetingProvider>
        ) : (
          // If no streamId, show the Join View
          <JoinView initializeStream={initializeStream} setMode={setMode} />
        )}
      </div>
    </div>
  );
}


export default DiseaseDetection;
