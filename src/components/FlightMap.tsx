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
  const isMapLoaded = useRef(false); // To track if map's style is loaded

  console.log("FlightMap.tsx: Component rendered. mapboxToken:", mapboxToken ? "Token present" : "Token missing");

  // Helper function to update map data sources
  const updateMapData = (mapInstance: mapboxgl.Map, currentFlights: Flight[]) => {
    if (!mapInstance || !isMapLoaded.current) {
      console.log("FlightMap.tsx: Skipping updateMapData - map not loaded or instance missing.");
      return; // Ensure map is loaded
    }

    console.log("FlightMap.tsx: Updating map data sources.");

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

    // Update data for existing sources
    (mapInstance.getSource('routes') as mapboxgl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: routeFeatures });
    (mapInstance.getSource('airports') as mapboxgl.GeoJSONSource)?.setData({ type: 'FeatureCollection', features: uniqueAirports });
  };

  // Effect 1: Initialize map and add static layers/handlers
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) {
      console.log("FlightMap.tsx: Map initialization skipped. Container or token missing.", { container: mapContainer.current, token: mapboxToken });
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
      isMapLoaded.current = true; // Mark map as loaded
      console.log("FlightMap.tsx: Map loaded successfully!");

      // Add initial empty sources and layers
      map.current?.addSource('routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current?.addLayer({
        id: 'routes',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#60a5fa', // Changed to a brighter blue
          'line-width': 4, // Made thicker
          'line-opacity': 0.8,
        },
      });

      map.current?.addSource('airports', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current?.addLayer({
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
      map.current?.on('click', 'routes', (e) => {
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

      map.current?.on('click', 'airports', (e) => {
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
      map.current?.on('mouseenter', 'routes', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current?.on('mouseleave', 'routes', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Call updateMapData immediately after map loads and sources are added
      // This ensures initial flights are drawn if available
      updateMapData(map.current, flights);
    });

    // Cleanup map on unmount
    return () => {
      console.log("FlightMap.tsx: Cleaning up map.");
      map.current?.remove();
      isMapLoaded.current = false;
    };
  }, [mapboxToken]); // Re-run only if mapboxToken changes

  // Effect 2: Update map data when flights change
  useEffect(() => {
    if (map.current && isMapLoaded.current) {
      console.log("FlightMap.tsx: Flights data changed, updating map.");
      updateMapData(map.current, flights);
    } else {
      console.log("FlightMap.tsx: Skipping flights data update. Map not ready.", { mapReady: !!map.current, isLoaded: isMapLoaded.current });
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