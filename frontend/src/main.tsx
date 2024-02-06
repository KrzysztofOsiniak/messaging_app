import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, redirect, RouterProvider } from "react-router-dom";
import Channels, {loader as channelLoader} from './Channels.jsx';
import Me from './Me.jsx';
import Login, { loader as loginLoader } from './Login.jsx';
import Signup, { loader as signupLoader } from './Signup.jsx';
import Direct, { loader as directLoader } from './Direct.jsx';
import Friends from './Friends.jsx';
import ErrorPage from './ErrorPage.jsx';
import './styles/index.scss'


const router = createBrowserRouter([
  {
    path: "/channels",
    element: <Channels />,
    loader: channelLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "me",
        element: <Me />,
        errorElement: <ErrorPage />,
        children: [
          {
            path: "",
            element: <Friends />,
            errorElement: <ErrorPage />,
          },
          {
            path: ":id",
            element: <Direct />,
            loader: async ({ params }) => directLoader(params.id),
            errorElement: <ErrorPage />,
          }
        ]
      },
      {
        path: "",
        element: <ErrorPage />,
        loader: function loader() {
          return redirect('/channels/me')
        },
        errorElement: <ErrorPage />
      },
      {
        path: "*",
        element: <ErrorPage />,
        loader: function loader() {
          return redirect('/channels/me')
        },
        errorElement: <ErrorPage />
      }
    ],
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
