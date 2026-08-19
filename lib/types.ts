export interface User {
  id: string;
  firstName: string;
  lastName: string;
  licenceNumber: string;
  cpcExpiry: string;
  phone: string;
  email: string;
  company: string;
  depotLocation: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  type: 'HGV' | 'LGV' | 'Artic' | 'Rigid' | 'Other';
  motExpiry: string;
  insuranceExpiry: string;
  tachoCalibration: string;
}

export interface DriveSession {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  date: string;
  notes: string;
}

export interface BreakSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  date: string;
  type: 'break' | 'rest' | 'weekly_rest';
}

export interface TachoRecord {
  id: string;
  userId: string;
  vehicleId: string;
  date: string;
  vehicleReg: string;
  driverName: string;
  startOdometer: string;
  endOdometer: string;
  notes: string;
  mode: 'driving' | 'other_work' | 'availability' | 'rest';
  createdAt: string;
  updatedAt: string;
}

export interface InfringementRecord {
  id: string;
  userId: string;
  vehicleId: string;
  infringementType: string;
  description: string;
  dateTime: string;
  location: string;
  driverName: string;
  vehicleReg: string;
  notes: string;
  signatureImage: string | null;
  printoutPhoto: string | null;
  status: 'draft' | 'completed' | 'exported';
  createdAt: string;
  updatedAt: string;
}

export interface ParkingStop {
  id: string;
  name: string;
  address: string;
  type: 'truck_stop' | 'secure_parking' | 'fuel_station' | 'services';
  facilities: string[];
  rating: number;
  reviewCount: number;
  isFavourite: boolean;
  lat?: number;
  lng?: number;
  phone?: string;
  notes?: string;
}

export interface DocRecord {
  id: string;
  userId: string;
  title: string;
  category: 'MOT' | 'Insurance' | 'Licence' | 'CPC' | 'Delivery Note' | 'Invoice' | 'Other';
  folder: string;
  fileUri: string | null;
  photoUri: string | null;
  expiryDate: string | null;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: 'Fuel' | 'Meals' | 'Parking' | 'Tolls' | 'Repairs' | 'Other';
  date: string;
  note: string;
  receiptUri: string | null;
  createdAt: string;
  receiptPhoto: string | null;
  receiptPhotoUrl: string | null;
  receiptUploadStatus: 'pending' | 'uploaded' | 'failed' | null;
  receiptCreatedAt: string | null;
}

export interface WalkaroundDefect {
  id: string;
  category: string;
  description: string;
  severity: 'minor' | 'major' | 'dangerous';
  photoUri: string | null;
  photoUploadStatus: 'pending' | 'uploaded' | 'failed' | null;
}

export interface WalkaroundCheck {
  id: string;
  userId: string;
  vehicleReg: string;
  date: string;
  checkType: 'pre-trip' | 'post-trip' | 'mid-journey';
  items: Record<string, 'pass' | 'fail' | 'na'>;
  defects: WalkaroundDefect[];
  overallResult: 'pass' | 'fail';
  signatureData: string | null;
  notes: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface DrivingActivity {
  id: string;
  userId: string;
  vehicleReg: string;
  status: 'driving' | 'other_work' | 'break' | 'rest' | 'idle';
  startedAt: string;
  endedAt: string | null;
  elapsed: number;
  breakNotifiedAt: string | null;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'walkaround' | 'expense' | 'document' | 'infringement' | 'tacho' | 'drive' | 'break' | 'activity';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retries: number;
  createdAt: string;
  lastAttempt: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  recommended?: boolean;
}

export interface UserSubscription {
  planId: string;
  status: 'active' | 'expired' | 'cancelled' | 'none';
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
}
