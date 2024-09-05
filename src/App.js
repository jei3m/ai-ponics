
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Sensors from './pages/Sensors';
import './App.css';
import AiwithImage from './pages/AiwithImage';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
      <Route index element={<Sensors/>}/>
      <Route path="/sensors" element={<Sensors/>}/>
      <Route path="/chat" element={<AiwithImage/>}/>
      </Routes>
      </BrowserRouter>
      
    </div>
  );
}

export default App;
