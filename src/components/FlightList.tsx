import { Button } from "@/components/ui/button";
import { Trash2, Plane, Edit } from "lucide-react";
import { Flight } from "@/pages/Index";

interface FlightListProps {
  flights: Flight[];
  onDeleteFlight: (id: string) => void;
  onEditFlight: (flight: Flight) => void;
}

export const FlightList = ({ flights, onDeleteFlight, onEditFlight }: FlightListProps) => {
  if (flights.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No flights recorded yet</p>
        <p className="text-sm">Add your first flight to get started</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    // Parse the date string directly without creating a Date object
    // to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString();
  };

  // Sort flights by date from most recent to oldest
  const sortedFlights = [...flights].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {sortedFlights.map((flight) => (
        <div 
          key={flight.id} 
          className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-white">
                  {flight.from} → {flight.to}
                </h3>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  {flight.distance.toLocaleString()} mi
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                <p><strong>Date:</strong> {formatDate(flight.date)}</p>
                <p><strong>Airline:</strong> {flight.airline}</p>
                <p className="col-span-2"><strong>Aircraft:</strong> {flight.aircraft}</p>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="default" // Changed to default variant
                size="sm"
                onClick={() => onEditFlight(flight)}
                className="bg-blue-600 hover:bg-blue-700 text-white" // Added blue styling
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteFlight(flight.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};