import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Channels, {loader as channelLoader} from './Channels.jsx';
import Me from './Me.jsx'
import Login, { loader as loginLoader } from './Login.jsx'
import Signup, { loader as signupLoader } from './Signup.jsx';
import Friends from './Friends.jsx';
import ErrorPage from './ErrorPage.jsx';
import './styles/index.scss'


const router = createBrowserRouter([
  {
    path: "/channels/me",
    element: <Channels />,
    loader: channelLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <Me />,
        errorElement: <ErrorPage />,
        children: [
          {
            path: "",
            element: <Friends />,
            errorElement: <ErrorPage />,
          }
        ]
      }],
  },
  {
    path: "/login",
    element: <Login />,
    loader: loginLoader,
    errorElement: <ErrorPage />
  },
  {
    path: "/signup",
    element: <Signup />,
    loader: signupLoader,
    errorElement: <ErrorPage />
  },
  {
    path: "*",
    element: <ErrorPage />,
    loader: function loader() {
      throw new Response("", {
          status: 404,
          statusText: "Not Found",
        });
    },
    errorElement: <ErrorPage />
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
