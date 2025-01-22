import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import { authToken, createMeeting } from "../API";
import ReactPlayer from "react-player";
import Header from './components/Header'; 
import Chat from '../pages/Chat';
import './css/DiseaseDetection.css'; 
function JoinScreen({ getMeetingAndToken }) {
  const [meetingId, setMeetingId] = useState("");

  const handleJoin = async () => {
    await getMeetingAndToken(meetingId);
  };

  return (
    <div className="join-container">
      <input
        type="text"
        placeholder="Enter Meeting Id"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        className="input-box"
      />
      <div className="button-container">
        <button className="btn" onClick={handleJoin}>
          Join
        </button>
        <button className="btn" onClick={handleJoin}>
          Create Meeting
        </button>
      </div>
    </div>
  );
}


function ParticipantView({ participantId }) {
  const webcamRef = useRef(null);
  const micRef = useRef(null);

  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(participantId);

  useEffect(() => {
    if (webcamRef.current && webcamOn && webcamStream) {
      const mediaStream = new MediaStream([webcamStream.track]);
      webcamRef.current.srcObject = mediaStream;
      webcamRef.current.play().catch(console.error);
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream([micStream.track]);
        micRef.current.srcObject = mediaStream;
        micRef.current.play().catch(console.error);
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div className="participant-view">
      <p>Participant: {displayName}</p>
      <p>Webcam: {webcamOn ? "ON" : "OFF"} | Mic: {micOn ? "ON" : "OFF"}</p>
      <audio ref={micRef} autoPlay muted={isLocal} />
      {webcamOn && (
        <ReactPlayer
          playsinline
          url={webcamRef.current?.srcObject}
          playing
          height="200px"
          width="200px"
          style={{ borderRadius: "10px" }}
        />
      )}
    </div>
  );
}

function Controls() {
  const { leave, toggleMic, toggleWebcam } = useMeeting();

  return (
    <div className="controls">
      <button onClick={leave}>Leave</button>
      <button onClick={toggleMic}>Toggle Mic</button>
      <button onClick={toggleWebcam}>Toggle Webcam</button>
    </div>
  );
}

function MeetingView({ meetingId, onMeetingLeave }) {
  const [joined, setJoined] = useState(false);
  const { join, participants } = useMeeting({
    onMeetingJoined: () => setJoined(true),
    onMeetingLeft: onMeetingLeave,
  });

  return (
    <div className="container">
      <h3>Meeting Id: {meetingId}</h3>
      {joined ? (
        <>
          <Controls />
          {[...participants.keys()].map((id) => (
            <ParticipantView key={id} participantId={id} />
          ))}
        </>
      ) : (
        <button onClick={join}>Join Meeting</button>
      )}
    </div>
  );
}

function DiseaseDetection() {
  const [meetingId, setMeetingId] = useState(null);

  const getMeetingAndToken = async (id) => {
    const newMeetingId = id || (await createMeeting({ token: authToken }));
    setMeetingId(newMeetingId);
  };

  const handleMeetingLeave = () => setMeetingId(null);

  return (
    <div>
  
      <Header />

      <div className="main-content">

        <Chat />

        {meetingId ? (
          <MeetingProvider
            config={{
              meetingId,
              micEnabled: true,
              webcamEnabled: true,
              name: "C.V. Raman",
            }}
            token={authToken}
          >
            <MeetingView
              meetingId={meetingId}
              onMeetingLeave={handleMeetingLeave}
            />
          </MeetingProvider>
        ) : (
          <JoinScreen getMeetingAndToken={getMeetingAndToken} />
        )}
      </div>
    </div>
  );
}
export default DiseaseDetection;
