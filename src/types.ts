export interface Car {
  id: string;
  model: string;
  licensePlate: string;
  year: number;
  createdAt: string;
  ipvaDueDate: string | null;
  ipvaPaid: boolean;
  lastOilChangeDate: string | null;
  lastOilChangeKm: number | null;
}

export interface FuelEntry {
  id: string;
  carId: string;
  date: string;
  currentKm: number;
  liters: number;
  totalCost: number;
}

export interface MaintenanceRecord {
  id: string;
  carId: string;
  userId: string;
  date: string;
  location: string;
  issueDescription: string;
  cost: number;
  currentKm: number | null;
  notes: string | null;
  createdAt: string;
}

export interface MonthlyReport {
  totalCost: number;
  averageConsumption: number;
  costPerKm: number;
  totalKm: number;
  averageFuelPrice: number;
}

export interface City {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Technician {
  id: string;
  name: string;
  city_id: string | null;
  date: string;
  food_expense: number;
  fuel_expense: number;
  other_expense: number;
  accommodation_expense: number;
  service_orders: number;
  user_id: string;
  created_at: string;
}

export interface TechnicianConfig {
  id: string;
  service_order_value: number;
  user_id: string;
  created_at: string;
}

export interface TechnicianReport {
  totalExpenses: number;
  totalServiceOrders: number;
  totalRevenue: number;
  netProfit: number;
}

export interface TechnicianMonthlyReport {
  city: string;
  technicians: {
    name: string;
    date: string;
    expenses: {
      food: number;
      fuel: number;
      accommodation: number;
      other: number;
      total: number;
    };
    serviceOrders: number;
    revenue: number;
    profit: number;
  }[];
  totals: {
    expenses: number;
    serviceOrders: number;
    revenue: number;
    profit: number;
  };
}