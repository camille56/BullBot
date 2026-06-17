import { Routes, Route, Link } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Backtest } from './pages/Backtest';

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/backtest">Backtest</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/backtest" element={<Backtest />} />
      </Routes>
    </div>
  );
}

export default App;
