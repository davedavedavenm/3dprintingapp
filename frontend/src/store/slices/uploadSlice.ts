/**
 * Upload State Management
 * 
 * Manages STL file upload state including:
 * - File upload progress and status
 * - Upload validation and error handling
 * - File metadata and preview information
 * - Upload queue for multiple files
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface FileMetadata {
  filename: string;
  size: number;
  type: string;
  lastModified: number;
  hash?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadItem {
  id: string;
  file: File;
  metadata: FileMetadata;
  progress: UploadProgress;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  serverResponse?: any;
}

export interface UploadState {
  items: UploadItem[];
  currentUpload?: string; // ID of currently uploading file
  dragActive: boolean;
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  maxConcurrentUploads: number;
  totalProgress: number;
  errors: string[];
  isUploading: boolean;
}

// Initial state
const initialState: UploadState = {
  items: [],
  currentUpload: undefined,
  dragActive: false,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['.stl', '.obj', '.ply'],
  maxConcurrentUploads: 3,
  totalProgress: 0,
  errors: [],
  isUploading: false,
};

// Async thunks
export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async (
    {
      file,
      onProgress,
      sessionId,
    }: {
      file: File;
      onProgress?: (progress: UploadProgress) => void;
      sessionId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      console.log("Preparing to upload file:", file.name, "Type:", file.type, "Size:", file.size);
      
      const formData = new FormData();
      // Add the file with both field names for compatibility
      formData.append('file', file);
      formData.append('stl_file', file);
      
      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      // Use absolute URL with proper port
      const response = await fetch('http://localhost:5000/api/v1/upload/stl', {
        method: 'POST',
        body: formData,
        // Enable CORS credentials
        credentials: 'include',
        // Set proper headers for cross-origin requests
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const validateFile = createAsyncThunk(
  'upload/validateFile',
  async (file: File, { rejectWithValue }) => {
    try {
      console.log("Validating file:", file.name, "Type:", file.type, "Size:", file.size);
      
      const formData = new FormData();
      // Add the file with both field names for compatibility
      formData.append('file', file);
      formData.append('stl_file', file);

      // Use absolute URL with proper port
      const response = await fetch('http://localhost:5000/api/v1/upload/validate', {
        method: 'POST',
        body: formData,
        // Enable CORS credentials
        credentials: 'include',
        // Set proper headers
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Validation failed');
      }

      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Slice definition
const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    // Add file to upload queue
    addFile: (state, action: PayloadAction<File>) => {
      const file = action.payload;
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const metadata: FileMetadata = {
        filename: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };

      const uploadItem: UploadItem = {
        id,
        file,
        metadata,
        progress: { loaded: 0, total: file.size, percentage: 0 },
        status: 'pending',
      };

      state.items.push(uploadItem);
    },

    // Remove file from upload queue
    removeFile: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.items = state.items.filter(item => item.id !== id);
      
      if (state.currentUpload === id) {
        state.currentUpload = undefined;
      }
    },

    // Update upload progress
    updateProgress: (
      state,
      action: PayloadAction<{ id: string; progress: UploadProgress }>
    ) => {
      const { id, progress } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        item.progress = progress;
        
        // Calculate total progress
        const totalBytes = state.items.reduce((sum, item) => sum + item.metadata.size, 0);
        const loadedBytes = state.items.reduce((sum, item) => sum + item.progress.loaded, 0);
        state.totalProgress = totalBytes > 0 ? (loadedBytes / totalBytes) * 100 : 0;
      }
    },

    // Set upload status
    setUploadStatus: (
      state,
      action: PayloadAction<{ id: string; status: UploadItem['status']; error?: string }>
    ) => {
      const { id, status, error } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        item.status = status;
        if (error) {
          item.error = error;
        }
      }

      // Update global uploading state
      state.isUploading = state.items.some(item => item.status === 'uploading');
    },

    // Set current upload
    setCurrentUpload: (state, action: PayloadAction<string | undefined>) => {
      state.currentUpload = action.payload;
    },

    // Set drag active state
    setDragActive: (state, action: PayloadAction<boolean>) => {
      state.dragActive = action.payload;
    },

    // Clear all uploads
    clearUploads: (state) => {
      state.items = [];
      state.currentUpload = undefined;
      state.totalProgress = 0;
      state.errors = [];
      state.isUploading = false;
    },

    // Clear completed uploads
    clearCompleted: (state) => {
      state.items = state.items.filter(
        item => item.status !== 'completed' && item.status !== 'failed'
      );
    },

    // Add error
    addError: (state, action: PayloadAction<string>) => {
      state.errors.push(action.payload);
    },

    // Clear errors
    clearErrors: (state) => {
      state.errors = [];
    },

    // Update configuration
    updateConfig: (
      state,
      action: PayloadAction<Partial<Pick<UploadState, 'maxFileSize' | 'allowedTypes' | 'maxConcurrentUploads'>>>
    ) => {
      Object.assign(state, action.payload);
    },

    // Reset upload state
    resetUpload: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Upload file async thunk
    builder
      .addCase(uploadFile.pending, (state, action) => {
        const file = action.meta.arg.file;
        const item = state.items.find(item => item.file === file);
        
        if (item) {
          item.status = 'uploading';
          state.currentUpload = item.id;
          state.isUploading = true;
        }
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        const file = action.meta.arg.file;
        const item = state.items.find(item => item.file === file);
        
        if (item) {
          item.status = 'completed';
          item.serverResponse = action.payload;
          item.progress = { ...item.progress, percentage: 100 };
        }

        // Clear current upload if this was it
        if (state.currentUpload === item?.id) {
          state.currentUpload = undefined;
        }

        state.isUploading = state.items.some(item => item.status === 'uploading');
      })
      .addCase(uploadFile.rejected, (state, action) => {
        const file = action.meta.arg.file;
        const item = state.items.find(item => item.file === file);
        
        if (item) {
          item.status = 'failed';
          item.error = action.payload as string;
        }

        // Clear current upload if this was it
        if (state.currentUpload === item?.id) {
          state.currentUpload = undefined;
        }

        state.isUploading = state.items.some(item => item.status === 'uploading');
        state.errors.push(action.payload as string);
      });

    // Validate file async thunk
    builder
      .addCase(validateFile.pending, (state, action) => {
        const file = action.meta.arg;
        const item = state.items.find(item => item.file === file);
        
        if (item) {
          item.status = 'pending';
        }
      })
      .addCase(validateFile.fulfilled, (state, action) => {
        // Validation successful - file can be uploaded
      })
      .addCase(validateFile.rejected, (state, action) => {
        const file = action.meta.arg;
        const item = state.items.find(item => item.file === file);
        
        if (item) {
          item.status = 'failed';
          item.error = action.payload as string;
        }

        state.errors.push(action.payload as string);
      });
  },
});

// Export actions
export const {
  addFile,
  removeFile,
  updateProgress,
  setUploadStatus,
  setCurrentUpload,
  setDragActive,
  clearUploads,
  clearCompleted,
  addError,
  clearErrors,
  updateConfig,
  resetUpload,
} = uploadSlice.actions;

// Selectors
export const selectAllUploads = (state: { upload: UploadState }) => state.upload.items;
export const selectCurrentUpload = (state: { upload: UploadState }) => 
  state.upload.items.find(item => item.id === state.upload.currentUpload);
export const selectCompletedUploads = (state: { upload: UploadState }) => 
  state.upload.items.filter(item => item.status === 'completed');
export const selectFailedUploads = (state: { upload: UploadState }) => 
  state.upload.items.filter(item => item.status === 'failed');
export const selectUploadProgress = (state: { upload: UploadState }) => state.upload.totalProgress;
export const selectIsUploading = (state: { upload: UploadState }) => state.upload.isUploading;
export const selectDragActive = (state: { upload: UploadState }) => state.upload.dragActive;
export const selectUploadErrors = (state: { upload: UploadState }) => state.upload.errors;

export default uploadSlice.reducer;
