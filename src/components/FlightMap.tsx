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

  console.log("FlightMap.tsx: Component rendered. Flights count:", flights.length, "mapboxToken:", mapboxToken ? "Token present" : "Token missing");

  // Helper function to update map data sources
  const updateMapData = (mapInstance: mapboxgl.Map, currentFlights: Flight[]) => {
    if (!mapInstance || !isMapLoaded.current || !sourcesInitialized.current) {
      console.log("FlightMap.tsx: Skipping updateMapData - map not ready.", {
        mapInstance: !!mapInstance,
        isMapLoaded: isMapLoaded.current,
        sourcesInitialized: sourcesInitialized.current
      });
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

      // Add initial empty sources and layers
      map.current.addSource('routes', { 
        type: 'geojson', 
        data: { type: 'FeatureCollection', features: [] } 
      });
      
      map.current.addLayer({
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

      map.current.addSource('airports', { 
        type: 'geojson', 
        data: { type: 'FeatureCollection', features: [] } 
      });
      
      map.current.addLayer({
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

      // Mark sources as initialized
      sourcesInitialized.current = true;
      console.log("FlightMap.tsx: Sources and layers initialized");

      // Add click handlers for popups (only once)
      map.current.on('click', 'routes', (e) => {
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
            .addTo(map.current!);
        }
      });

      map.current.on('click', 'airports', (e) => {
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
            .addTo(map.current!);
        }
      });

      // Change cursor on hover (only once)
      map.current.on('mouseenter', 'routes', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'routes', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Update map data immediately after sources are initialized
      console.log("FlightMap.tsx: Map loaded and sources initialized, updating with current flights:", flights.length);
      updateMapData(map.current, flights);
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
    };
  }, [mapboxToken]); // Re-run only if mapboxToken changes

  // Effect 2: Update map data when flights change
  useEffect(() => {
    console.log("FlightMap.tsx: Flights effect triggered. Flights count:", flights.length, "Map loaded:", isMapLoaded.current, "Sources initialized:", sourcesInitialized.current);
    
    if (map.current && isMapLoaded.current && sourcesInitialized.current) {
      console.log("FlightMap.tsx: Updating map with flights data.");
      updateMapData(map.current, flights);
    } else {
      console.log("FlightMap.tsx: Skipping flights data update. Map not ready.", { 
        mapReady: !!map.current, 
        isLoaded: isMapLoaded.current,
        sourcesReady: sourcesInitialized.current
      });
    }
  }, [flights]); // Re-run when flights change

  // Effect 3: Update map data when both map is ready and flights are available
  useEffect(() => {
    if (map.current && isMapLoaded.current && sourcesInitialized.current && flights.length > 0) {
      console.log("FlightMap.tsx: Both map and flights ready, ensuring data is displayed");
      updateMapData(map.current, flights);
    }
  }, [isMapLoaded.current, sourcesInitialized.current, flights]);

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