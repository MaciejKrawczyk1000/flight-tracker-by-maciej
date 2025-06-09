import { useState, useEffect } from "react";
import { FlightForm } from "@/components/FlightForm";
import { FlightMap } from "@/components/FlightMap";
import { FlightStats } from "@/components/FlightStats";
import { FlightList } from "@/components/FlightList";
import { EditFlightDialog } from "@/components/EditFlightDialog";
import { Plane, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
const DEFAULT_MAPBOX_TOKEN = "pk.eyJ1IjoibWFjaWVqa3Jhd2N6eWsxMDAwIiwiYSI6ImNtYmNjOTdpYzFiZzUyb291NGxscmNoMGYifQ.Jo4lzJAv_d2r2eP5X7_QFw";

const Index = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [mapboxToken, setMapboxToken] = useState(DEFAULT_MAPBOX_TOKEN);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [showShareUrl, setShowShareUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load flights and mapbox token from localStorage on component mount
  useEffect(() => {
    // First, check if there's shared data in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    
    if (sharedData) {
      try {
        const decodedData = JSON.parse(atob(sharedData));
        if (decodedData.flights && Array.isArray(decodedData.flights)) {
          setFlights(decodedData.flights);
          toast.success("Shared flight data loaded successfully!");
          // Clear the URL parameters after loading
          window.history.replaceState({}, document.title, window.location.pathname);
          return; // Don't load from localStorage if we have shared data
        }
      } catch (error) {
        console.error("Error loading shared data:", error);
        toast.error("Failed to load shared flight data");
      }
    }

    // Load from localStorage if no shared data
    const savedFlights = localStorage.getItem(STORAGE_KEY);
    if (savedFlights) {
      try {
        setFlights(JSON.parse(savedFlights));
      } catch (error) {
        console.error("Error loading flights from localStorage:", error);
      }
    }

    // Check if there's a saved token, otherwise use the default
    const savedToken = localStorage.getItem(MAPBOX_TOKEN_KEY);
    if (savedToken) {
      setMapboxToken(savedToken);
      console.log("Index.tsx: Loaded Mapbox token from localStorage:", savedToken ? "Token loaded" : "No token found");
    } else {
      // Save the default token to localStorage for future use
      localStorage.setItem(MAPBOX_TOKEN_KEY, DEFAULT_MAPBOX_TOKEN);
      console.log("Index.tsx: Using default Mapbox token and saving to localStorage.");
    }
  }, []);

  // Save flights to localStorage whenever flights change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flights));
  }, [flights]);

  // Save mapbox token to localStorage whenever it changes
  useEffect(() => {
    if (mapboxToken) {
      localStorage.setItem(MAPBOX_TOKEN_KEY, mapboxToken);
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

  const generateShareUrl = () => {
    if (flights.length === 0) {
      toast.error("No flights to share! Add some flights first.");
      return;
    }

    try {
      const dataToShare = {
        flights: flights,
        timestamp: new Date().toISOString()
      };
      
      const encodedData = btoa(JSON.stringify(dataToShare));
      const baseUrl = window.location.origin + window.location.pathname;
      const url = `${baseUrl}?data=${encodedData}`;
      
      setShareUrl(url);
      setShowShareUrl(true);
      toast.success("Share link generated!");
    } catch (error) {
      console.error("Error generating share URL:", error);
      toast.error("Failed to generate share link");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy link");
    }
  };

  // Calculate aircraft statistics for the display
  const aircraftStats = flights.reduce((acc, flight) => {
    acc[flight.aircraft] = (acc[flight.aircraft] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort aircraft types by flight count (most to least), then alphabetically for ties
  const sortedAircraftStats = Object.entries(aircraftStats).sort(([aircraftA, countA], [aircraftB, countB]) => {
    // First sort by count (descending)
    if (countB !== countA) {
      return countB - countA;
    }
    // If counts are equal, sort alphabetically
    return aircraftA.localeCompare(aircraftB);
  });

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

        {/* Statistics Boxes */}
        <FlightStats flights={flights} />

        {/* Flight Map */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Flight Map</h2>
          <FlightMap flights={flights} mapboxToken={mapboxToken} />
        </div>

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

        {/* Share Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Share Your Flight Data</h3>
            <p className="text-slate-300 mb-6">
              Generate a shareable link that includes all your flight information for others to view.
            </p>
            
            <Button 
              onClick={generateShareUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white mb-4"
              disabled={flights.length === 0}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Generate Share Link
            </Button>

            {showShareUrl && (
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <p className="text-slate-300 text-sm mb-2">Share this link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="border-slate-500 text-slate-300 hover:bg-slate-600"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  Anyone with this link can view your flight data (read-only).
                </p>
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