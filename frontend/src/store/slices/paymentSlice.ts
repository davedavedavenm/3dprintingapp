/**
 * Payment State Management
 * 
 * Manages payment processing state including:
 * - PayPal order creation and capture
 * - Payment status tracking
 * - Order confirmation and receipt
 * - Error handling for payment failures
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface PaymentRequest {
  quoteId: string;
  customerEmail: string;
  customerInfo?: {
    name?: string;
    phone?: string;
  };
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
  };
}

export interface PayPalOrder {
  orderId: string;
  quoteId: string;
  totalAmount: string;
  currency: string;
  approveUrl: string;
  expiresAt: string;
  orderStatus: string;
  paymentInstructions: {
    nextStep: string;
    approveUrl: string;
    cancelUrl: string;
    returnUrl: string;
  };
  orderSummary: {
    quoteId: string;
    description: string;
    customerEmail: string;
    amount: string;
  };
}

export interface PaymentCapture {
  transactionId: string;
  orderId: string;
  paymentStatus: string;
  amountCaptured: string;
  capturedAt: string;
  orderSummary: {
    quoteId: string;
    customerEmail: string;
    description: string;
    totalAmount: string;
    paymentMethod: string;
  };
  fulfillmentInfo: {
    status: string;
    productionStarted?: string;
    estimatedCompletion?: string;
    orderNumber?: string;
  };
  nextSteps: {
    confirmationEmail: string;
    trackingInfo: string;
    downloadReceipt: string;
  };
}

export interface OrderStatus {
  orderId: string;
  orderStatus: string;
  paymentInfo: {
    amount: string;
    currency: string;
    paymentMethod: string;
    transactionId?: string;
    capturedAt?: string;
  };
  quoteInfo: {
    quoteId: string;
    customerEmail: string;
    createdAt: string;
  };
  fulfillmentStatus: {
    status: string;
    progress?: number;
    startedAt?: string;
    estimatedCompletion?: string;
    trackingNotes?: string[];
  };
  timestamps: {
    orderCreated: string;
    paymentCaptured?: string;
    productionStarted?: string;
    estimatedCompletion?: string;
  };
}

export interface PaymentState {
  currentOrder?: PayPalOrder;
  paymentCapture?: PaymentCapture;
  orderStatus?: OrderStatus;
  processingPayment: boolean;
  creatingOrder: boolean;
  capturingPayment: boolean;
  fetchingOrderStatus: boolean;
  errors: string[];
  paymentMethod: 'paypal' | 'credit_card';
  customerInfo?: {
    email: string;
    name?: string;
    phone?: string;
  };
  shippingAddress?: PaymentRequest['shippingAddress'];
  agreedToTerms: boolean;
  newsletter: boolean;
}

// Initial state
const initialState: PaymentState = {
  currentOrder: undefined,
  paymentCapture: undefined,
  orderStatus: undefined,
  processingPayment: false,
  creatingOrder: false,
  capturingPayment: false,
  fetchingOrderStatus: false,
  errors: [],
  paymentMethod: 'paypal',
  customerInfo: undefined,
  shippingAddress: undefined,
  agreedToTerms: false,
  newsletter: false,
};

// Async thunks
export const createPayPalOrder = createAsyncThunk(
  'payment/createPayPalOrder',
  async (request: PaymentRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Order creation failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const capturePayPalPayment = createAsyncThunk(
  'payment/capturePayPalPayment',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/payment/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Payment capture failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchOrderStatus = createAsyncThunk(
  'payment/fetchOrderStatus',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/payment/order/${orderId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch order status');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const downloadReceipt = createAsyncThunk(
  'payment/downloadReceipt',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v1/payment/receipt/${transactionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate receipt');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Slice definition
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Set payment method
    setPaymentMethod: (state, action: PayloadAction<'paypal' | 'credit_card'>) => {
      state.paymentMethod = action.payload;
    },

    // Set customer information
    setCustomerInfo: (
      state,
      action: PayloadAction<{
        email: string;
        name?: string;
        phone?: string;
      }>
    ) => {
      state.customerInfo = action.payload;
    },

    // Update customer email
    setCustomerEmail: (state, action: PayloadAction<string>) => {
      if (!state.customerInfo) {
        state.customerInfo = { email: action.payload };
      } else {
        state.customerInfo.email = action.payload;
      }
    },

    // Update customer name
    setCustomerName: (state, action: PayloadAction<string>) => {
      if (!state.customerInfo) {
        state.customerInfo = { email: '', name: action.payload };
      } else {
        state.customerInfo.name = action.payload;
      }
    },

    // Update customer phone
    setCustomerPhone: (state, action: PayloadAction<string>) => {
      if (!state.customerInfo) {
        state.customerInfo = { email: '', phone: action.payload };
      } else {
        state.customerInfo.phone = action.payload;
      }
    },

    // Set shipping address
    setShippingAddress: (
      state,
      action: PayloadAction<PaymentRequest['shippingAddress']>
    ) => {
      state.shippingAddress = action.payload;
    },

    // Set agreed to terms
    setAgreedToTerms: (state, action: PayloadAction<boolean>) => {
      state.agreedToTerms = action.payload;
    },

    // Set newsletter subscription
    setNewsletter: (state, action: PayloadAction<boolean>) => {
      state.newsletter = action.payload;
    },

    // Clear current order
    clearCurrentOrder: (state) => {
      state.currentOrder = undefined;
      state.paymentCapture = undefined;
    },

    // Clear order status
    clearOrderStatus: (state) => {
      state.orderStatus = undefined;
    },

    // Set processing payment
    setProcessingPayment: (state, action: PayloadAction<boolean>) => {
      state.processingPayment = action.payload;
    },

    // Add error
    addError: (state, action: PayloadAction<string>) => {
      state.errors.push(action.payload);
    },

    // Clear errors
    clearErrors: (state) => {
      state.errors = [];
    },

    // Reset payment state
    resetPayment: (state) => {
      Object.assign(state, initialState);
    },

    // Reset to order creation state (after failed payment)
    resetToOrderCreation: (state) => {
      state.paymentCapture = undefined;
      state.processingPayment = false;
      state.capturingPayment = false;
      state.errors = [];
    },
  },
  extraReducers: (builder) => {
    // Create PayPal order async thunk
    builder
      .addCase(createPayPalOrder.pending, (state) => {
        state.creatingOrder = true;
        state.errors = [];
      })
      .addCase(createPayPalOrder.fulfilled, (state, action) => {
        state.creatingOrder = false;
        state.currentOrder = action.payload;
      })
      .addCase(createPayPalOrder.rejected, (state, action) => {
        state.creatingOrder = false;
        state.errors.push(action.payload as string);
      });

    // Capture PayPal payment async thunk
    builder
      .addCase(capturePayPalPayment.pending, (state) => {
        state.capturingPayment = true;
        state.processingPayment = true;
        state.errors = [];
      })
      .addCase(capturePayPalPayment.fulfilled, (state, action) => {
        state.capturingPayment = false;
        state.processingPayment = false;
        state.paymentCapture = action.payload;
      })
      .addCase(capturePayPalPayment.rejected, (state, action) => {
        state.capturingPayment = false;
        state.processingPayment = false;
        state.errors.push(action.payload as string);
      });

    // Fetch order status async thunk
    builder
      .addCase(fetchOrderStatus.pending, (state) => {
        state.fetchingOrderStatus = true;
        state.errors = [];
      })
      .addCase(fetchOrderStatus.fulfilled, (state, action) => {
        state.fetchingOrderStatus = false;
        state.orderStatus = action.payload;
      })
      .addCase(fetchOrderStatus.rejected, (state, action) => {
        state.fetchingOrderStatus = false;
        state.errors.push(action.payload as string);
      });

    // Download receipt async thunk
    builder
      .addCase(downloadReceipt.pending, (state) => {
        state.errors = [];
      })
      .addCase(downloadReceipt.fulfilled, (state, action) => {
        // Receipt downloaded successfully
        // You might want to trigger a download here
      })
      .addCase(downloadReceipt.rejected, (state, action) => {
        state.errors.push(action.payload as string);
      });
  },
});

// Export actions
export const {
  setPaymentMethod,
  setCustomerInfo,
  setCustomerEmail,
  setCustomerName,
  setCustomerPhone,
  setShippingAddress,
  setAgreedToTerms,
  setNewsletter,
  clearCurrentOrder,
  clearOrderStatus,
  setProcessingPayment,
  addError,
  clearErrors,
  resetPayment,
  resetToOrderCreation,
} = paymentSlice.actions;

// Selectors
export const selectCurrentOrder = (state: { payment: PaymentState }) => state.payment.currentOrder;
export const selectPaymentCapture = (state: { payment: PaymentState }) => state.payment.paymentCapture;
export const selectOrderStatus = (state: { payment: PaymentState }) => state.payment.orderStatus;
export const selectIsCreatingOrder = (state: { payment: PaymentState }) => state.payment.creatingOrder;
export const selectIsCapturingPayment = (state: { payment: PaymentState }) => state.payment.capturingPayment;
export const selectIsProcessingPayment = (state: { payment: PaymentState }) => state.payment.processingPayment;
export const selectIsFetchingOrderStatus = (state: { payment: PaymentState }) => state.payment.fetchingOrderStatus;
export const selectPaymentMethod = (state: { payment: PaymentState }) => state.payment.paymentMethod;
export const selectCustomerInfo = (state: { payment: PaymentState }) => state.payment.customerInfo;
export const selectShippingAddress = (state: { payment: PaymentState }) => state.payment.shippingAddress;
export const selectAgreedToTerms = (state: { payment: PaymentState }) => state.payment.agreedToTerms;
export const selectNewsletter = (state: { payment: PaymentState }) => state.payment.newsletter;
export const selectPaymentErrors = (state: { payment: PaymentState }) => state.payment.errors;

// Complex selectors
export const selectCanCreateOrder = (state: { payment: PaymentState }) => {
  const { customerInfo, agreedToTerms } = state.payment;
  return !!(
    customerInfo?.email &&
    customerInfo.email.includes('@') &&
    agreedToTerms
  );
};

export const selectOrderTotal = (state: { payment: PaymentState }) => {
  return state.payment.currentOrder?.totalAmount;
};

export const selectIsOrderExpired = (state: { payment: PaymentState }) => {
  const order = state.payment.currentOrder;
  if (!order) return false;
  
  const expiryDate = new Date(order.expiresAt);
  const now = new Date();
  return now > expiryDate;
};

export const selectPaymentProgress = (state: { payment: PaymentState }) => {
  const { creatingOrder, capturingPayment, currentOrder, paymentCapture } = state.payment;
  
  if (paymentCapture) return 100; // Payment completed
  if (capturingPayment) return 75; // Capturing payment
  if (currentOrder) return 50; // Order created, awaiting payment
  if (creatingOrder) return 25; // Creating order
  return 0; // Not started
};

export default paymentSlice.reducer;
