/**
 * UI State Management
 * 
 * Manages global UI state including:
 * - Theme and appearance settings
 * - Navigation state and active routes
 * - Modal and overlay management
 * - Loading states and notifications
 * - Mobile responsiveness controls
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  timestamp: string;
}

export interface ModalState {
  isOpen: boolean;
  type?: 'confirmation' | 'alert' | 'form' | 'custom';
  title?: string;
  content?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  persistent?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  customComponent?: string;
  data?: any;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  cancellable?: boolean;
  onCancel?: () => void;
}

export interface UIState {
  // Theme and appearance
  themeMode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  compactMode: boolean;
  
  // Navigation and layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  breadcrumbs: Array<{ label: string; path: string }>;
  pageTitle: string;
  
  // Responsive design
  isMobile: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  
  // Loading states
  globalLoading: LoadingState;
  pageLoading: boolean;
  componentLoading: Record<string, boolean>;
  
  // Modals and overlays
  modal: ModalState;
  drawer: {
    isOpen: boolean;
    anchor: 'left' | 'right' | 'top' | 'bottom';
    content?: string;
    persistent?: boolean;
  };
  
  // Notifications
  notifications: NotificationItem[];
  maxNotifications: number;
  
  // Form states
  formStates: Record<string, {
    dirty: boolean;
    valid: boolean;
    submitting: boolean;
    errors: Record<string, string>;
  }>;
  
  // Feature flags
  featureFlags: Record<string, boolean>;
  
  // User preferences
  preferences: {
    animationsEnabled: boolean;
    soundEnabled: boolean;
    autoSave: boolean;
    compactTables: boolean;
    showHelpTooltips: boolean;
    language: string;
    timezone: string;
  };
  
  // Error boundaries
  errorBoundaries: Record<string, {
    hasError: boolean;
    error?: Error;
    errorInfo?: any;
  }>;
  
  // Tour and onboarding
  tour: {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    completed: string[];
  };
  
  // Search and filters
  searchTerms: Record<string, string>;
  activeFilters: Record<string, any>;
  
  // Misc UI state
  lastActivity: string;
  sessionTimeout: number;
  debugMode: boolean;
}

// Initial state
const initialState: UIState = {
  // Theme and appearance
  themeMode: 'light',
  primaryColor: '#1976d2',
  compactMode: false,
  
  // Navigation and layout
  sidebarOpen: false,
  sidebarCollapsed: false,
  breadcrumbs: [],
  pageTitle: '3D Print Quoting',
  
  // Responsive design
  isMobile: false,
  isTablet: false,
  screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
  screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
  
  // Loading states
  globalLoading: { isLoading: false },
  pageLoading: false,
  componentLoading: {},
  
  // Modals and overlays
  modal: { isOpen: false },
  drawer: { isOpen: false, anchor: 'left' },
  
  // Notifications
  notifications: [],
  maxNotifications: 5,
  
  // Form states
  formStates: {},
  
  // Feature flags
  featureFlags: {
    enableAdvancedPricing: true,
    enableRushOrders: true,
    enableMultiMaterial: false,
    enableBatchProcessing: false,
    enableEmailNotifications: true,
    enablePushNotifications: false,
  },
  
  // User preferences
  preferences: {
    animationsEnabled: true,
    soundEnabled: false,
    autoSave: true,
    compactTables: false,
    showHelpTooltips: true,
    language: 'en',
    timezone: 'UTC',
  },
  
  // Error boundaries
  errorBoundaries: {},
  
  // Tour and onboarding
  tour: {
    isActive: false,
    currentStep: 0,
    totalSteps: 0,
    completed: [],
  },
  
  // Search and filters
  searchTerms: {},
  activeFilters: {},
  
  // Misc UI state
  lastActivity: new Date().toISOString(),
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  debugMode: process.env.NODE_ENV === 'development',
};

// Slice definition
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme and appearance
    setThemeMode: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.themeMode = action.payload;
    },
    
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
    },
    
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
    },
    
    // Navigation and layout
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    
    // Responsive design
    setScreenDimensions: (state, action: PayloadAction<{ width: number; height: number }>) => {
      const { width, height } = action.payload;
      state.screenWidth = width;
      state.screenHeight = height;
      state.isMobile = width < 768;
      state.isTablet = width >= 768 && width < 1024;
    },
    
    // Loading states
    setGlobalLoading: (state, action: PayloadAction<LoadingState>) => {
      state.globalLoading = action.payload;
    },
    
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.pageLoading = action.payload;
    },
    
    setComponentLoading: (state, action: PayloadAction<{ component: string; loading: boolean }>) => {
      const { component, loading } = action.payload;
      if (loading) {
        state.componentLoading[component] = true;
      } else {
        delete state.componentLoading[component];
      }
    },
    
    // Modals and overlays
    openModal: (state, action: PayloadAction<Omit<ModalState, 'isOpen'>>) => {
      state.modal = { ...action.payload, isOpen: true };
    },
    
    closeModal: (state) => {
      state.modal = { isOpen: false };
    },
    
    openDrawer: (state, action: PayloadAction<{
      anchor?: 'left' | 'right' | 'top' | 'bottom';
      content?: string;
      persistent?: boolean;
    }>) => {
      state.drawer = { ...action.payload, isOpen: true, anchor: action.payload.anchor || 'left' };
    },
    
    closeDrawer: (state) => {
      state.drawer = { ...state.drawer, isOpen: false };
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'timestamp'>>) => {
      const notification: NotificationItem = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };
      
      state.notifications.unshift(notification);
      
      // Remove oldest notifications if exceeding max
      if (state.notifications.length > state.maxNotifications) {
        state.notifications = state.notifications.slice(0, state.maxNotifications);
      }
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Form states
    setFormState: (state, action: PayloadAction<{
      formId: string;
      formState: Partial<UIState['formStates'][string]>;
    }>) => {
      const { formId, formState } = action.payload;
      state.formStates[formId] = { ...state.formStates[formId], ...formState };
    },
    
    clearFormState: (state, action: PayloadAction<string>) => {
      delete state.formStates[action.payload];
    },
    
    // Feature flags
    setFeatureFlag: (state, action: PayloadAction<{ flag: string; enabled: boolean }>) => {
      const { flag, enabled } = action.payload;
      state.featureFlags[flag] = enabled;
    },
    
    // User preferences
    updatePreferences: (state, action: PayloadAction<Partial<UIState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    // Error boundaries
    setErrorBoundary: (state, action: PayloadAction<{
      boundaryId: string;
      hasError: boolean;
      error?: Error;
      errorInfo?: any;
    }>) => {
      const { boundaryId, hasError, error, errorInfo } = action.payload;
      state.errorBoundaries[boundaryId] = { hasError, error, errorInfo };
    },
    
    clearErrorBoundary: (state, action: PayloadAction<string>) => {
      delete state.errorBoundaries[action.payload];
    },
    
    // Tour and onboarding
    startTour: (state, action: PayloadAction<{ totalSteps: number }>) => {
      state.tour = {
        isActive: true,
        currentStep: 0,
        totalSteps: action.payload.totalSteps,
        completed: state.tour.completed,
      };
    },
    
    nextTourStep: (state) => {
      if (state.tour.currentStep < state.tour.totalSteps - 1) {
        state.tour.currentStep += 1;
      }
    },
    
    prevTourStep: (state) => {
      if (state.tour.currentStep > 0) {
        state.tour.currentStep -= 1;
      }
    },
    
    completeTour: (state, action: PayloadAction<string>) => {
      state.tour.isActive = false;
      if (!state.tour.completed.includes(action.payload)) {
        state.tour.completed.push(action.payload);
      }
    },
    
    // Search and filters
    setSearchTerm: (state, action: PayloadAction<{ key: string; term: string }>) => {
      const { key, term } = action.payload;
      state.searchTerms[key] = term;
    },
    
    clearSearchTerm: (state, action: PayloadAction<string>) => {
      delete state.searchTerms[action.payload];
    },
    
    setActiveFilters: (state, action: PayloadAction<{ key: string; filters: any }>) => {
      const { key, filters } = action.payload;
      state.activeFilters[key] = filters;
    },
    
    clearActiveFilters: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    
    // Misc UI state
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },
    
    setSessionTimeout: (state, action: PayloadAction<number>) => {
      state.sessionTimeout = action.payload;
    },
    
    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode;
    },
    
    // Reset UI state
    resetUI: (state) => {
      Object.assign(state, {
        ...initialState,
        preferences: state.preferences, // Keep preferences
        featureFlags: state.featureFlags, // Keep feature flags
        themeMode: state.themeMode, // Keep theme
        primaryColor: state.primaryColor, // Keep primary color
      });
    },
  },
});

// Export actions
export const {
  setThemeMode,
  setPrimaryColor,
  toggleCompactMode,
  setSidebarOpen,
  toggleSidebar,
  setSidebarCollapsed,
  setBreadcrumbs,
  setPageTitle,
  setScreenDimensions,
  setGlobalLoading,
  setPageLoading,
  setComponentLoading,
  openModal,
  closeModal,
  openDrawer,
  closeDrawer,
  addNotification,
  removeNotification,
  clearNotifications,
  setFormState,
  clearFormState,
  setFeatureFlag,
  updatePreferences,
  setErrorBoundary,
  clearErrorBoundary,
  startTour,
  nextTourStep,
  prevTourStep,
  completeTour,
  setSearchTerm,
  clearSearchTerm,
  setActiveFilters,
  clearActiveFilters,
  updateLastActivity,
  setSessionTimeout,
  toggleDebugMode,
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectThemeMode = (state: { ui: UIState }) => state.ui.themeMode;
export const selectPrimaryColor = (state: { ui: UIState }) => state.ui.primaryColor;
export const selectCompactMode = (state: { ui: UIState }) => state.ui.compactMode;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectIsMobile = (state: { ui: UIState }) => state.ui.isMobile;
export const selectIsTablet = (state: { ui: UIState }) => state.ui.isTablet;
export const selectScreenDimensions = (state: { ui: UIState }) => ({
  width: state.ui.screenWidth,
  height: state.ui.screenHeight,
});
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectPageLoading = (state: { ui: UIState }) => state.ui.pageLoading;
export const selectComponentLoading = (component: string) => (state: { ui: UIState }) => 
  state.ui.componentLoading[component] || false;
export const selectModal = (state: { ui: UIState }) => state.ui.modal;
export const selectDrawer = (state: { ui: UIState }) => state.ui.drawer;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectFormState = (formId: string) => (state: { ui: UIState }) => 
  state.ui.formStates[formId];
export const selectFeatureFlag = (flag: string) => (state: { ui: UIState }) => 
  state.ui.featureFlags[flag] || false;
export const selectPreferences = (state: { ui: UIState }) => state.ui.preferences;
export const selectErrorBoundaries = (state: { ui: UIState }) => state.ui.errorBoundaries;
export const selectTour = (state: { ui: UIState }) => state.ui.tour;
export const selectDebugMode = (state: { ui: UIState }) => state.ui.debugMode;

// Complex selectors
export const selectIsDesktop = (state: { ui: UIState }) => 
  !state.ui.isMobile && !state.ui.isTablet;

export const selectCanUseSidebar = (state: { ui: UIState }) => 
  !state.ui.isMobile;

export const selectHasUnreadNotifications = (state: { ui: UIState }) => 
  state.ui.notifications.length > 0;

export const selectActiveModalType = (state: { ui: UIState }) => 
  state.ui.modal.isOpen ? state.ui.modal.type : null;

export const selectIsSessionNearExpiry = (state: { ui: UIState }) => {
  const lastActivity = new Date(state.ui.lastActivity);
  const now = new Date();
  const timeSinceActivity = now.getTime() - lastActivity.getTime();
  const warningThreshold = state.ui.sessionTimeout * 0.8; // Warn at 80% of timeout
  return timeSinceActivity > warningThreshold;
};

export default uiSlice.reducer;
