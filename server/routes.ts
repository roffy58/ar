import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, insertRestaurantSchema, insertDishSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Auth middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Super admin only middleware
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket setup for real-time order updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients by restaurant
  const restaurantClients = new Map<string, Set<WebSocket>>();
  
  wss.on('connection', (ws, req) => {
    let restaurantId: string | null = null;
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.restaurantId) {
          restaurantId = data.restaurantId as string;
          
          if (!restaurantClients.has(restaurantId)) {
            restaurantClients.set(restaurantId, new Set());
          }
          restaurantClients.get(restaurantId)!.add(ws);
          
          ws.send(JSON.stringify({ type: 'subscribed', restaurantId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (restaurantId) {
        const clients = restaurantClients.get(restaurantId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            restaurantClients.delete(restaurantId);
          }
        }
      }
    });
  });

  // Broadcast to restaurant clients
  const broadcastToRestaurant = (restaurantId: string, data: any) => {
    const clients = restaurantClients.get(restaurantId);
    if (clients) {
      const message = JSON.stringify(data);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Restaurant routes
  app.get("/api/restaurants", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role === 'super_admin') {
        const restaurants = await storage.getAllRestaurants();
        res.json(restaurants);
      } else {
        // Restaurant owners can only see their own restaurant
        if (req.user.restaurantId) {
          const restaurant = await storage.getRestaurant(req.user.restaurantId);
          res.json(restaurant ? [restaurant] : []);
        } else {
          res.json([]);
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/restaurants", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      const restaurant = await storage.createRestaurant(validatedData);
      res.status(201).json(restaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/restaurants/:id", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const restaurant = await storage.updateRestaurant(req.params.id, req.body);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/restaurants/:id", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteRestaurant(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json({ message: "Restaurant deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // QR Code generation
  app.get("/api/restaurants/:id/qr", async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const menuUrl = `${process.env.REPLIT_DOMAIN || 'http://localhost:5000'}/menu/${restaurant.id}`;
      const qrCodeData = await QRCode.toDataURL(menuUrl);
      
      res.json({ qrCode: qrCodeData, url: menuUrl });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dish routes
  app.get("/api/dishes", authenticateToken, async (req: any, res) => {
    try {
      const { restaurantId } = req.query;
      
      if (restaurantId) {
        const dishes = await storage.getDishesByRestaurant(restaurantId as string);
        res.json(dishes);
      } else if (req.user.role === 'super_admin') {
        const dishes = await storage.getAllDishes();
        res.json(dishes);
      } else if (req.user.restaurantId) {
        const dishes = await storage.getDishesByRestaurant(req.user.restaurantId);
        res.json(dishes);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public route for customer menu
  app.get("/api/dishes/restaurant/:restaurantId", async (req, res) => {
    try {
      const dishes = await storage.getDishesByRestaurant(req.params.restaurantId);
      res.json(dishes.filter(dish => dish.isAvailable));
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/dishes", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const validatedData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(validatedData);
      res.status(201).json(dish);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/dishes/:id", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const dish = await storage.updateDish(req.params.id, req.body);
      if (!dish) {
        return res.status(404).json({ message: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/dishes/:id", authenticateToken, requireSuperAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteDish(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Dish not found" });
      }
      res.json({ message: "Dish deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Order routes
  app.get("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role === 'super_admin') {
        const orders = await storage.getAllOrders();
        res.json(orders);
      } else if (req.user.restaurantId) {
        const orders = await storage.getOrdersByRestaurant(req.user.restaurantId);
        res.json(orders);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public route for customer order placement
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Broadcast new order to restaurant clients
      broadcastToRestaurant(order.restaurantId, {
        type: 'new_order',
        order
      });
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user has permission to update this order
      if (req.user.role !== 'super_admin' && req.user.restaurantId !== existingOrder.restaurantId) {
        return res.status(403).json({ message: "Not authorized to update this order" });
      }

      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Broadcast order status update
      broadcastToRestaurant(order.restaurantId, {
        type: 'order_updated',
        order
      });

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
