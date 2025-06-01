import { useState, useEffect } from "react";
import { FlightForm } from "@/components/FlightForm";
import { FlightMap } from "@/components/FlightMap";
import { FlightStats } from "@/components/FlightStats";
import { FlightList } from "@/components/FlightList";
import { EditFlightDialog } from "@/components/EditFlightDialog";
import { Plane } from "lucide-react";
// Removed recharts imports as they are no longer needed for this section
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface Flight {
  id: string;
  from: string;
  to: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  date: string;
  aircraft: string;
  airline: string;
  distance: number;
}

const STORAGE_KEY = "flight-tracker-flights";
const MAPBOX_TOKEN_KEY = "flight-tracker-mapbox-token";

const Index = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [mapboxToken, setMapboxToken] = useState("");
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load flights and mapbox token from localStorage on component mount
  useEffect(() => {
    const savedFlights = localStorage.getItem(STORAGE_KEY);
    if (savedFlights) {
      try {
        setFlights(JSON.parse(savedFlights));
      } catch (error) {
        console.error("Error loading flights from localStorage:", error);
      }
    }

    const savedToken = localStorage.getItem(MAPBOX_TOKEN_KEY); // Corrected variable name
    if (savedToken) {
      setMapboxToken(savedToken);
      console.log("Index.tsx: Loaded Mapbox token from localStorage:", savedToken ? "Token loaded" : "No token found");
    } else {
      console.log("Index.tsx: No Mapbox token found in localStorage on mount.");
    }
  }, []);

  // Save flights to localStorage whenever flights change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
  }, [flights]);

  // Save mapbox token to localStorage whenever it changes
  useEffect(() => {
    if (mapboxToken) {
      localStorage.setItem(MAPBOX_TOKEN_KEY, mapboxToken); // Corrected variable name
      console.log("Index.tsx: Mapbox token updated and saved to localStorage.");
    }
  }, [mapboxToken]);

  const addFlight = (flight: Omit<Flight, "id">) => {
    const newFlight = {
      ...flight,
      id: Date.now().toString(),
    };
    setFlights(prev => [...prev, newFlight]);
  };

  const deleteFlight = (id: string) => {
    setFlights(prev => prev.filter(flight => flight.id !== id));
  };

  const handleEditFlight = (flight: Flight) => {
    setEditingFlight(flight);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedFlight: Flight) => {
    setFlights(prev => prev.map(flight => 
      flight.id === updatedFlight.id ? updatedFlight : flight
    ));
    setEditingFlight(null);
  };

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false);
    setEditingFlight(null);
  };

  // Calculate aircraft statistics for the display
  const aircraftStats = flights.reduce((acc, flight) => {
    acc[flight.aircraft] = (acc[flight.aircraft] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort aircraft types alphabetically for consistent display
  const sortedAircraftStats = Object.entries(aircraftStats).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Plane className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent leading-tight">
              Flight Tracker
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            Track your aviation journey and explore your flight history.
          </p>
        </div>

        {/* Mapbox Token Input */}
        {!mapboxToken && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Setup Required</h3>
            <p className="text-slate-300 mb-4">
              Please enter your Mapbox public token to enable the interactive map. 
              You can get one for free at{" "}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                mapbox.com
              </a>
            </p>
            <input
              type="text"
              placeholder="Enter your Mapbox public token (pk.eyJ...)"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Statistics Boxes */}
        <FlightStats flights={flights} />

        {/* Flight Map */}
        {mapboxToken && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Flight Map</h2>
            <FlightMap flights={flights} mapboxToken={mapboxToken} />
          </div>
        )}

        {/* Main Content Grid - Flight Form and Flight List */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Flight Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-6">Add New Flight</h2>
            <FlightForm onAddFlight={addFlight} />
          </div>

          {/* Flight List */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-6">Flight History</h2>
            <FlightList 
              flights={flights} 
              onDeleteFlight={deleteFlight}
              onEditFlight={handleEditFlight}
            />
          </div>
        </div>

        {/* Aircraft Breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Aircraft Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            {flights.length === 0 ? (
              <div className="text-slate-400 text-lg">
                Enter flight data to see aircraft breakdown.
              </div>
            ) : (
              <div className="w-full max-h-full overflow-y-auto text-left space-y-2">
                {sortedAircraftStats.map(([aircraft, count]) => (
                  <div key={aircraft} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                    <span className="text-slate-200 font-medium">{aircraft}</span>
                    <span className="text-blue-400 font-bold text-lg">
                      Flown {count} {count === 1 ? "Time" : "Times"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Flight Dialog */}
        <EditFlightDialog
          flight={editingFlight}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
};

export default Index;