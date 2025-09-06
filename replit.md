# AR Restaurant Management System

## Overview

This is a comprehensive restaurant management system with AR (Augmented Reality) menu viewing capabilities. The application features three distinct user interfaces: a super admin panel for complete system management, restaurant owner dashboards for order management, and customer-facing AR menus accessible via QR codes.

The system enables restaurants to showcase their dishes in 3D/AR format, allowing customers to visualize meals before ordering. Orders are processed in real-time using WebSocket connections, providing instant notifications to restaurant owners.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for fast development and building
- **Styling**: TailwindCSS with shadcn/ui component library for consistent UI design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **3D/AR Integration**: Google Model Viewer for native AR support on mobile devices, with Three.js as fallback for pseudo-AR experiences

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful APIs with role-based access control
- **Real-time Communication**: WebSocket implementation for live order notifications
- **Authentication**: JWT-based authentication system with bcrypt password hashing
- **Data Storage**: In-memory storage with interface abstraction for future database migration

### Database Design
- **ORM**: Drizzle ORM configured for PostgreSQL with Neon Database integration
- **Schema**: Four main entities - users, restaurants, dishes, and orders
- **Data Types**: Support for JSON fields (ingredients, order items) and decimal pricing
- **Migrations**: Drizzle Kit for schema management and migrations

### Authentication & Authorization
- **Multi-role System**: Super admin and restaurant owner roles with distinct permissions
- **Token Management**: JWT tokens with secure storage in localStorage
- **Access Control**: Middleware-based authentication with role verification
- **Session Handling**: Automatic token validation and refresh capabilities

### AR/3D Integration
- **Model Formats**: Support for GLB (Android) and USDZ (iOS) 3D model formats
- **AR Implementation**: Native AR via Model Viewer for iOS/Android devices
- **Fallback Strategy**: Three.js-based 3D viewer for devices without AR support
- **Performance**: Lazy loading of 3D models with error handling and loading states

### Real-time Features
- **WebSocket Architecture**: Dedicated channels for restaurant-specific order updates
- **Connection Management**: Automatic reconnection with exponential backoff
- **Event Handling**: Structured message passing for order status updates
- **Scalability**: Restaurant-based client grouping for efficient message routing

## External Dependencies

### Core Frontend Libraries
- **React Ecosystem**: React 18, Vite, TanStack Query for modern React development
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: TailwindCSS with custom design tokens and responsive utilities
- **Form Handling**: React Hook Form with Zod validation schemas

### 3D/AR Technologies
- **Google Model Viewer**: Web component for AR/3D model display
- **Three.js**: 3D graphics library for fallback AR experiences
- **WebXR Support**: Progressive enhancement for AR-capable browsers

### Backend Infrastructure
- **Express.js**: Web application framework with middleware support
- **Socket Integration**: ws library for WebSocket server implementation
- **Security**: bcrypt for password hashing, JWT for authentication tokens

### Database & ORM
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Drizzle Kit**: Migration management and schema generation tools

### Development Tools
- **TypeScript**: Full-stack type safety with strict configuration
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Autoprefixer for cross-browser compatibility

### External Services
- **QR Code Generation**: Server-side QR code creation for restaurant menus
- **File Storage**: Support for image and 3D model file hosting
- **Session Management**: PostgreSQL session store for production scalability