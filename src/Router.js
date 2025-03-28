import React, { useEffect, useState } from 'react';
import { 
  Route, 
  Routes, 
} from 'react-router-dom';
import { auth } from './firebase';

// Pages
import Chat from './pages/Chat';
import Sensors from './pages/Sensors';
import NotFound from './pages/NotFound';

// Import routes and context
import PrivateRoutes from './routes/PrivateRoutes';
import Loading from './pages/components/Loading';
import Layout from './layout/Layout';
import LandingPage from './pages/LandingPage';

function Router() {
  // eslint-disable-next-line
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
    <Routes>

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<NotFound />} />

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
            <Layout>
              <Sensors />
            </Layout>
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
  );
}

export default Router;