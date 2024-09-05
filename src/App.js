
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Sensors from './Pages/Sensors';
import './App.css';
import AiwithImage from './Pages/AiwithImage';


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
