/**
 * App Component
 * 
 * Main application component that sets up:
 * - Redux Provider for state management
 * - Theme provider for Material-UI
 * - Router for navigation
 * - Error boundaries for graceful error handling
 * - Global layout and components
 */

import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';

import { store, persistor } from './store';
import { theme } from './theme/theme';
import ErrorBoundary from './components/Error/ErrorBoundary';
import LoadingScreen from './components/UI/LoadingScreen';
import Layout from './components/Layout/Layout';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));
const QuotePage = React.lazy(() => import('./pages/QuotePage'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const OrderPage = React.lazy(() => import('./pages/OrderPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <Layout>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      {/* Home route */}
                      <Route path="/" element={<HomePage />} />
                      
                      {/* Upload workflow */}
                      <Route path="/upload" element={<UploadPage />} />
                      
                      {/* Quote configuration */}
                      <Route path="/quote" element={<QuotePage />} />
                      
                      {/* Payment processing */}
                      <Route path="/payment/:quoteId?" element={<PaymentPage />} />
                      
                      {/* Order tracking */}
                      <Route path="/order/:orderId" element={<OrderPage />} />
                      
                      {/* Legacy redirects */}
                      <Route path="/home" element={<Navigate to="/" replace />} />
                      
                      {/* 404 handler */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </Router>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
