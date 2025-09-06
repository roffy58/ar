import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";
import { socketService } from "@/lib/socket";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bell, 
  Users, 
  Clock, 
  Check, 
  CheckCheck, 
  DollarSign, 
  X,
  LogOut,
  Store
} from "lucide-react";

interface Order {
  id: string;
  restaurantId: string;
  tableNumber: string;
  items: Array<{
    dishId: string;
    dishName: string;
    quantity: number;
    price: string;
    specialInstructions?: string;
  }>;
  totalAmount: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  specialInstructions?: string;
  createdAt: string;
}

export default function OwnerDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState(AuthService.getUser());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    if (!user || user.role !== 'restaurant_owner') {
      setLocation('/owner');
      return;
    }

    // Connect to WebSocket for real-time updates
    socketService.connect(user.restaurantId);
    
    // Listen for new orders and updates
    const handleNewOrder = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "New Order Received!",
        description: `Table ${data.order.tableNumber} - $${data.order.totalAmount}`,
      });
    };

    const handleOrderUpdate = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    };

    socketService.on('new_order', handleNewOrder);
    socketService.on('order_updated', handleOrderUpdate);

    return () => {
      socketService.off('new_order', handleNewOrder);
      socketService.off('order_updated', handleOrderUpdate);
      socketService.disconnect();
    };
  }, [user, setLocation, queryClient, toast]);

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds as backup to WebSocket
  });

  // Update order status
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await AuthService.logout();
    setLocation('/owner');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-chart-3/10 text-chart-3 border-l-chart-3';
      case 'accepted': return 'bg-chart-2/10 text-chart-2 border-l-chart-2';
      case 'rejected': return 'bg-destructive/10 text-destructive border-l-destructive';
      case 'completed': return 'bg-accent/10 text-accent-foreground border-l-accent-foreground';
      default: return 'bg-muted/10 text-muted-foreground border-l-muted';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Calculate stats
  const pendingOrders = orders.filter((o: Order) => o.status === 'pending').length;
  const acceptedOrders = orders.filter((o: Order) => o.status === 'accepted').length;
  const completedOrders = orders.filter((o: Order) => o.status === 'completed').length;
  const totalRevenue = orders
    .filter((o: Order) => o.status === 'completed')
    .reduce((sum: number, order: Order) => sum + parseFloat(order.totalAmount), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 border-b border-border px-6 py-4 navbar-blur sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60" 
              alt="Restaurant logo" 
              className="w-12 h-12 rounded-lg object-cover" 
            />
            <div>
              <h1 className="text-xl font-bold text-foreground font-serif">Bella Vista</h1>
              <p className="text-muted-foreground text-sm">Order Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-accent px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-chart-2 rounded-full animate-pulse"></div>
              <span className="text-accent-foreground text-sm font-medium">Live Orders</span>
            </div>
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              {pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center" data-testid="notification-count">
                  {pendingOrders}
                </span>
              )}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-foreground font-medium">{user?.username || 'Owner'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stats-pending">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending Orders</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-pending-count">{pendingOrders}</p>
                </div>
                <Clock className="w-5 h-5 text-chart-3" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stats-accepted">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Accepted</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-accepted-count">{acceptedOrders}</p>
                </div>
                <Check className="w-5 h-5 text-chart-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stats-completed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Completed</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-completed-count">{completedOrders}</p>
                </div>
                <CheckCheck className="w-5 h-5 text-accent-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="stats-revenue">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Revenue Today</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-revenue">${totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-5 h-5 text-chart-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Orders */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Store className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg" data-testid="text-no-orders">No orders yet</p>
            <p className="text-muted-foreground text-sm">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order: Order) => (
              <Card key={order.id} className={`border-l-4 ${getStatusColor(order.status)}`} data-testid={`order-card-${order.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getStatusColor(order.status).split(' ')[1]} data-testid={`badge-status-${order.id}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <span className="text-muted-foreground text-sm" data-testid={`text-time-${order.id}`}>
                        {getTimeAgo(order.createdAt)}
                      </span>
                    </div>
                    <Badge className="bg-primary/10 text-primary" data-testid={`badge-table-${order.id}`}>
                      Table {order.tableNumber}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground" data-testid={`text-dish-name-${order.id}-${index}`}>{item.dishName}</p>
                          {item.specialInstructions && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-special-instructions-${order.id}-${index}`}>
                              {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground" data-testid={`text-quantity-${order.id}-${index}`}>×{item.quantity}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-price-${order.id}-${index}`}>${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.specialInstructions && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Special Instructions:</p>
                      <p className="text-sm text-foreground" data-testid={`text-order-instructions-${order.id}`}>
                        {order.specialInstructions}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-lg text-foreground" data-testid={`text-total-${order.id}`}>
                        ${order.totalAmount}
                      </span>
                    </div>
                    
                    {order.status === 'pending' && (
                      <div className="flex space-x-3">
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'rejected' })}
                          disabled={updateOrderMutation.isPending}
                          data-testid={`button-reject-${order.id}`}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          className="flex-1 bg-chart-2 text-white hover:bg-chart-2/90"
                          onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'accepted' })}
                          disabled={updateOrderMutation.isPending}
                          data-testid={`button-accept-${order.id}`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    )}
                    
                    {order.status === 'accepted' && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Est. Ready in 15 min</div>
                        <Button
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'completed' })}
                          disabled={updateOrderMutation.isPending}
                          data-testid={`button-complete-${order.id}`}
                        >
                          <CheckCheck className="w-4 h-4 mr-2" />
                          Mark Ready
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
