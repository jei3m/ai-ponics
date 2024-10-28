import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import Sensors from './pages/Sensors';
import Chat from './pages/AiwithImage';
import Login from './pages/Login';
import PrivateRoutes from './routes/PrivateRoutes'
import AiwithImage2 from './pages/AiwithImage2';
import Forum from './pages/Forum';
import DetailedView from './pages/ForumDetailed';
import { ApiKeyProvider } from './context/ApiKeyContext';
import Sensors2 from './pages/Sensors2';


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
    return <div>Loading...</div>;
  }

  return (
    <ApiKeyProvider>
		<Routes>
      
			<Route path='/' element={<Login />} />
			<Route
				path='/chat'
				element={
					<PrivateRoutes>
						<Chat />
					</PrivateRoutes>
				}
			/>
      <Route
				path='/home'
				element={
					<PrivateRoutes>
						<Sensors2 />
					</PrivateRoutes>
				}
			/>
			<Route
          path='/forum'
          element={
            <PrivateRoutes>
              <Forum />
            </PrivateRoutes>
          }
        />
        <Route
          path='/forum/:id'
          element={
            <PrivateRoutes>
              <DetailedView />
            </PrivateRoutes>
          }
        />

        {/* <Route
          path='/home2'
          element={
            <PrivateRoutes>
              <Sensors2 />
            </PrivateRoutes>
          }
        /> */}

		<Route path='/chat2' element={<AiwithImage2 />}	/>
		</Routes>
    </ApiKeyProvider>
  );
}

export default App;