import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Channels, {loader as channelLoader} from './Channels.jsx';
import Me, { loader as meLoader} from './Me.jsx'
import Login, { loader as loginLoader } from './Login.jsx'
import Signup, { loader as signupLoader } from './Signup.jsx';
import ErrorPage from './ErrorPage.jsx';
import './styles/index.scss'


const router = createBrowserRouter([
  /*
  {
    path: "/channels",
    element: <Channels />,
    loader: chatLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/channels/me",
        element: <Me />,
        errorElement: <ErrorPage />,
        loader: meLoader,
        children: [
          {
            path: "/",
            element: <Friends />,
            errorElement: <ErrorPage />,
            loader: friendsLoader,
          },
          {
            path: "/:directId",
            element: <Direct />,
            errorElement: <ErrorPage />,
            loader: messagesLoader,
          },
      },
      {
        path: "/:serverId",
        element: <Server />,
        errorElement: <ErrorPage />,
        loader: serverLoader,
        children: [
          {
            path: "/:chatId",
            element: <Chat />,
            errorElement: <ErrorPage />,
            loader: chatLoader,
          },
        ],
      },
    ],
  },
  */
  {
    path: "/channels",
    element: <Channels />,
    loader: channelLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/channels/me",
        element: <Me />,
        errorElement: <ErrorPage />,
        loader: meLoader,
      }],
  },
  {
    path: "/login",
    element: <Login />,
    loader: loginLoader,
  },
  {
    path: "/signup",
    element: <Signup />,
    loader: signupLoader,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
