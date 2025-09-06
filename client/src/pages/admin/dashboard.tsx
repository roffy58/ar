import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Store, 
  Utensils, 
  QrCode, 
  Users, 
  BarChart3, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2,
  Bell,
  DollarSign,
  Receipt,
  LogOut
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine?: string;
  image?: string;
  isEnabled: boolean;
  ownerId?: string;
}

interface Dish {
  id: string;
  name: string;
  price: string;
  restaurantId: string;
  isAvailable: boolean;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: "", description: "", cuisine: "", image: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    const user = AuthService.getUser();
    if (!user || user.role !== 'super_admin') {
      setLocation('/admin');
    }
  }, [setLocation]);

  // Fetch restaurants
  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/restaurants');
      return response.json();
    },
  });

  // Fetch dishes
  const { data: dishes = [] } = useQuery({
    queryKey: ['/api/dishes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dishes');
      return response.json();
    },
  });

  // Filter restaurants based on search
  const filteredRestaurants = restaurants.filter((restaurant: Restaurant) =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle restaurant status
  const toggleRestaurantMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const response = await apiRequest('PATCH', `/api/restaurants/${id}`, { isEnabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      toast({
        title: "Restaurant updated",
        description: "Restaurant status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update restaurant status",
        variant: "destructive",
      });
    },
  });

  // Add restaurant mutation
  const addRestaurantMutation = useMutation({
    mutationFn: async (restaurantData: any) => {
      const response = await apiRequest('POST', '/api/restaurants', restaurantData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      setShowAddModal(false);
      setNewRestaurant({ name: "", description: "", cuisine: "", image: "" });
      toast({
        title: "Restaurant added",
        description: "New restaurant has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add restaurant",
        description: error.message || "Failed to add new restaurant",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await AuthService.logout();
    setLocation('/admin');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const generateQRCode = async (restaurantId: string) => {
    try {
      const response = await apiRequest('GET', `/api/restaurants/${restaurantId}/qr`);
      const data = await response.json();
      
      // Open QR code in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>QR Code - Restaurant Menu</title></head>
            <body style="display: flex; flex-direction: column; align-items: center; padding: 20px; font-family: Arial, sans-serif;">
              <h2>Restaurant Menu QR Code</h2>
              <img src="${data.qrCode}" alt="QR Code" style="border: 1px solid #ddd; padding: 10px;" />
              <p>URL: <a href="${data.url}" target="_blank">${data.url}</a></p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      toast({
        title: "QR Code generation failed",
        description: "Failed to generate QR code for the restaurant",
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter((r: Restaurant) => r.isEnabled).length;
  const totalDishes = dishes.length;
  const activeDishes = dishes.filter((d: Dish) => d.isAvailable).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground font-serif">AR Restaurant</h1>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "dashboard" 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`} 
              data-testid="nav-dashboard"
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("restaurants")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "restaurants" 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`} 
              data-testid="nav-restaurants"
            >
              <Store className="w-4 h-4 mr-3" />
              Restaurants
            </button>
            <button 
              onClick={() => setActiveTab("dishes")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "dishes" 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`} 
              data-testid="nav-dishes"
            >
              <Utensils className="w-4 h-4 mr-3" />
              Dishes
            </button>
            <button 
              onClick={() => setActiveTab("qrcodes")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "qrcodes" 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`} 
              data-testid="nav-qrcodes"
            >
              <QrCode className="w-4 h-4 mr-3" />
              QR Codes
            </button>
            <button 
              onClick={() => setActiveTab("owners")}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "owners" 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`} 
              data-testid="nav-owners"
            >
              <Users className="w-4 h-4 mr-3" />
              Owners
            </button>
          </nav>
          
          {/* User Menu */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-foreground">Super Admin</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-serif">
                {activeTab === "dashboard" ? "Dashboard" :
                 activeTab === "restaurants" ? "Restaurants" :
                 activeTab === "dishes" ? "Dishes" :
                 activeTab === "qrcodes" ? "QR Codes" :
                 activeTab === "owners" ? "Owners" : "Dashboard"}
              </h1>
              <p className="text-muted-foreground">
                {activeTab === "dashboard" ? "Manage your restaurant network" :
                 activeTab === "restaurants" ? "Manage all restaurants" :
                 activeTab === "dishes" ? "Manage all dishes" :
                 activeTab === "qrcodes" ? "Generate QR codes" :
                 activeTab === "owners" ? "Manage restaurant owners" : "Manage your restaurant network"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">3</span>
              </button>
              {activeTab === "restaurants" && (
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-restaurant">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Restaurant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Restaurant</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                          id="name"
                          value={newRestaurant.name}
                          onChange={(e) => setNewRestaurant(prev => ({ ...prev, name: e.target.value }))}
                          className="col-span-3"
                          placeholder="Restaurant name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cuisine" className="text-right">Cuisine</Label>
                        <Input
                          id="cuisine"
                          value={newRestaurant.cuisine}
                          onChange={(e) => setNewRestaurant(prev => ({ ...prev, cuisine: e.target.value }))}
                          className="col-span-3"
                          placeholder="Italian, Chinese, etc."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="image" className="text-right">Image URL</Label>
                        <Input
                          id="image"
                          value={newRestaurant.image}
                          onChange={(e) => setNewRestaurant(prev => ({ ...prev, image: e.target.value }))}
                          className="col-span-3"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">Description</Label>
                        <Textarea
                          id="description"
                          value={newRestaurant.description}
                          onChange={(e) => setNewRestaurant(prev => ({ ...prev, description: e.target.value }))}
                          className="col-span-3"
                          placeholder="Restaurant description"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => addRestaurantMutation.mutate(newRestaurant)}
                        disabled={!newRestaurant.name.trim() || addRestaurantMutation.isPending}
                      >
                        {addRestaurantMutation.isPending ? "Adding..." : "Add Restaurant"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {activeTab === "dashboard" && (
            <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="stats-restaurants">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Restaurants</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-total-restaurants">{totalRestaurants}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-accent-foreground" data-testid="text-active-restaurants">{activeRestaurants} active</span>
                  <span className="text-muted-foreground ml-2">restaurants</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stats-dishes">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Active Dishes</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-total-dishes">{activeDishes}</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-chart-2" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-accent-foreground">of {totalDishes}</span>
                  <span className="text-muted-foreground ml-2">total dishes</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stats-orders">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Daily Orders</p>
                    <p className="text-3xl font-bold text-foreground">0</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-chart-3" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-accent-foreground">+0%</span>
                  <span className="text-muted-foreground ml-2">from yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="stats-revenue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Revenue</p>
                    <p className="text-3xl font-bold text-foreground">$0</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-chart-4" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-accent-foreground">+0%</span>
                  <span className="text-muted-foreground ml-2">from last week</span>
                </div>
              </CardContent>
            </Card>
          </div>

          </>
          )}

          {/* Restaurants Table */}
          {activeTab === "restaurants" && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Restaurants</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search restaurants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                      data-testid="input-search-restaurants"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-primary text-primary-foreground" 
                    onClick={() => setShowAddModal(true)}
                    data-testid="button-add-restaurant-table"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRestaurants ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading restaurants...</div>
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Store className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-restaurants">
                    {searchTerm ? 'No restaurants found matching your search' : 'No restaurants yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Restaurant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dishes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">QR Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRestaurants.map((restaurant: Restaurant) => (
                        <tr key={restaurant.id} className="hover:bg-muted/50" data-testid={`row-restaurant-${restaurant.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                                alt={`${restaurant.name} restaurant`} 
                                className="w-10 h-10 rounded-lg object-cover" 
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-foreground" data-testid={`text-restaurant-name-${restaurant.id}`}>{restaurant.name}</div>
                                <div className="text-sm text-muted-foreground">{restaurant.cuisine || 'Various'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">Owner Name</div>
                            <div className="text-sm text-muted-foreground">owner@email.com</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`text-dish-count-${restaurant.id}`}>
                            {dishes.filter((d: Dish) => d.restaurantId === restaurant.id).length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={restaurant.isEnabled ? "default" : "secondary"}
                              className={restaurant.isEnabled ? "bg-accent text-accent-foreground" : ""}
                              data-testid={`badge-status-${restaurant.id}`}
                            >
                              {restaurant.isEnabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateQRCode(restaurant.id)}
                              className="text-primary hover:text-primary/80"
                              data-testid={`button-qr-${restaurant.id}`}
                            >
                              <QrCode className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                                data-testid={`button-edit-${restaurant.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground"
                                data-testid={`button-view-${restaurant.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRestaurantMutation.mutate({
                                  id: restaurant.id,
                                  isEnabled: !restaurant.isEnabled
                                })}
                                className="text-muted-foreground hover:text-foreground"
                                data-testid={`button-toggle-${restaurant.id}`}
                              >
                                {restaurant.isEnabled ? (
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                ) : (
                                  <Eye className="w-4 h-4 text-chart-2" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Other tabs content */}
          {activeTab === "dishes" && (
            <Card>
              <CardHeader>
                <CardTitle>Dishes Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Dishes management coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "qrcodes" && (
            <Card>
              <CardHeader>
                <CardTitle>QR Code Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">QR code management coming soon...</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "owners" && (
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Owners</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Owner management coming soon...</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
