import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ARViewer from "@/components/ar-viewer";
import ThreeFallback from "@/components/three-fallback";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  ChevronLeft, 
  ChevronRight, 
  Store,
  AlertCircle,
  Camera,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine?: string;
  image?: string;
  isEnabled: boolean;
}

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  glbModel?: string;
  usdzModel?: string;
  ingredients?: string[];
  restaurantId: string;
  isAvailable: boolean;
}

interface OrderItem {
  dishId: string;
  dishName: string;
  quantity: number;
  price: string;
  specialInstructions?: string;
}

export default function CustomerMenu() {
  const [, params] = useRoute("/menu/:restaurantId");
  const restaurantId = params?.restaurantId;
  
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tableNumber, setTableNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedSize, setSelectedSize] = useState("large");
  const [extraCheese, setExtraCheese] = useState(false);
  const [arSupported, setArSupported] = useState(true);
  const [showARViewer, setShowARViewer] = useState(true);
  
  const { toast } = useToast();

  // Check AR support
  useEffect(() => {
    const checkARSupport = () => {
      // Check if model-viewer supports AR
      const supportsAR = 'xr' in navigator || 'getVRDisplays' in navigator;
      setArSupported(supportsAR);
      
      // For demo purposes, we'll show both AR and fallback based on user preference
      if (!supportsAR) {
        setShowARViewer(false);
      }
    };
    
    checkARSupport();
  }, []);

  // Fetch restaurant data
  const { data: restaurant, isLoading: loadingRestaurant, error: restaurantError } = useQuery({
    queryKey: ['/api/restaurants', restaurantId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/restaurants/${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // Fetch dishes for restaurant
  const { data: dishes = [], isLoading: loadingDishes, error: dishesError } = useQuery({
    queryKey: ['/api/dishes/restaurant', restaurantId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/dishes/restaurant/${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: `Your order for table ${tableNumber} has been sent to the kitchen.`,
      });
      setOrderItems([]);
      setTableNumber("");
      setSpecialInstructions("");
      setQuantity(1);
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentDish = dishes[currentDishIndex];
  const totalOrderValue = orderItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handlePreviousDish = () => {
    setCurrentDishIndex(prev => prev > 0 ? prev - 1 : dishes.length - 1);
    setQuantity(1);
    setSpecialInstructions("");
  };

  const handleNextDish = () => {
    setCurrentDishIndex(prev => prev < dishes.length - 1 ? prev + 1 : 0);
    setQuantity(1);
    setSpecialInstructions("");
  };

  const handleAddToOrder = () => {
    if (!currentDish || !tableNumber.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your table number before adding items to your order.",
        variant: "destructive",
      });
      return;
    }

    let price = parseFloat(currentDish.price);
    let instructions = specialInstructions.trim();
    
    // Add size pricing
    if (selectedSize === "family") {
      price += 8;
      instructions = instructions ? `${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} size, ${instructions}` : `${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} size`;
    } else if (selectedSize !== "large") {
      instructions = instructions ? `${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} size, ${instructions}` : `${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} size`;
    }
    
    // Add extra cheese note
    if (extraCheese) {
      instructions = instructions ? `${instructions}, Extra cheese` : "Extra cheese";
    }

    const newItem: OrderItem = {
      dishId: currentDish.id,
      dishName: currentDish.name,
      quantity,
      price: price.toFixed(2),
      specialInstructions: instructions || undefined,
    };

    setOrderItems(prev => [...prev, newItem]);
    
    toast({
      title: "Added to order",
      description: `${quantity}x ${currentDish.name} added to your order.`,
    });

    // Reset form
    setQuantity(1);
    setSpecialInstructions("");
    setSelectedSize("large");
    setExtraCheese(false);
  };

  const handlePlaceOrder = () => {
    if (!tableNumber.trim()) {
      toast({
        title: "Table number required",
        description: "Please enter your table number to place the order.",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Empty order",
        description: "Please add some items to your order first.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      restaurantId,
      tableNumber: tableNumber.trim(),
      items: orderItems,
      totalAmount: totalOrderValue.toFixed(2),
      specialInstructions: specialInstructions.trim() || undefined,
    };

    placeOrderMutation.mutate(orderData);
  };

  if (loadingRestaurant || loadingDishes) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (restaurantError || dishesError || !restaurant || !restaurant.isEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Restaurant Not Available</h2>
            <p className="text-muted-foreground">
              {restaurantError || dishesError ? 
                "Failed to load restaurant menu. Please try again later." :
                "This restaurant is currently not available for orders."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Menu Items Available</h2>
            <p className="text-muted-foreground">
              This restaurant doesn't have any dishes available right now.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="bg-card/80 navbar-blur border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
              alt={`${restaurant.name} logo`} 
              className="w-10 h-10 rounded-lg object-cover" 
            />
            <div>
              <h1 className="text-lg font-bold text-foreground font-serif" data-testid="text-restaurant-name">
                {restaurant.name}
              </h1>
              <p className="text-muted-foreground text-sm">AR Menu Experience</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative" data-testid="button-cart">
              <ShoppingCart className="w-5 h-5" />
              {orderItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center" data-testid="cart-count">
                  {orderItems.length}
                </span>
              )}
            </button>
            {tableNumber && (
              <Badge className="bg-primary text-primary-foreground" data-testid="badge-table">
                Table {tableNumber}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* AR/3D Dish Viewer */}
      <div className="relative h-96 bg-gradient-to-br from-primary/10 to-accent/10">
        {showARViewer ? (
          <ARViewer
            dish={currentDish}
            onARModeToggle={() => setShowARViewer(!showARViewer)}
            data-testid="ar-viewer"
          />
        ) : (
          <ThreeFallback
            dish={currentDish}
            onViewerToggle={() => setShowARViewer(!showARViewer)}
            data-testid="three-fallback"
          />
        )}
        
        {/* Viewer Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30"
            data-testid="button-rotate"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30"
            data-testid="button-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30"
            data-testid="button-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowARViewer(!showARViewer)}
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30"
            data-testid="button-toggle-viewer"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dish Navigation */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Menu Items</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground" data-testid="text-dish-counter">
              {currentDishIndex + 1} of {dishes.length}
            </span>
            <div className="flex space-x-1">
              {dishes.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentDishIndex(index)}
                  className={`w-2 h-2 rounded-full ${index === currentDishIndex ? 'bg-primary' : 'bg-muted'}`}
                  data-testid={`dot-${index}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Dish Slider */}
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {dishes.map((dish: Dish, index: number) => (
            <button
              key={dish.id}
              onClick={() => setCurrentDishIndex(index)}
              className={`flex-shrink-0 w-24 text-center ${index === currentDishIndex ? 'opacity-100' : 'opacity-60'}`}
              data-testid={`dish-thumbnail-${index}`}
            >
              <img 
                src={dish.image || "https://via.placeholder.com/80x60?text=Dish"} 
                alt={dish.name} 
                className={`w-20 h-16 rounded-lg object-cover mx-auto ${index === currentDishIndex ? 'border-2 border-primary' : 'border border-border'}`} 
              />
              <p className={`text-xs mt-1 font-medium ${index === currentDishIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                {dish.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Table Number Input (if not set) */}
      {!tableNumber && (
        <div className="p-4 bg-accent/20 border-b border-border">
          <div className="flex items-center space-x-3">
            <Label htmlFor="table" className="text-sm font-medium text-foreground">Table Number:</Label>
            <Input
              id="table"
              type="text"
              placeholder="Enter table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="flex-1 max-w-32"
              data-testid="input-table-number"
            />
          </div>
        </div>
      )}

      {/* Dish Details & Order Form */}
      <div className="p-6">
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm" data-testid="dish-details">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground font-serif" data-testid="text-dish-name">
                  {currentDish?.name}
                </h2>
                <p className="text-muted-foreground mt-1" data-testid="text-dish-description">
                  {currentDish?.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary" data-testid="text-dish-price">
                  ${currentDish?.price}
                </p>
                <p className="text-sm text-muted-foreground">{selectedSize}</p>
              </div>
            </div>

            {/* Ingredients */}
            {currentDish?.ingredients && currentDish.ingredients.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-2">Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {currentDish.ingredients.map((ingredient: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-muted text-muted-foreground" data-testid={`ingredient-${index}`}>
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Customization Options */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Customize Your Order</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Size</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize} data-testid="select-size">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (+$0)</SelectItem>
                      <SelectItem value="large">Large (+$0)</SelectItem>
                      <SelectItem value="family">Family (+$8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Extra Cheese</Label>
                  <input 
                    type="checkbox" 
                    checked={extraCheese}
                    onChange={(e) => setExtraCheese(e.target.checked)}
                    className="w-5 h-5 text-primary bg-input border-border rounded focus:ring-primary" 
                    data-testid="checkbox-extra-cheese"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Quantity</Label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 p-0"
                      data-testid="button-quantity-minus"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-foreground font-medium w-8 text-center" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                      data-testid="button-quantity-plus"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mb-6">
              <Label className="block text-foreground font-semibold mb-2">Special Instructions</Label>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="resize-none"
                rows={3}
                placeholder="Any special requests for your order..."
                data-testid="textarea-special-instructions"
              />
            </div>

            {/* Add to Order Button */}
            <Button 
              onClick={handleAddToOrder}
              className="w-full bg-primary text-primary-foreground py-4 text-lg font-semibold hover:bg-primary/90"
              data-testid="button-add-to-order"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add to Order - ${((parseFloat(currentDish?.price || "0") + (selectedSize === "family" ? 8 : 0)) * quantity).toFixed(2)}
            </Button>
          </CardContent>
        </Card>

        {/* Current Order Summary */}
        {orderItems.length > 0 && (
          <Card className="mt-6 shadow-lg border-0 bg-accent/10">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Your Order ({orderItems.length} items)
              </h3>
              <div className="space-y-2 mb-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm" data-testid={`order-item-${index}`}>
                    <div>
                      <span className="font-medium">{item.quantity}x {item.dishName}</span>
                      {item.specialInstructions && (
                        <p className="text-muted-foreground text-xs">{item.specialInstructions}</p>
                      )}
                    </div>
                    <span className="font-medium">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 mb-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span data-testid="text-order-total">${totalOrderValue.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handlePlaceOrder}
                disabled={placeOrderMutation.isPending || !tableNumber.trim()}
                className="w-full bg-chart-2 text-white hover:bg-chart-2/90 font-semibold"
                data-testid="button-place-order"
              >
                {placeOrderMutation.isPending ? "Placing Order..." : `Place Order - $${totalOrderValue.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 navbar-blur border-t border-border p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePreviousDish}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            data-testid="button-previous-dish"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Swipe or use arrows to browse</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleNextDish}
            className="flex items-center space-x-2 text-primary hover:text-primary/80"
            data-testid="button-next-dish"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
