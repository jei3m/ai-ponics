import React, { useEffect, useState } from 'react';
import { 
  Route, 
  Routes, 
} from 'react-router-dom';
import { auth } from './firebase';

// Pages
import Chat from './pages/Chat';
import Login from './pages/Login';
import Forum from './pages/Forum';
import DetailedView from './pages/ForumDetailed';
import Sensors from './pages/Sensors';
import NotFound from './pages/NotFound';
import DiseaseDetection from './pages/DiseaseDetection';

// Import routes and context
import PrivateRoutes from './routes/PrivateRoutes';
import Loading from './pages/components/Loading';
import Layout from './layout/Layout';
import LandingPage from './pages/LandingPage';

function Router() {
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
        path="/forum"
        element={
          <PrivateRoutes>
            <Layout>
              <Forum />
            </Layout>
          </PrivateRoutes>
        }
      />
      
      <Route
        path="/forum/:id"
        element={
          <PrivateRoutes>
            <Layout>
              <DetailedView />
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

      <Route
        path="/analyse"
        element={
          <PrivateRoutes>
            <Layout>
              <DiseaseDetection/>
            </Layout>
          </PrivateRoutes>
        }
      />
        
    </Routes>
  );
}

export default Router;