import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuid } from 'uuid';
import type { User, Vehicle, DriveSession, BreakSession, TachoRecord, InfringementRecord, ParkingStop, DocRecord, Expense, WalkaroundCheck, DrivingActivity, SyncQueueItem, UserSubscription } from './types';

const K = {
  USER: '@tp_user',
  VEHICLE: '@tp_vehicle',
  DRIVES: '@tp_drives',
  BREAKS: '@tp_breaks',
  TACHO: '@tp_tacho',
  INF: '@tp_inf',
  PARK: '@tp_park',
  DOCS: '@tp_docs',
  EXP: '@tp_exp',
  WALK: '@tp_walk',
  ACTIVITY: '@tp_activity',
  SYNC_Q: '@tp_sync_q',
  SUB: '@tp_sub',
  AUTO_TRACK: '@tp_auto_track',
};

async function get<T>(k: string, fb: T): Promise<T> {
  try { const r = await AsyncStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
async function set(k: string, v: any) { await AsyncStorage.setItem(k, JSON.stringify(v)); }

export const id = () => uuid();

export const getUser = () => get<User | null>(K.USER, null);
export const saveUser = (u: User) => set(K.USER, u);

export const getVehicle = () => get<Vehicle | null>(K.VEHICLE, null);
export const saveVehicle = (v: Vehicle) => set(K.VEHICLE, v);

export const getDrives = () => get<DriveSession[]>(K.DRIVES, []);
export const saveDrive = async (s: DriveSession) => {
  const a = await getDrives(); const i = a.findIndex(x => x.id === s.id);
  if (i >= 0) a[i] = s; else a.unshift(s); await set(K.DRIVES, a);
};

export const getBreaks = () => get<BreakSession[]>(K.BREAKS, []);
export const saveBreak = async (s: BreakSession) => {
  const a = await getBreaks(); const i = a.findIndex(x => x.id === s.id);
  if (i >= 0) a[i] = s; else a.unshift(s); await set(K.BREAKS, a);
};

export const getTachos = () => get<TachoRecord[]>(K.TACHO, []);
export const saveTacho = async (r: TachoRecord) => {
  const a = await getTachos(); const i = a.findIndex(x => x.id === r.id);
  if (i >= 0) a[i] = r; else a.unshift(r); await set(K.TACHO, a);
};
export const delTacho = async (rid: string) => { const a = await getTachos(); await set(K.TACHO, a.filter(x => x.id !== rid)); };

export const getInfs = () => get<InfringementRecord[]>(K.INF, []);
export const saveInf = async (r: InfringementRecord) => {
  const a = await getInfs(); const i = a.findIndex(x => x.id === r.id);
  if (i >= 0) a[i] = r; else a.unshift(r); await set(K.INF, a);
};
export const delInf = async (rid: string) => { const a = await getInfs(); await set(K.INF, a.filter(x => x.id !== rid)); };

export const getParks = () => get<ParkingStop[]>(K.PARK, []);
export const saveParks = (s: ParkingStop[]) => set(K.PARK, s);
export const toggleFav = async (pid: string) => {
  const a = await getParks(); const i = a.findIndex(x => x.id === pid);
  if (i >= 0) { a[i].isFavourite = !a[i].isFavourite; await set(K.PARK, a); }
};

export const getDocs = () => get<DocRecord[]>(K.DOCS, []);
export const saveDoc = async (d: DocRecord) => {
  const a = await getDocs(); const i = a.findIndex(x => x.id === d.id);
  if (i >= 0) a[i] = d; else a.unshift(d); await set(K.DOCS, a);
};
export const delDoc = async (did: string) => { const a = await getDocs(); await set(K.DOCS, a.filter(x => x.id !== did)); };

export const getExps = () => get<Expense[]>(K.EXP, []);
export const saveExp = async (e: Expense) => {
  const a = await getExps(); const i = a.findIndex(x => x.id === e.id);
  if (i >= 0) a[i] = e; else a.unshift(e); await set(K.EXP, a);
};
export const delExp = async (eid: string) => { const a = await getExps(); await set(K.EXP, a.filter(x => x.id !== eid)); };

// Walkaround checks
export const getWalkarounds = () => get<WalkaroundCheck[]>(K.WALK, []);
export const saveWalkaround = async (w: WalkaroundCheck) => {
  const a = await getWalkarounds(); const i = a.findIndex(x => x.id === w.id);
  if (i >= 0) a[i] = w; else a.unshift(w); await set(K.WALK, a);
  await addToSyncQueue('walkaround', w.id, i >= 0 ? 'update' : 'create', w);
};
export const delWalkaround = async (wid: string) => {
  const a = await getWalkarounds(); await set(K.WALK, a.filter(x => x.id !== wid));
};

// Driving activity
export const getActivity = () => get<DrivingActivity | null>(K.ACTIVITY, null);
export const saveActivity = async (a: DrivingActivity) => {
  await set(K.ACTIVITY, a);
  await addToSyncQueue('activity', a.id, 'update', a);
};
export const clearActivity = async () => await AsyncStorage.removeItem(K.ACTIVITY);

// Sync queue
export const getSyncQueue = () => get<SyncQueueItem[]>(K.SYNC_Q, []);
export const addToSyncQueue = async (entityType: SyncQueueItem['entityType'], entityId: string, action: SyncQueueItem['action'], payload: any) => {
  const q = await getSyncQueue();
  const existing = q.findIndex(x => x.entityId === entityId && x.entityType === entityType);
  const item: SyncQueueItem = {
    id: existing >= 0 ? q[existing].id : uuid(),
    entityType, entityId, action,
    payload: JSON.stringify(payload),
    status: 'pending', retries: 0,
    createdAt: existing >= 0 ? q[existing].createdAt : new Date().toISOString(),
    lastAttempt: null,
  };
  if (existing >= 0) q[existing] = item; else q.push(item);
  await set(K.SYNC_Q, q);
};
export const clearSyncedItems = async () => {
  const q = await getSyncQueue();
  await set(K.SYNC_Q, q.filter(x => x.status !== 'synced'));
};
export const getSyncQueueCount = async () => {
  const q = await getSyncQueue();
  return { pending: q.filter(x => x.status === 'pending').length, failed: q.filter(x => x.status === 'failed').length, total: q.length };
};

// Auto-tracking preference
export const getAutoTrack = () => get<boolean>(K.AUTO_TRACK, false);
export const saveAutoTrack = (v: boolean) => set(K.AUTO_TRACK, v);

// Subscription
export const getSubscription = () => get<UserSubscription>(K.SUB, { planId: '', status: 'none', startDate: null, endDate: null, autoRenew: false });
export const saveSubscription = (s: UserSubscription) => set(K.SUB, s);

export async function seedParks() {
  const a = await getParks();
  if (a.length > 0) return;
  const stops: ParkingStop[] = [
    { id: uuid(), name: 'Truckhaven \u2013 Markham Moor', address: 'A1/A57 Junction, Retford DN22 0QU', type: 'truck_stop', facilities: ['Parking','Showers','Toilets','Food','WiFi','Security'], rating: 4.2, reviewCount: 156, isFavourite: false },
    { id: uuid(), name: 'Lymm Truck Stop', address: 'Warrington Rd, Lymm WA13 0AQ', type: 'truck_stop', facilities: ['Parking','Showers','Toilets','Food','Fuel','Security'], rating: 3.8, reviewCount: 89, isFavourite: false },
    { id: uuid(), name: 'Ashford International Truckstop', address: 'Waterbrook Ave, Ashford TN24 0GB', type: 'secure_parking', facilities: ['Parking','Showers','Toilets','Food','Fuel','Security','CCTV','Fenced'], rating: 4.5, reviewCount: 234, isFavourite: true },
    { id: uuid(), name: 'Red Lion Truckstop', address: 'London Rd, Northampton NN7 3HD', type: 'truck_stop', facilities: ['Parking','Toilets','Food'], rating: 3.2, reviewCount: 67, isFavourite: false },
    { id: uuid(), name: 'BP Truckstop \u2013 Ferrybridge', address: 'A1/M62 Junction, Ferrybridge WF11 8JZ', type: 'fuel_station', facilities: ['Fuel','Parking','Toilets','Food','WiFi'], rating: 3.9, reviewCount: 112, isFavourite: false },
    { id: uuid(), name: 'Moto Donington Park', address: 'M1 J23A-24, Castle Donington DE74 2TN', type: 'services', facilities: ['Fuel','Parking','Toilets','Food','Showers','WiFi'], rating: 3.6, reviewCount: 198, isFavourite: false },
    { id: uuid(), name: 'Magna Park Truckstop', address: 'Magna Park, Lutterworth LE17 4XN', type: 'secure_parking', facilities: ['Parking','Security','CCTV','Fenced','Toilets'], rating: 4.0, reviewCount: 78, isFavourite: false },
    { id: uuid(), name: 'Hartshead Moor Services', address: 'M62, Brighouse HD6 4JX', type: 'services', facilities: ['Fuel','Parking','Toilets','Food'], rating: 3.1, reviewCount: 145, isFavourite: false },
  ];
  await saveParks(stops);
}
