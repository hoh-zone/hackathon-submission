import './App.scss';
import routers from './routes/routerConfig';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

function App() {
  const router = createBrowserRouter(routers);
  return <RouterProvider router={router} />;
}

export default App;
