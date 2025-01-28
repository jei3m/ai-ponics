//This is the Auth token, you will use it to generate a meeting and connect to it

export const authToken = process.env.REACT_APP_VIDEOSDK_API_KEY;
// API call to create a meeting
// API call to create stream
export const createStream = async ({ token }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  //Destructuring the streamId from the response
  const { roomId: streamId } = await res.json();
  return streamId;
};