import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Chat, { loader as chatLoader } from './Chat.jsx'
import Login, { loader as loginLoader } from './Login.jsx'
import Signup, { loader as signupLoader } from './Signup.jsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <Chat />,
    loader: chatLoader,
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
