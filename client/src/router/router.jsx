import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicOnlyRoute } from './PublicOnlyRoute.jsx';
import { ProtectedLayout } from './ProtectedLayout.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { PostsPage } from '../pages/PostsPage.jsx';
import { TodosPage } from '../pages/TodosPage.jsx';
import { readSessionUser } from '../utils/session.js';

function HomeRedirect() {
  const user = readSessionUser();
  return <Navigate to={user ? `/users/${user.username}/posts` : '/login'} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRedirect />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/users/:username',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="posts" replace />,
      },
      {
        path: 'posts',
        element: <PostsPage />,
      },
      {
        path: 'todos',
        element: <TodosPage />,
      },
    ],
  },
  {
    path: '*',
    element: <HomeRedirect />,
  },
]);
