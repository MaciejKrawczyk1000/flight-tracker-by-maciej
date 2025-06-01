import { Plane, MapPin, Activity } from "lucide-react";
import { Flight } from "@/pages/Index";

interface FlightStatsProps {
  flights: Flight[];
}

export const FlightStats = ({ flights }: FlightStatsProps) => {
  const totalFlights = flights.length;
  const totalDistance = flights.reduce((sum, flight) => sum + flight.distance, 0);
  
  // Calculate aircraft statistics (still needed for the count)
  const aircraftStats = flights.reduce((acc, flight) => {
    acc[flight.aircraft] = (acc[flight.aircraft] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {/* Total Flights */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">Total Flights</p>
            <p className="text-3xl font-bold">{totalFlights}</p>
          </div>
          <Plane className="w-8 h-8 text-blue-200" />
        </div>
      </div>

      {/* Total Distance */}
      <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-200 text-sm font-medium">Total Distance Flown</p>
            <p className="text-3xl font-bold">{totalDistance.toLocaleString()}</p>
            <p className="text-cyan-200 text-sm">miles</p>
          </div>
          <MapPin className="w-8 h-8 text-cyan-200" />
        </div>
      </div>

      {/* Aircraft Types */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm font-medium">Aircraft Types</p>
            <p className="text-3xl font-bold">{Object.keys(aircraftStats).length}</p>
          </div>
          <Activity className="w-8 h-8 text-purple-200" />
        </div>
      </div>
    </div>
  );
};