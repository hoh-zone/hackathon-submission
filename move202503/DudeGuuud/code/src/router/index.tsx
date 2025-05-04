import { createBrowserRouter } from 'react-router-dom';
import { PageTransition } from '../components/animations';
import Home from '../pages/Home';
import Story from '../pages/Story';
import Create from '../pages/Create';
import Profile from '../pages/Profile';
import LatestStory from '../pages/Story/Latest';

const withTransition = (Component: React.ComponentType) => {
  return (
    <PageTransition>
      <Component />
    </PageTransition>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: withTransition(Home),
  },
  {
    path: '/story/:id',
    element: withTransition(Story),
  },
  {
    path: '/create',
    element: withTransition(Create),
  },
  {
    path: '/profile',
    element: withTransition(Profile),
  },
  {
    path: '/story/latest',
    element: withTransition(LatestStory),
  },
]);