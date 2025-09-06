import { type User, type InsertUser, type Restaurant, type InsertRestaurant, type Dish, type InsertDish, type Order, type InsertOrder } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Restaurant operations
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getAllRestaurants(): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: string): Promise<boolean>;
  
  // Dish operations
  getDish(id: string): Promise<Dish | undefined>;
  getDishesByRestaurant(restaurantId: string): Promise<Dish[]>;
  getAllDishes(): Promise<Dish[]>;
  createDish(dish: InsertDish): Promise<Dish>;
  updateDish(id: string, updates: Partial<Dish>): Promise<Dish | undefined>;
  deleteDish(id: string): Promise<boolean>;
  
  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByRestaurant(restaurantId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private restaurants: Map<string, Restaurant>;
  private dishes: Map<string, Dish>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.dishes = new Map();
    this.orders = new Map();
    
    // Initialize with seed data
    this.initializeSeedData();
  }

  private async initializeSeedData() {
    // Create super admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const superAdmin: User = {
      id: randomUUID(),
      username: "superadmin",
      password: hashedPassword,
      email: "admin@example.com",
      role: "super_admin",
      restaurantId: null,
      createdAt: new Date(),
    };
    this.users.set(superAdmin.id, superAdmin);

    // Create sample restaurant
    const restaurant: Restaurant = {
      id: randomUUID(),
      name: "Bella Vista",
      description: "Authentic Italian cuisine in the heart of the city",
      cuisine: "Italian",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      isEnabled: true,
      qrCode: `bella-vista-${randomUUID()}`,
      ownerId: null,
      createdAt: new Date(),
    };
    this.restaurants.set(restaurant.id, restaurant);

    // Create restaurant owner
    const ownerPassword = await bcrypt.hash("owner123", 10);
    const restaurantOwner: User = {
      id: randomUUID(),
      username: "marco.rossi",
      password: ownerPassword,
      email: "marco@bellavista.com",
      role: "restaurant_owner",
      restaurantId: restaurant.id,
      createdAt: new Date(),
    };
    this.users.set(restaurantOwner.id, restaurantOwner);

    // Update restaurant with owner
    restaurant.ownerId = restaurantOwner.id;
    this.restaurants.set(restaurant.id, restaurant);

    // Create sample dishes
    const dishes: Dish[] = [
      {
        id: randomUUID(),
        name: "Margherita Pizza",
        description: "Classic Italian pizza with fresh mozzarella, tomato sauce, and basil",
        price: "18.00",
        image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        glbModel: "https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20c6b6%2FPizza.glb",
        usdzModel: "https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20c6b6%2FPizza.usdz",
        ingredients: ["Fresh Mozzarella", "Tomato Sauce", "Fresh Basil", "Extra Virgin Olive Oil"],
        restaurantId: restaurant.id,
        isAvailable: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Chicken Parmigiana",
        description: "Breaded chicken breast with marinara sauce and melted mozzarella",
        price: "22.00",
        image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        glbModel: "https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20c6b6%2FChicken.glb",
        usdzModel: "https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20c6b6%2FChicken.usdz",
        ingredients: ["Chicken Breast", "Marinara Sauce", "Mozzarella", "Breadcrumbs", "Parmesan"],
        restaurantId: restaurant.id,
        isAvailable: true,
        createdAt: new Date(),
      },
    ];

    dishes.forEach(dish => {
      this.dishes.set(dish.id, dish);
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Restaurant operations
  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = randomUUID();
    const restaurant: Restaurant = {
      ...insertRestaurant,
      id,
      qrCode: `${insertRestaurant.name.toLowerCase().replace(/\s+/g, '-')}-${randomUUID()}`,
      createdAt: new Date(),
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const existing = this.restaurants.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.restaurants.set(id, updated);
    return updated;
  }

  async deleteRestaurant(id: string): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  // Dish operations
  async getDish(id: string): Promise<Dish | undefined> {
    return this.dishes.get(id);
  }

  async getDishesByRestaurant(restaurantId: string): Promise<Dish[]> {
    return Array.from(this.dishes.values()).filter(dish => dish.restaurantId === restaurantId);
  }

  async getAllDishes(): Promise<Dish[]> {
    return Array.from(this.dishes.values());
  }

  async createDish(insertDish: InsertDish): Promise<Dish> {
    const id = randomUUID();
    const dish: Dish = {
      ...insertDish,
      id,
      createdAt: new Date(),
    };
    this.dishes.set(id, dish);
    return dish;
  }

  async updateDish(id: string, updates: Partial<Dish>): Promise<Dish | undefined> {
    const existing = this.dishes.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.dishes.set(id, updated);
    return updated;
  }

  async deleteDish(id: string): Promise<boolean> {
    return this.dishes.delete(id);
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.restaurantId === restaurantId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
