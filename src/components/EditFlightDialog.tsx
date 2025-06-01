import { useState, useEffect } => from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plane } from "lucide-react";
import { toast } from "sonner";
import { Flight } from "@/pages/Index";

interface EditFlightDialogProps {
  flight: Flight | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (flight: Flight) => void;
}

// Popular airports with coordinates and city names
const airports = {
  "ATL": { name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", coords: [-84.4281, 33.6407] as [number, number] },
  "CDG": { name: "Paris Charles de Gaulle Airport", city: "Paris", coords: [2.5479, 49.0097] as [number, number] },
  "CPT": { name: "Cape Town International Airport", city: "Cape Town", coords: [18.6017, -33.9649] as [number, number] },
  "CUN": { name: "Cancun International Airport", city: "Cancun", coords: [-86.8770, 21.0366] as [number, number] },
  "DXB": { name: "Dubai International Airport", city: "Dubai", coords: [55.3644, 25.2532] as [number, number] },
  "FRA": { name: "Frankfurt Airport", city: "Frankfurt", coords: [8.5622, 50.0379] as [number, number] },
  "JFK": { name: "John F. Kennedy International Airport", city: "New York", coords: [-73.7781, 40.6413] as [number, number] },
  "LAX": { name: "Los Angeles International Airport", city: "Los Angeles", coords: [-118.4081, 33.9425] as [number, number] },
  "LHR": { name: "London Heathrow Airport", city: "London", coords: [-0.4543, 51.4700] as [number, number] },
  "MAD": { name: "Madrid-Barajas Adolfo Suárez Airport", city: "Madrid", coords: [-3.5679, 40.4719] as [number, number] },
  "MDW": { name: "Chicago Midway International Airport", city: "Chicago", coords: [-87.7524, 41.7868] as [number, number] },
  "NRT": { name: "Narita International Airport", city: "Tokyo", coords: [140.3929, 35.7720] as [number, number] },
  "ORD": { name: "Chicago O'Hare International Airport", city: "Chicago", coords: [-87.9073, 41.9742] as [number, number] },
  "SIN": { name: "Singapore Changi Airport", city: "Singapore", coords: [103.9915, 1.3644] as [number, number] },
  "SYD": { name: "Sydney Kingsford Smith Airport", city: "Sydney", coords: [151.1772, -33.9399] as [number, number] },
  "TPA": { name: "Tampa International Airport", city: "Tampa", coords: [-82.5332, 27.9755] as [number, number] },
  "YYZ": { name: "Toronto Pearson International Airport", city: "Toronto", coords: [-79.6248, 43.6777] as [number, number] },
};

// Common aircraft types
const aircraftTypes = [
  "Boeing 707", "Boeing 717", "Boeing 727", "Boeing 737", "Boeing 737 MAX", "Boeing 747", "Boeing 757", "Boeing 767", "Boeing 777", "Boeing 787-8 Dreamliner", "Boeing 787-9 Dreamliner", "Boeing 787-10 Dreamliner",
  "Airbus A220", "Airbus A300", "Airbus A310", "Airbus A318", "Airbus A319", "Airbus A320", "Airbus A320neo", "Airbus A321", "Airbus A321neo", "Airbus A330", "Airbus A330neo", "Airbus A340", "Airbus A350 XWB", "Airbus A350-10", "Airbus A380",
  "Embraer E170", "Embraer E175", "Embraer E190", "Embraer E195", "Embraer E2 Series",
  "Bombardier CRJ200", "Bombardier CRJ700", "Bombardier CRJ900", "Bombardier CRJ1000",
  "ATR 42", "ATR 72",
  "Fokker 70", "Fokker 100",
  "Saab 340", "Saab 2000",
  "De Havilland Canada Dash 8",
  "McDonnell Douglas MD-80", "McDonnell Douglas MD-90", "McDonnell Douglas MD-11",
  "Concorde"
];

export const EditFlightDialog = ({ flight, isOpen, onClose, onSave }: EditFlightDialogProps) => {
  const [formData, setFormData] = useState({
    from: flight?.from || "",
    to: flight?.to || "",
    date: flight?.date || "",
    aircraft: flight?.aircraft || "",
    airline: flight?.airline || "",
  });

  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to || !formData.date || !formData.aircraft || !formData.airline) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.from === formData.to) {
      toast.error("Departure and arrival airports cannot be the same");
      return;
    }

    const fromAirport = airports[formData.from as keyof typeof airports];
    const toAirport = airports[formData.to as keyof typeof airports];

    if (!fromAirport || !toAirport) {
      toast.error("Please select valid airports");
      return;
    }

    const distance = calculateDistance(fromAirport.coords, toAirport.coords);

    const updatedFlight: Flight = {
      ...flight!,
      from: formData.from,
      to: formData.to,
      fromCoords: fromAirport.coords,
      toCoords: toAirport.coords,
      date: formData.date,
      aircraft: formData.aircraft,
      airline: formData.airline,
      distance,
    };

    onSave(updatedFlight);
    onClose();
    toast.success("Flight updated successfully!");
  };

  // Update form data when flight prop changes
  useEffect(() => {
    if (flight) {
      setFormData({
        from: flight.from,
        to: flight.to,
        date: flight.date,
        aircraft: flight.aircraft,
        airline: flight.airline,
      });
    }
  }, [flight]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Flight</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-from" className="text-slate-200">From</Label>
              <select
                id="edit-from"
                value={formData.from}
                onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select city</option>
                {Object.entries(airports)
                  .sort(([, infoA], [, infoB]) => infoA.city.localeCompare(infoB.city))
                  .map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.city} ({code})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="edit-to" className="text-slate-200">To</Label>
              <select
                id="edit-to"
                value={formData.to}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select city</option>
                {Object.entries(airports)
                  .sort(([, infoA], [, infoB]) => infoA.city.localeCompare(infoB.city))
                  .map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.city} ({code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-date" className="text-slate-200">Date</Label>
            <Input
              type="date"
              id="edit-date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1 bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="edit-aircraft" className="text-slate-200">Aircraft</Label>
            <select
              id="edit-aircraft"
              value={formData.aircraft}
              onChange={(e) => setFormData(prev => ({ ...prev, aircraft: e.target.value }))}
              className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select aircraft type</option>
              {aircraftTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="edit-airline" className="text-slate-200">Airline</Label>
            <Input
              type="text"
              id="edit-airline"
              placeholder="e.g., American Airlines"
              value={formData.airline}
              onChange={(e) => setFormData(prev => ({ ...prev, airline: e.target.value }))}
              className="mt-1 bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              <Plane className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button type="button" variant="destructive" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};