/**
 * Redux Store Configuration
 * 
 * Configures the application store with:
 * - Redux Toolkit for state management
 * - Redux Persist for state persistence
 * - Development middleware for debugging
 * - Type-safe hooks for React components
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Import slice reducers
import uploadReducer from './slices/uploadSlice';
import quoteReducer from './slices/quoteSlice';
import paymentReducer from './slices/paymentSlice';
import uiReducer from './slices/uiSlice';

// Root reducer combining all slices
const rootReducer = combineReducers({
  upload: uploadReducer,
  quote: quoteReducer,
  payment: paymentReducer,
  ui: uiReducer,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  version: 1,
  // Only persist specific slices
  whitelist: ['quote', 'ui'],
  // Blacklist sensitive data
  blacklist: ['upload', 'payment'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/FLUSH',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PERSIST',
          'persist/PURGE',
          'persist/REGISTER',
        ],
        // Ignore file objects in state
        ignoredActionPaths: ['payload.file', 'payload.files'],
        ignoredPaths: ['upload.file', 'upload.files'],
      },
      // Enable additional checks in development
      immutableCheck: {
        ignoredPaths: ['upload.file', 'upload.files'],
      },
    }).concat(
      // Add additional middleware in development
      process.env.NODE_ENV === 'development' ? [] : []
    ),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Type definitions for store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Action creators type
export type AppThunk<ReturnType = void> = (
  dispatch: AppDispatch,
  getState: () => RootState
) => ReturnType;

// Store cleanup utility
export const clearPersistedState = () => {
  return persistor.purge();
};

// Reset store to initial state
export const resetStore = () => {
  return store.dispatch({ type: 'RESET_STORE' });
};

export default store;
