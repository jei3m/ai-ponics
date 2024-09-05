
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Sensors from './components/Sensors';
import './App.css';
import Chat from './components/Chat';
import AiwithImage from './components/AiwithImage';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
      <Route index element={<Sensors/>}/>
      <Route path="/sensors" element={<Sensors/>}/>
      <Route path="/chat" element={<AiwithImage/>}/>
      <Route path="/una" element={<Chat/>}/>
      </Routes>
      </BrowserRouter>
      
    </div>
  );
}

export default App;
