import Lending from '@/pages/Lending/index';
import Swap from '@/pages/Swap/index';
import CSui from '@/pages/CSui/index';
import Nft from '@/pages/Nft/index';
import Obj from '@/pages/ZeroObj/index';
import ErrorPage from '@/pages/ErrorPage';
import AppLayout from '@/layout/AppLayout';
import { lazy } from 'react';
import { MetaMenu, AuthRouteObject } from './interface';
import { Navigate, redirect } from 'react-router-dom';

// ********
const lazyLoad = (moduleName: string) =>
  lazy(() => import(`@/pages/${moduleName}/index.tsx`));

// const Home = lazyLoad('Home');
// ****：********
const checkAuth = async () => {
  // ******（**** LocalStorage * Cookies ** token）
  const isAuthenticated = localStorage.getItem('token') !== null;
  if (!isAuthenticated) {
    // ********，******
    return redirect('/');
  }
  return null;
};
const routers: AuthRouteObject<MetaMenu>[] = [
  // {
  //   path: '/',
  //   element: <Navigate to="/first" replace />,
  //   meta: {
  //     title: '',
  //   },
  // },
  {
    path: '/',
    element: <Navigate to="/swap" replace />,
    meta: {
      title: '',
    },
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    meta: {
      title: '',
    },
    children: [
      {
        path: 'cSui',
        element: <CSui />,
        meta: {
          title: 'cSui',
        },
      },
      {
        path: 'lending',
        element: <Lending />,
        meta: {
          title: 'Lending',
        },
      },
      {
        path: 'swap',
        element: <Swap />,
        meta: {
          title: 'Swap',
        },
      },
      {
        path: 'nft',
        element: <Nft />,
        meta: {
          title: 'nft',
        },
      },
      {
        path: 'obj',
        element: <Obj />,
        meta: {
          title: 'obj',
        },
      },
    ],
  },
  // {
  //   path: '*',
  //   element: <ErrorPage />,
  //   meta: {
  //     title: '',
  //   },
  // },
];

export default routers;
