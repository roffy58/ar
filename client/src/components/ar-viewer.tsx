import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Maximize2 } from "lucide-react";

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

interface ARViewerProps {
  dish: Dish;
  onARModeToggle?: () => void;
  "data-testid"?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        loading?: string;
        reveal?: string;
        'environment-image'?: string;
        'exposure'?: string;
        'shadow-intensity'?: string;
        'shadow-softness'?: string;
        style?: React.CSSProperties;
        onLoad?: () => void;
        onError?: () => void;
      };
    }
  }
}

export default function ARViewer({ dish, onARModeToggle, "data-testid": testId }: ARViewerProps) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [arAvailable, setArAvailable] = useState(false);
  const modelViewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check if model-viewer and AR are supported
    const checkARSupport = async () => {
      try {
        // Wait for model-viewer to be loaded
        await customElements.whenDefined('model-viewer');
        
        // Check for AR support
        const modelViewer = modelViewerRef.current as any;
        if (modelViewer) {
          const arSupported = await modelViewer.canActivateAR;
          setArAvailable(arSupported);
        }
      } catch (error) {
        console.warn('AR support check failed:', error);
        setArAvailable(false);
      }
    };

    if (modelViewerRef.current) {
      checkARSupport();
    }
  }, [dish.id]);

  const handleModelLoad = () => {
    setModelLoaded(true);
    setModelError(false);
  };

  const handleModelError = () => {
    setModelError(true);
    setModelLoaded(false);
  };

  const handleARMode = () => {
    const modelViewer = modelViewerRef.current as any;
    if (modelViewer && arAvailable) {
      modelViewer.activateAR();
    }
  };

  // Fallback to placeholder if no 3D models
  if (!dish.glbModel && !dish.usdzModel) {
    return (
      <div className="ar-viewer-placeholder h-full w-full flex items-center justify-center relative overflow-hidden" data-testid={testId}>
        <div className="text-center text-white z-10">
          <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
            <img 
              src={dish.image || "https://via.placeholder.com/128x128?text=Dish"} 
              alt={dish.name}
              className="w-24 h-24 rounded-xl object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center"><svg class="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>';
              }}
            />
          </div>
          <h3 className="text-xl font-bold mb-2" data-testid="text-dish-name">{dish.name}</h3>
          <p className="text-white/80 mb-4">3D model not available</p>
          <Button 
            variant="secondary"
            className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30"
            data-testid="button-fallback-camera"
          >
            <Camera className="w-4 h-4 mr-2" />
            View Image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-testid={testId}>
      <model-viewer
        ref={modelViewerRef}
        src={dish.glbModel}
        ios-src={dish.usdzModel}
        alt={`3D model of ${dish.name}`}
        ar={true}
        ar-modes="webxr scene-viewer quick-look"
        camera-controls={true}
        auto-rotate={true}
        loading="lazy"
        reveal="interaction"
        environment-image="neutral"
        exposure="1"
        shadow-intensity="1"
        shadow-softness="0.5"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
        }}
        onLoad={handleModelLoad}
        onError={handleModelError}
      />

      {/* Loading Overlay */}
      {!modelLoaded && !modelError && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <div className="text-center text-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-sm">Loading 3D model...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {modelError && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <div className="text-center text-foreground">
            <div className="w-32 h-32 mx-auto mb-4 bg-muted/20 rounded-2xl flex items-center justify-center">
              <img 
                src={dish.image || "https://via.placeholder.com/128x128?text=Dish"} 
                alt={dish.name}
                className="w-24 h-24 rounded-xl object-cover"
              />
            </div>
            <h3 className="text-lg font-bold mb-2">{dish.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">3D model failed to load</p>
            <Button 
              variant="secondary"
              onClick={onARModeToggle}
              data-testid="button-switch-to-fallback"
            >
              Switch to 3D View
            </Button>
          </div>
        </div>
      )}

      {/* AR Mode Button */}
      {modelLoaded && arAvailable && (
        <Button
          onClick={handleARMode}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30"
          data-testid="button-ar-mode"
        >
          <Camera className="w-4 h-4 mr-2" />
          AR Mode
        </Button>
      )}

      {/* Viewer Toggle */}
      {modelLoaded && (
        <Button
          onClick={onARModeToggle}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30"
          data-testid="button-toggle-viewer"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      )}

      {/* Model Info Overlay */}
      {modelLoaded && (
        <div className="absolute bottom-16 left-4 right-4 text-center">
          <div className="bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-lg">
            <h3 className="font-bold text-lg" data-testid="text-ar-dish-name">{dish.name}</h3>
            <p className="text-white/80 text-sm">Drag to rotate • Pinch to zoom • Tap AR for immersive view</p>
          </div>
        </div>
      )}
    </div>
  );
}
