import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import store from './Store/index.js'

import { BrowserRouter } from 'react-router-dom'

import { setupAxiosInterceptors } from './utils/axiosSetup.js'

setupAxiosInterceptors(store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)
