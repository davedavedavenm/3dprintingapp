/**
 * Redux Store Hooks
 * 
 * Typed hooks for Redux store integration
 * Provides type safety for dispatch and selector functions
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Typed hooks for the store
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export types for convenience
export type { RootState, AppDispatch };
