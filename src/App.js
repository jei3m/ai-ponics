import React, { useEffect, useState } from 'react';
import { 
  Route, 
  Routes, 
} from 'react-router-dom';
import { auth } from './firebase';


import Chat from './pages/Chat';
import Login from './pages/Login';
import Forum from './pages/Forum';
import DetailedView from './pages/ForumDetailed';
import Sensors2 from './pages/Sensors2';

// Import routes and context
import PrivateRoutes from './routes/PrivateRoutes';
import { ApiKeyProvider } from './context/ApiKeyContext';
import Loading from './pages/Loading';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div><Loading/></div>;
  }

  return (
    <ApiKeyProvider>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/chat"
          element={
            <PrivateRoutes>
              <Chat />
            </PrivateRoutes>
          }
        />

        <Route
          path="/home"
          element={
            <PrivateRoutes>
              <Sensors2 />
            </PrivateRoutes>
          }
        />

        <Route
          path="/forum"
          element={
            <PrivateRoutes>
              <Forum />
            </PrivateRoutes>
          }
        />
        
        <Route
          path="/forum/:id"
          element={
            <PrivateRoutes>
              <DetailedView />
            </PrivateRoutes>
          }
        />

        <Route
          path="/loading"
          element={
            <PrivateRoutes>
              <Loading/>
            </PrivateRoutes>
          }
        />
         
      </Routes>
    </ApiKeyProvider>
  );
}

export default App;
