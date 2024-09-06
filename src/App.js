import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import Sensors from './pages/Sensors';
import Chat from './pages/AiwithImage';
import Login from './pages/Login';
import PrivateRoutes from './routes/PrivateRoutes'

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
						<Sensors />
					</PrivateRoutes>
				}
			/>
		</Routes>
  );
}

export default App;