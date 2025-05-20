"""
PayPal Service Fallback/Mock Implementation

This is a minimal implementation of the PayPal service that doesn't
require aiohttp or other external dependencies. It's intended for
testing purposes only and won't actually process payments.
"""

from dataclasses import dataclass
from typing import Dict, Any, List, Optional
import json
import uuid
from datetime import datetime, timedelta

@dataclass
class OrderCreationRequest:
    """
    Order creation request data structure
    """
    intent: str = "CAPTURE"
    purchase_units: List[Dict[str, Any]] = None
    application_context: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.purchase_units is None:
            self.purchase_units = []
        if self.application_context is None:
            self.application_context = {}

@dataclass
class PayPalCredentials:
    """
    PayPal API credentials
    """
    client_id: str
    client_secret: str
    webhook_id: Optional[str] = None
    
class PayPalService:
    """
    Mock PayPal payment processing service
    
    This is a fallback that doesn't require external HTTP libraries
    and always returns success responses for testing purposes.
    """
    
    def __init__(self, credentials: PayPalCredentials, sandbox: bool = True):
        """
        Initialize the PayPal service
        
        Args:
            credentials: PayPal API credentials
            sandbox: Whether to use sandbox mode
        """
        self.credentials = credentials
        self.base_url = "https://api-m.sandbox.paypal.com" if sandbox else "https://api-m.paypal.com"
        self.sandbox = sandbox
    
    async def create_order(self, request: OrderCreationRequest) -> Dict[str, Any]:
        """
        Create a mock order
        
        Args:
            request: Order creation request
            
        Returns:
            Mock order creation response
        """
        # Generate a mock order ID
        order_id = f"MOCK-{uuid.uuid4().hex[:12]}"
        
        # Calculate a mocked completion date
        created_time = datetime.now().isoformat() + 'Z'
        completion_time = (datetime.now() + timedelta(minutes=15)).isoformat() + 'Z'
        
        # Extract amount from the request for the response
        amount = {"value": "0.00", "currency_code": "USD"}
        if request.purchase_units and len(request.purchase_units) > 0:
            if "amount" in request.purchase_units[0]:
                amount = request.purchase_units[0]["amount"]
        
        # Create a mock response
        response = {
            "id": order_id,
            "status": "CREATED",
            "links": [
                {
                    "href": f"{self.base_url}/v2/checkout/orders/{order_id}",
                    "rel": "self",
                    "method": "GET"
                },
                {
                    "href": f"{self.base_url}/v2/checkout/orders/{order_id}",
                    "rel": "approve",
                    "method": "POST"
                },
                {
                    "href": f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
                    "rel": "capture",
                    "method": "POST"
                }
            ],
            "create_time": created_time,
            "update_time": created_time,
            "purchase_units": [
                {
                    "reference_id": "default",
                    "amount": amount,
                    "payee": {
                        "email_address": "sb-merchant@example.com",
                        "merchant_id": "MOCKMERCHANT"
                    }
                }
            ]
        }
        
        return response
    
    async def capture_order(self, order_id: str) -> Dict[str, Any]:
        """
        Capture a mock order
        
        Args:
            order_id: Order ID to capture
            
        Returns:
            Mock capture response
        """
        # Generate capture ID
        capture_id = f"MOCKCAP-{uuid.uuid4().hex[:10]}"
        
        # Calculate timestamps
        created_time = datetime.now().isoformat() + 'Z'
        
        # Mock capture response
        response = {
            "id": order_id,
            "status": "COMPLETED",
            "purchase_units": [
                {
                    "reference_id": "default",
                    "shipping": {
                        "name": {
                            "full_name": "John Doe"
                        },
                        "address": {
                            "address_line_1": "123 Main St",
                            "admin_area_2": "San Jose",
                            "admin_area_1": "CA",
                            "postal_code": "95131",
                            "country_code": "US"
                        }
                    },
                    "payments": {
                        "captures": [
                            {
                                "id": capture_id,
                                "status": "COMPLETED",
                                "amount": {
                                    "currency_code": "USD",
                                    "value": "100.00"
                                },
                                "final_capture": True,
                                "create_time": created_time,
                                "update_time": created_time
                            }
                        ]
                    }
                }
            ]
        }
        
        return response
    
    async def get_order_details(self, order_id: str) -> Dict[str, Any]:
        """
        Get mock order details
        
        Args:
            order_id: Order ID
            
        Returns:
            Mock order details
        """
        # Calculate timestamps
        created_time = datetime.now().isoformat() + 'Z'
        
        # Mock order details
        response = {
            "id": order_id,
            "status": "CREATED",
            "create_time": created_time,
            "update_time": created_time,
            "purchase_units": [
                {
                    "reference_id": "default",
                    "amount": {
                        "currency_code": "USD",
                        "value": "100.00",
                        "breakdown": {
                            "item_total": {
                                "currency_code": "USD",
                                "value": "100.00"
                            }
                        }
                    }
                }
            ]
        }
        
        return response
    
    async def verify_webhook_signature(self, headers: Dict[str, str], body: str) -> bool:
        """
        Verify webhook signature (always returns True in this mock)
        
        Args:
            headers: Webhook headers
            body: Webhook body
            
        Returns:
            True (always in this mock)
        """
        return True

def create_paypal_service(client_id: str, client_secret: str, 
                          webhook_id: Optional[str] = None, 
                          sandbox: bool = True) -> PayPalService:
    """
    Create PayPal service instance
    
    Args:
        client_id: PayPal client ID
        client_secret: PayPal client secret
        webhook_id: PayPal webhook ID
        sandbox: Whether to use sandbox mode
        
    Returns:
        PayPal service instance
    """
    credentials = PayPalCredentials(
        client_id=client_id,
        client_secret=client_secret,
        webhook_id=webhook_id
    )
    
    return PayPalService(credentials=credentials, sandbox=sandbox)
