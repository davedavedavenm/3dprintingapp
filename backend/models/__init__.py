"""
Database Models for 3D Print Quoting System

This module defines SQLAlchemy models for data persistence
including quotes, orders, users, and transaction history.

Technical Architecture:
- SQLAlchemy ORM with relationship management
- JSON fields for flexible data storage
- Audit logging with timestamps
- Soft delete functionality for data retention
"""

import uuid
import json
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
import enum

# Base model class
Base = declarative_base()


class TimestampedModel(Base):
    """Abstract base model with timestamp fields"""
    __abstract__ = True
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SoftDeleteModel(TimestampedModel):
    """Abstract base model with soft delete functionality"""
    __abstract__ = True
    
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    def soft_delete(self):
        """Mark record as deleted"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self):
        """Restore soft-deleted record"""
        self.is_deleted = False
        self.deleted_at = None


# Enums
class QuoteStatus(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    USED = "used"
    CANCELLED = "cancelled"


class OrderStatus(enum.Enum):
    PENDING = "pending"
    CREATED = "created"
    APPROVED = "approved"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class MaterialType(enum.Enum):
    PLA = "PLA"
    ABS = "ABS"
    PETG = "PETG"
    TPU = "TPU"
    ASA = "ASA"
    PC = "PC"
    HIPS = "HIPS"


# User model
class User(SoftDeleteModel):
    """User account information"""
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Preferences
    default_material = Column(Enum(MaterialType), default=MaterialType.PLA)
    default_infill = Column(Integer, default=20)
    default_layer_height = Column(Float, default=0.2)
    
    # Relationships
    quotes = relationship("Quote", back_populates="user", lazy='dynamic')
    orders = relationship("Order", back_populates="user", lazy='dynamic')
    
    @validates('email')
    def validate_email(self, key, email):
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
        return email.lower()
    
    def __repr__(self):
        return f"<User {self.email}>"


# STL File model
class STLFile(SoftDeleteModel):
    """STL file information and metadata"""
    __tablename__ = 'stl_files'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    mime_type = Column(String(100), nullable=False)
    
    # Processing status
    validation_status = Column(String(50), default='pending')
    virus_scan_result = Column(String(50), nullable=True)
    
    # Session tracking
    session_id = Column(String(50), nullable=True, index=True)
    upload_ip = Column(String(45), nullable=True)
    
    # Relationships
    quotes = relationship("Quote", back_populates="stl_file", lazy='dynamic')
    
    def __repr__(self):
        return f"<STLFile {self.original_filename}>"


# Quote model
class Quote(SoftDeleteModel):
    """Quote generation and pricing information"""
    __tablename__ = 'quotes'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    stl_file_id = Column(UUID(as_uuid=True), ForeignKey('stl_files.id'), nullable=False)
    
    # Quote status and timing
    status = Column(Enum(QuoteStatus), default=QuoteStatus.DRAFT, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    # Print configuration
    material_type = Column(Enum(MaterialType), nullable=False)
    infill_percentage = Column(Integer, nullable=False)
    layer_height = Column(Float, nullable=False)
    support_material = Column(Boolean, default=False)
    quantity = Column(Integer, default=1)
    
    # Analysis data from PrusaSlicer
    print_time_minutes = Column(Float, nullable=True)
    filament_used_grams = Column(Float, nullable=True)
    layer_count = Column(Integer, nullable=True)
    complexity_score = Column(Integer, nullable=True)
    
    # Pricing breakdown
    material_cost = Column(Float, nullable=False)
    time_cost = Column(Float, nullable=False)
    complexity_adjustment = Column(Float, nullable=False)
    overhead_cost = Column(Float, nullable=False)
    profit_margin = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    currency = Column(String(3), default='USD')
    
    # Additional options
    rush_order = Column(Boolean, default=False)
    post_processing = Column(JSON, nullable=True)
    custom_options = Column(JSON, nullable=True)
    
    # Processing metadata
    gcode_path = Column(String(500), nullable=True)
    processing_time_seconds = Column(Float, nullable=True)
    detailed_breakdown = Column(JSON, nullable=True)
    
    # Session tracking
    session_id = Column(String(50), nullable=True, index=True)
    client_ip = Column(String(45), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="quotes")
    stl_file = relationship("STLFile", back_populates="quotes")
    orders = relationship("Order", back_populates="quote", lazy='dynamic')
    
    @validates('infill_percentage')
    def validate_infill(self, key, infill):
        """Validate infill percentage"""
        if not 0 <= infill <= 100:
            raise ValueError("Infill percentage must be between 0 and 100")
        return infill
    
    @validates('layer_height')
    def validate_layer_height(self, key, height):
        """Validate layer height"""
        if not 0.05 <= height <= 0.5:
            raise ValueError("Layer height must be between 0.05 and 0.5 mm")
        return height
    
    @property
    def is_expired(self):
        """Check if quote has expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def time_until_expiry(self):
        """Get time remaining until expiry"""
        if self.is_expired:
            return timedelta(0)
        return self.expires_at - datetime.utcnow()
    
    def extend_expiry(self, hours=24):
        """Extend quote expiry time"""
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
    
    def to_dict(self):
        """Convert quote to dictionary for API responses"""
        return {
            'id': str(self.id),
            'status': self.status.value,
            'material_type': self.material_type.value,
            'infill_percentage': self.infill_percentage,
            'layer_height': self.layer_height,
            'total_cost': self.total_cost,
            'currency': self.currency,
            'expires_at': self.expires_at.isoformat(),
            'is_expired': self.is_expired,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f"<Quote {self.id} - ${self.total_cost}>"


# Order model
class Order(SoftDeleteModel):
    """Order processing and fulfillment information"""
    __tablename__ = 'orders'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    
    # Foreign keys
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    quote_id = Column(UUID(as_uuid=True), ForeignKey('quotes.id'), nullable=False)
    
    # Order status
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    # Customer information
    customer_email = Column(String(255), nullable=False)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    
    # Shipping information
    shipping_address = Column(JSON, nullable=True)
    shipping_method = Column(String(50), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    
    # Order totals
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(3), default='USD')
    
    # Fulfillment tracking
    production_started_at = Column(DateTime, nullable=True)
    production_completed_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    estimated_completion = Column(DateTime, nullable=True)
    
    # Notes and special instructions
    customer_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    special_instructions = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="orders")
    quote = relationship("Quote", back_populates="orders")
    payments = relationship("Payment", back_populates="order", lazy='dynamic')
    
    def generate_order_number(self):
        """Generate unique order number"""
        from datetime import datetime
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        random_suffix = str(uuid.uuid4().hex)[:6].upper()
        self.order_number = f"3DP-{timestamp}-{random_suffix}"
    
    @property
    def is_paid(self):
        """Check if order is fully paid"""
        paid_amount = sum(p.amount for p in self.payments.filter_by(status=PaymentStatus.COMPLETED))
        return paid_amount >= self.total_amount
    
    @property
    def production_time_days(self):
        """Calculate production time in days"""
        if self.production_started_at and self.production_completed_at:
            delta = self.production_completed_at - self.production_started_at
            return delta.days
        return None
    
    def to_dict(self):
        """Convert order to dictionary for API responses"""
        return {
            'id': str(self.id),
            'order_number': self.order_number,
            'status': self.status.value,
            'customer_email': self.customer_email,
            'total_amount': self.total_amount,
            'currency': self.currency,
            'is_paid': self.is_paid,
            'created_at': self.created_at.isoformat(),
            'estimated_completion': self.estimated_completion.isoformat() if self.estimated_completion else None
        }
    
    def __repr__(self):
        return f"<Order {self.order_number} - {self.status.value}>"


# Payment model
class Payment(TimestampedModel):
    """Payment transaction information"""
    __tablename__ = 'payments'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    order_id = Column(UUID(as_uuid=True), ForeignKey('orders.id'), nullable=False)
    
    # Payment provider information
    paypal_order_id = Column(String(100), nullable=True, index=True)
    paypal_transaction_id = Column(String(100), nullable=True, index=True)
    payment_method = Column(String(50), nullable=False)
    
    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='USD')
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Processing timestamps
    authorized_at = Column(DateTime, nullable=True)
    captured_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Provider response data
    provider_response = Column(JSON, nullable=True)
    failure_reason = Column(String(255), nullable=True)
    
    # Audit information
    processed_by = Column(String(100), nullable=True)
    client_ip = Column(String(45), nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="payments")
    refunds = relationship("Refund", back_populates="payment", lazy='dynamic')
    
    @property
    def is_successful(self):
        """Check if payment was successful"""
        return self.status == PaymentStatus.COMPLETED
    
    @property
    def refunded_amount(self):
        """Calculate total refunded amount"""
        return sum(r.amount for r in self.refunds.filter_by(status='completed'))
    
    def to_dict(self):
        """Convert payment to dictionary for API responses"""
        return {
            'id': str(self.id),
            'payment_method': self.payment_method,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status.value,
            'captured_at': self.captured_at.isoformat() if self.captured_at else None,
            'paypal_transaction_id': self.paypal_transaction_id
        }
    
    def __repr__(self):
        return f"<Payment {self.id} - ${self.amount} {self.status.value}>"


# Refund model
class Refund(TimestampedModel):
    """Refund transaction information"""
    __tablename__ = 'refunds'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign keys
    payment_id = Column(UUID(as_uuid=True), ForeignKey('payments.id'), nullable=False)
    
    # Refund details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='USD')
    reason = Column(String(255), nullable=True)
    status = Column(String(50), default='pending')
    
    # Provider information
    paypal_refund_id = Column(String(100), nullable=True, index=True)
    provider_response = Column(JSON, nullable=True)
    
    # Processing information
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(String(100), nullable=True)
    
    # Relationships
    payment = relationship("Payment", back_populates="refunds")
    
    def __repr__(self):
        return f"<Refund {self.id} - ${self.amount}>"


# Material configuration model
class MaterialConfig(TimestampedModel):
    """Material pricing and configuration"""
    __tablename__ = 'material_configs'
    
    id = Column(Integer, primary_key=True)
    material_type = Column(Enum(MaterialType), unique=True, nullable=False)
    
    # Pricing
    cost_per_gram = Column(Float, nullable=False)
    density = Column(Float, nullable=False)  # g/cm³
    multiplier = Column(Float, default=1.0)
    
    # Availability
    available = Column(Boolean, default=True)
    in_stock = Column(Boolean, default=True)
    stock_quantity = Column(Float, nullable=True)  # kg
    
    # Print settings
    recommended_nozzle_temp = Column(Integer, nullable=True)
    recommended_bed_temp = Column(Integer, nullable=True)
    recommended_speed = Column(Integer, nullable=True)
    
    # Properties
    properties = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<MaterialConfig {self.material_type.value} - ${self.cost_per_gram}/g>"


# System configuration model
class SystemConfig(TimestampedModel):
    """System-wide configuration settings"""
    __tablename__ = 'system_configs'
    
    id = Column(Integer, primary_key=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    value_type = Column(String(20), default='string')  # string, integer, float, boolean, json
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    
    @property
    def parsed_value(self):
        """Parse value based on type"""
        if self.value_type == 'integer':
            return int(self.value)
        elif self.value_type == 'float':
            return float(self.value)
        elif self.value_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes')
        elif self.value_type == 'json':
            return json.loads(self.value)
        else:
            return self.value
    
    def __repr__(self):
        return f"<SystemConfig {self.key}={self.value}>"


# Audit log model
class AuditLog(TimestampedModel):
    """Audit trail for important system events"""
    __tablename__ = 'audit_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Event information
    event_type = Column(String(100), nullable=False, index=True)
    event_description = Column(Text, nullable=False)
    
    # User and session tracking
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    session_id = Column(String(50), nullable=True)
    client_ip = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Related entities
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(String(50), nullable=True)
    
    # Event data
    event_data = Column(JSON, nullable=True)
    
    # Risk assessment
    risk_level = Column(String(20), default='low')  # low, medium, high, critical
    
    def __repr__(self):
        return f"<AuditLog {self.event_type} - {self.created_at}>"


# Database initialization functions
def create_tables(engine):
    """Create all database tables"""
    Base.metadata.create_all(engine)


def drop_tables(engine):
    """Drop all database tables"""
    Base.metadata.drop_all(engine)


def init_default_data(session):
    """Initialize database with default configuration"""
    
    # Initialize material configurations
    materials = [
        MaterialConfig(
            material_type=MaterialType.PLA,
            cost_per_gram=0.025,
            density=1.24,
            recommended_nozzle_temp=210,
            recommended_bed_temp=60,
            recommended_speed=50,
            properties={
                'temperature_resistance': '50-60°C',
                'flexibility': 'Rigid',
                'difficulty': 'Easy',
                'food_safe': True
            },
            description='Biodegradable thermoplastic ideal for beginners'
        ),
        MaterialConfig(
            material_type=MaterialType.ABS,
            cost_per_gram=0.028,
            density=1.04,
            recommended_nozzle_temp=240,
            recommended_bed_temp=80,
            recommended_speed=45,
            properties={
                'temperature_resistance': '80-105°C',
                'flexibility': 'Semi-flexible',
                'difficulty': 'Moderate',
                'food_safe': False
            },
            description='Strong, impact-resistant thermoplastic'
        ),
        MaterialConfig(
            material_type=MaterialType.PETG,
            cost_per_gram=0.035,
            density=1.27,
            recommended_nozzle_temp=230,
            recommended_bed_temp=70,
            recommended_speed=40,
            properties={
                'temperature_resistance': '70-80°C',
                'flexibility': 'Semi-flexible',
                'difficulty': 'Easy',
                'food_safe': True
            },
            description='Chemical resistant with excellent clarity'
        ),
        MaterialConfig(
            material_type=MaterialType.TPU,
            cost_per_gram=0.045,
            density=1.20,
            recommended_nozzle_temp=220,
            recommended_bed_temp=50,
            recommended_speed=25,
            properties={
                'temperature_resistance': '60-80°C',
                'flexibility': 'Flexible',
                'difficulty': 'Advanced',
                'food_safe': False
            },
            description='Flexible thermoplastic polyurethane'
        )
    ]
    
    for material in materials:
        existing = session.query(MaterialConfig).filter_by(material_type=material.material_type).first()
        if not existing:
            session.add(material)
    
    # Initialize system configurations
    configs = [
        SystemConfig(key='time_rate', value='0.15', value_type='float', 
                    description='Cost per minute of print time', category='pricing'),
        SystemConfig(key='overhead_multiplier', value='1.35', value_type='float',
                    description='Overhead percentage multiplier', category='pricing'),
        SystemConfig(key='profit_margin', value='0.25', value_type='float',
                    description='Profit margin percentage', category='pricing'),
        SystemConfig(key='quote_expiry_hours', value='24', value_type='integer',
                    description='Quote validity period in hours', category='general'),
        SystemConfig(key='max_file_size_mb', value='100', value_type='integer',
                    description='Maximum upload file size in MB', category='upload'),
        SystemConfig(key='virus_scan_enabled', value='false', value_type='boolean',
                    description='Enable virus scanning for uploads', category='security'),
        SystemConfig(key='email_notifications_enabled', value='true', value_type='boolean',
                    description='Enable email notifications', category='notifications'),
        SystemConfig(key='maintenance_mode', value='false', value_type='boolean',
                    description='System maintenance mode', category='system')
    ]
    
    for config in configs:
        existing = session.query(SystemConfig).filter_by(key=config.key).first()
        if not existing:
            session.add(config)
    
    session.commit()
