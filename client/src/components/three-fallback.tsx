import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  glbModel?: string;
  usdzModel?: string;
  ingredients?: string[];
}

interface ThreeFallbackProps {
  dish: Dish;
  onViewerToggle?: () => void;
  "data-testid"?: string;
}

declare global {
  interface Window {
    THREE: any;
  }
}

export default function ThreeFallback({ dish, onViewerToggle, "data-testid": testId }: ThreeFallbackProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const animationRef = useRef<number>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(5);

  useEffect(() => {
    if (!mountRef.current || !window.THREE) {
      setError(true);
      setIsLoading(false);
      return;
    }

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new window.THREE.Scene();
    scene.background = new window.THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup
    const camera = new window.THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = zoom;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new window.THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new window.THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create fallback 3D object (since we can't easily load GLB without GLTFLoader)
    const createFallbackMesh = () => {
      const geometry = new window.THREE.BoxGeometry(2, 2, 2);
      const material = new window.THREE.MeshLambertMaterial({ 
        color: 0x8B5A2B, // Food-like brown color
        transparent: true,
        opacity: 0.9
      });
      
      // Add some detail with additional geometry
      const mesh = new window.THREE.Group();
      
      // Main body
      const mainMesh = new window.THREE.Mesh(geometry, material);
      mainMesh.castShadow = true;
      mainMesh.receiveShadow = true;
      mesh.add(mainMesh);
      
      // Add some "toppings" for visual interest
      const toppingGeometry = new window.THREE.SphereGeometry(0.3, 16, 16);
      const toppingMaterial = new window.THREE.MeshLambertMaterial({ 
        color: 0xFF6B6B 
      });
      
      for (let i = 0; i < 5; i++) {
        const topping = new window.THREE.Mesh(toppingGeometry, toppingMaterial);
        topping.position.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          1.2
        );
        topping.castShadow = true;
        mesh.add(topping);
      }

      return mesh;
    };

    const mesh = createFallbackMesh();
    scene.add(mesh);
    meshRef.current = mesh;

    // Add a platform/shadow catcher
    const planeGeometry = new window.THREE.PlaneGeometry(10, 10);
    const planeMaterial = new window.THREE.ShadowMaterial({ 
      opacity: 0.3 
    });
    const plane = new window.THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);

    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (meshRef.current) {
        meshRef.current.rotation.x = rotation.x;
        meshRef.current.rotation.y = rotation.y + Date.now() * 0.0005; // Auto-rotation
      }
      
      if (cameraRef.current) {
        cameraRef.current.position.z = zoom;
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [dish.id, rotation, zoom]);

  const handleRotateLeft = () => {
    setRotation(prev => ({ ...prev, y: prev.y - 0.5 }));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.max(2, prev - 1));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.min(10, prev + 1));
  };

  const handleReset = () => {
    setRotation({ x: 0, y: 0 });
    setZoom(5);
  };

  // Mouse interaction
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.buttons === 1 && mountRef.current) { // Left mouse button held
        const rect = mountRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        setRotation(prev => ({
          x: prev.x + (y - prev.x) * 0.1,
          y: prev.y + (x * Math.PI)
        }));
      }
    };

    const element = mountRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      return () => element.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  if (error || !window.THREE) {
    return (
      <div className="ar-viewer-placeholder h-full w-full flex items-center justify-center relative overflow-hidden" data-testid={testId}>
        <div className="text-center text-white z-10">
          <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
            <img 
              src={dish.image || "https://via.placeholder.com/128x128?text=Dish"} 
              alt={dish.name}
              className="w-24 h-24 rounded-xl object-cover"
            />
          </div>
          <h3 className="text-xl font-bold mb-2">{dish.name}</h3>
          <p className="text-white/80 mb-4">3D viewer not available</p>
          <Button 
            variant="secondary"
            onClick={onViewerToggle}
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30"
            data-testid="button-switch-to-ar"
          >
            <Camera className="w-4 h-4 mr-2" />
            Try AR View
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-testid={testId}>
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <div className="text-center text-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm">Loading 3D viewer...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {!isLoading && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button
            onClick={onViewerToggle}
            className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30 p-2"
            data-testid="button-switch-to-ar"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 3D Controls */}
      {!isLoading && (
        <div className="absolute bottom-20 left-4 right-4 flex justify-center space-x-2">
          <Button
            onClick={handleRotateLeft}
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30 p-2"
            data-testid="button-rotate-left"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleZoomIn}
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30 p-2"
            data-testid="button-zoom-in-three"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30 p-2"
            data-testid="button-zoom-out-three"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleReset}
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30 px-3 py-2 text-sm"
            data-testid="button-reset-view"
          >
            Reset
          </Button>
        </div>
      )}

      {/* Dish Info */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-lg">
            <h3 className="font-bold text-lg" data-testid="text-three-dish-name">{dish.name}</h3>
            <p className="text-white/80 text-sm">Drag to rotate • Use controls to zoom • 3D preview mode</p>
          </div>
        </div>
      )}
    </div>
  );
}
