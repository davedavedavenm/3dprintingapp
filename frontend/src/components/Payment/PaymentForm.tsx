/**
 * Payment Form Component
 * 
 * Collects customer information required for payment processing.
 * Includes email validation, terms agreement, and optional shipping details.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Grid,
  Alert,
  Collapse,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  setCustomerEmail,
  setCustomerName,
  setCustomerPhone,
  setAgreedToTerms,
  setNewsletter,
  setShippingAddress,
  selectCustomerInfo,
  selectAgreedToTerms,
  selectNewsletter,
  selectShippingAddress,
} from '../../store/slices/paymentSlice';

// Form validation schema
const paymentFormSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  phone: yup
    .string()
    .matches(
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please enter a valid phone number'
    )
    .optional(),
  agreedToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions'),
  newsletter: yup.boolean().optional(),
  
  // Optional shipping address fields
  needsShipping: yup.boolean().optional(),
  shippingAddress: yup.mixed().when('needsShipping', {
    is: true,
    then: () => yup.object({
      line1: yup.string().required('Street address is required'),
      city: yup.string().required('City is required'),
      state: yup.string().required('State/Province is required'),
      postalCode: yup.string().required('Postal code is required'),
      countryCode: yup.string().required('Country is required'),
    }),
    otherwise: () => yup.mixed().optional(),
  }),
});

export interface PaymentFormData {
  email: string;
  name?: string;
  phone?: string;
  agreedToTerms: boolean;
  newsletter: boolean;
  needsShipping: boolean;
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
  };
}

export interface PaymentFormProps {
  /** Called when form data changes */
  onChange?: (isValid: boolean, data: PaymentFormData) => void;
  /** Show shipping address fields */
  showShipping?: boolean;
  /** Pre-populated data */
  initialData?: Partial<PaymentFormData>;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onChange,
  showShipping = false,
  initialData,
}) => {
  const dispatch = useAppDispatch();
  const customerInfo = useAppSelector(selectCustomerInfo);
  const agreedToTerms = useAppSelector(selectAgreedToTerms);
  const newsletter = useAppSelector(selectNewsletter);
  const shippingAddress = useAppSelector(selectShippingAddress);

  // Initialize form with data from Redux store or props
  const defaultValues: PaymentFormData = {
    email: customerInfo?.email || initialData?.email || '',
    name: customerInfo?.name || initialData?.name || '',
    phone: customerInfo?.phone || initialData?.phone || '',
    agreedToTerms: agreedToTerms || initialData?.agreedToTerms || false,
    newsletter: newsletter || initialData?.newsletter || false,
    needsShipping: !!shippingAddress || initialData?.needsShipping || false,
    shippingAddress: shippingAddress || initialData?.shippingAddress,
  };

  const {
    control,
    watch,
    formState: { errors, isValid },
    getValues,
  } = useForm({
    resolver: yupResolver(paymentFormSchema) as any,
    defaultValues,
    mode: 'onChange',
  });

  const watchedValues = watch();
  const needsShipping = watch('needsShipping');

  // Update Redux store when form changes
  React.useEffect(() => {
    const data = getValues();
    
    // Update customer info
    dispatch(setCustomerEmail(data.email));
    if (data.name) dispatch(setCustomerName(data.name));
    if (data.phone) dispatch(setCustomerPhone(data.phone));
    
    // Update preferences
    dispatch(setAgreedToTerms(data.agreedToTerms));
    dispatch(setNewsletter(data.newsletter));
    
    // Update shipping address
    if (data.needsShipping && data.shippingAddress) {
      dispatch(setShippingAddress(data.shippingAddress));
    } else {
      dispatch(setShippingAddress(undefined));
    }
    
    // Notify parent component
    onChange?.(isValid, data);
  }, [watchedValues, isValid, dispatch, onChange, getValues]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Customer Information
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Please provide your details to complete the payment.
        </Typography>

        <Box component="form" noValidate>
          <Grid container spacing={3}>
            {/* Email Address (Required) */}
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    required
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    autoComplete="email"
                    placeholder="your.email@example.com"
                  />
                )}
              />
            </Grid>

            {/* Name (Optional) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Full Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    autoComplete="name"
                    placeholder="John Doe"
                  />
                )}
              />
            </Grid>

            {/* Phone (Optional) */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    autoComplete="tel"
                    placeholder="+1 (555) 123-4567"
                  />
                )}
              />
            </Grid>

            {/* Shipping Option */}
            {showShipping && (
              <Grid item xs={12}>
                <Controller
                  name="needsShipping"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                          color="primary"
                        />
                      }
                      label="This order requires shipping"
                    />
                  )}
                />
              </Grid>
            )}

            {/* Shipping Address */}
            <Collapse in={needsShipping} timeout="auto" unmountOnExit>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Shipping Address
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="shippingAddress.line1"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Street Address"
                          required={needsShipping}
                          error={!!errors.shippingAddress?.line1}
                          helperText={errors.shippingAddress?.line1?.message}
                          autoComplete="address-line1"
                          placeholder="123 Main Street"
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="shippingAddress.city"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="City"
                          required={needsShipping}
                          error={!!errors.shippingAddress?.city}
                          helperText={errors.shippingAddress?.city?.message}
                          autoComplete="address-level2"
                          placeholder="New York"
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="shippingAddress.state"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="State/Province"
                          required={needsShipping}
                          error={!!errors.shippingAddress?.state}
                          helperText={errors.shippingAddress?.state?.message}
                          autoComplete="address-level1"
                          placeholder="NY"
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="shippingAddress.postalCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Postal Code"
                          required={needsShipping}
                          error={!!errors.shippingAddress?.postalCode}
                          helperText={errors.shippingAddress?.postalCode?.message}
                          autoComplete="postal-code"
                          placeholder="10001"
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="shippingAddress.countryCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Country"
                          required={needsShipping}
                          error={!!errors.shippingAddress?.countryCode}
                          helperText={errors.shippingAddress?.countryCode?.message}
                          autoComplete="country"
                          placeholder="US"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Collapse>

            {/* Terms and Conditions */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Controller
                name="agreedToTerms"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        color="primary"
                        required
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the{' '}
                        <Box
                          component="a"
                          href="/terms"
                          target="_blank"
                          sx={{ textDecoration: 'underline', color: 'primary.main' }}
                        >
                          Terms and Conditions
                        </Box>{' '}
                        and{' '}
                        <Box
                          component="a"
                          href="/privacy"
                          target="_blank"
                          sx={{ textDecoration: 'underline', color: 'primary.main' }}
                        >
                          Privacy Policy
                        </Box>
                      </Typography>
                    }
                  />
                )}
              />
              {errors.agreedToTerms && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.agreedToTerms.message}
                </Alert>
              )}
            </Grid>

            {/* Newsletter Subscription */}
            <Grid item xs={12}>
              <Controller
                name="newsletter"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Subscribe to our newsletter for updates and special offers
                      </Typography>
                    }
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Form Status */}
          {!isValid && Object.keys(errors).length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please complete all required fields before proceeding with payment.
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
