import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Flight } from '@/pages/Index';

interface FlightMapProps {
  flights: Flight[];
  mapboxToken: string;
}

export const FlightMap = ({ flights, mapboxToken }: FlightMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const isMapLoaded = useRef(false);
  const sourcesInitialized = useRef(false);
  const pendingFlights = useRef<Flight[]>([]);

  console.log("FlightMap.tsx: Component rendered. Flights count:", flights.length, "mapboxToken:", mapboxToken ? "Token present" : "Token missing");

  // Helper function to update map data sources
  const updateMapData = (mapInstance: mapboxgl.Map, currentFlights: Flight[]) => {
    if (!mapInstance || !isMapLoaded.current || !sourcesInitialized.current) {
      console.log("FlightMap.tsx: Skipping updateMapData - map not ready.", {
        mapInstance: !!mapInstance,
        isMapLoaded: isMapLoaded.current,
        sourcesInitialized: sourcesInitialized.current
      });
      // Store flights to update later when map is ready
      pendingFlights.current = currentFlights;
      return;
    }

    console.log("FlightMap.tsx: Updating map data sources with", currentFlights.length, "flights.");

    const routeFeatures = currentFlights.map((flight) => ({
      type: 'Feature' as const,
      properties: {
        flightId: flight.id,
        from: flight.from,
        to: flight.to,
        airline: flight.airline,
        aircraft: flight.aircraft,
        date: flight.date,
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: [flight.fromCoords, flight.toCoords],
      },
    }));

    const airportFeatures = currentFlights.flatMap(flight => [
      {
        type: 'Feature' as const,
        properties: {
          airport: flight.from,
          type: 'departure',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: flight.fromCoords,
        },
      },
      {
        type: 'Feature' as const,
        properties: {
          airport: flight.to,
          type: 'arrival',
        },
        geometry: {
          type: 'Point' as const,
          coordinates: flight.toCoords,
        },
      },
    ]);

    // Remove duplicate airports
    const uniqueAirports = airportFeatures.filter((airport, index, self) => 
      index === self.findIndex(a => 
        a.geometry.coordinates[0] === airport.geometry.coordinates[0] && 
        a.geometry.coordinates[1] === airport.geometry.coordinates[1]
      )
    );

    console.log("FlightMap.tsx: Route features:", routeFeatures.length, "Airport features:", uniqueAirports.length);

    // Update data for existing sources
    const routeSource = mapInstance.getSource('routes') as mapboxgl.GeoJSONSource;
    const airportSource = mapInstance.getSource('airports') as mapboxgl.GeoJSONSource;
    
    if (routeSource) {
      routeSource.setData({ type: 'FeatureCollection', features: routeFeatures });
      console.log("FlightMap.tsx: Updated routes source");
    } else {
      console.log("FlightMap.tsx: Routes source not found");
    }
    
    if (airportSource) {
      airportSource.setData({ type: 'FeatureCollection', features: uniqueAirports });
      console.log("FlightMap.tsx: Updated airports source");
    } else {
      console.log("FlightMap.tsx: Airports source not found");
    }

    // Clear pending flights since we've processed them
    pendingFlights.current = [];
  };

  // Helper function to initialize sources and layers
  const initializeSourcesAndLayers = (mapInstance: mapboxgl.Map) => {
    if (!mapInstance || sourcesInitialized.current) return;

    console.log("FlightMap.tsx: Initializing sources and layers");

    // Add initial empty sources
    mapInstance.addSource('routes', { 
      type: 'geojson', 
      data: { type: 'FeatureCollection', features: [] } 
    });
    
    mapInstance.addLayer({
      id: 'routes',
      type: 'line',
      source: 'routes',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#60a5fa',
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });

    mapInstance.addSource('airports', { 
      type: 'geojson', 
      data: { type: 'FeatureCollection', features: [] } 
    });
    
    mapInstance.addLayer({
      id: 'airports',
      type: 'circle',
      source: 'airports',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ef4444',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    // Add click handlers for popups (only once)
    mapInstance.on('click', 'routes', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const props = feature.properties;
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-bold text-lg">${props?.from} → ${props?.to}</h3>
              <p><strong>Airline:</strong> ${props?.airline}</p>
              <p><strong>Aircraft:</strong> ${props?.aircraft}</p>
              <p><strong>Date:</strong> ${new Date(props?.date).toLocaleDateString()}</p>
            </div>
          `)
          .addTo(mapInstance);
      }
    });

    mapInstance.on('click', 'airports', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const props = feature.properties;
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-bold text-lg">${props?.airport}</h3>
              <p>Airport</p>
            </div>
          `)
          .addTo(mapInstance);
      }
    });

    // Change cursor on hover (only once)
    mapInstance.on('mouseenter', 'routes', () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });

    mapInstance.on('mouseleave', 'routes', () => {
      mapInstance.getCanvas().style.cursor = '';
    });

    // Mark sources as initialized
    sourcesInitialized.current = true;
    console.log("FlightMap.tsx: Sources and layers initialized");

    // Process any pending flights
    if (pendingFlights.current.length > 0) {
      console.log("FlightMap.tsx: Processing pending flights:", pendingFlights.current.length);
      updateMapData(mapInstance, pendingFlights.current);
    }
  };

  // Effect 1: Initialize map and add static layers/handlers
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) {
      console.log("FlightMap.tsx: Map initialization skipped. Container or token missing.", { container: !!mapContainer.current, token: !!mapboxToken });
      return;
    }

    console.log("FlightMap.tsx: Attempting to initialize Mapbox map.");
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe' as any,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      isMapLoaded.current = true;
      console.log("FlightMap.tsx: Map loaded successfully!");

      if (!map.current) return;

      // Initialize sources and layers
      initializeSourcesAndLayers(map.current);
    });

    // Cleanup map on unmount
    return () => {
      console.log("FlightMap.tsx: Cleaning up map.");
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      isMapLoaded.current = false;
      sourcesInitialized.current = false;
      pendingFlights.current = [];
    };
  }, [mapboxToken]); // Re-run only if mapboxToken changes

  // Effect 2: Update map data when flights change
  useEffect(() => {
    console.log("FlightMap.tsx: Flights effect triggered. Flights count:", flights.length, "Map loaded:", isMapLoaded.current, "Sources initialized:", sourcesInitialized.current);
    
    if (map.current && isMapLoaded.current && sourcesInitialized.current) {
      console.log("FlightMap.tsx: Updating map with flights data.");
      updateMapData(map.current, flights);
    } else {
      console.log("FlightMap.tsx: Storing flights for later update. Map not ready.", { 
        mapReady: !!map.current, 
        isLoaded: isMapLoaded.current,
        sourcesReady: sourcesInitialized.current
      });
      // Store flights to update when map becomes ready
      pendingFlights.current = flights;
    }
  }, [flights]); // Re-run when flights change

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full h-96 rounded-lg overflow-hidden border border-slate-600"
      />
      {flights.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-lg">
          <p className="text-slate-300 text-lg">Add flights to see them on the map</p>
        </div>
      )}
    </div>
  );
};