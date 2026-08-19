export function fmtDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDateTime(d: string): string {
  return d ? `${fmtDate(d)} ${fmtTime(d)}` : '';
}

export function fmtDur(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

export function fmtGBP(n: number): string {
  return `\u00a3${n.toFixed(2)}`;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function weekStart(): Date {
  const d = new Date();
  const day = d.getDay();
  const off = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + off);
  m.setHours(0, 0, 0, 0);
  return m;
}

export function trunc(s: string, n: number): string {
  return !s ? '' : s.length > n ? s.slice(0, n) + '\u2026' : s;
}

export const INFRINGEMENT_TYPES = [
  'Exceeded daily driving limit',
  'Insufficient daily rest',
  'Insufficient weekly rest',
  'Break not taken (4.5h rule)',
  'Exceeded fortnightly driving limit',
  'Tacho card not inserted',
  'Tacho malfunction',
  'Manual entry error',
  'Working time directive breach',
  'Other',
];

export const EXPENSE_CATS = ['Fuel', 'Meals', 'Parking', 'Tolls', 'Repairs', 'Other'] as const;
export const DOC_CATS = ['MOT', 'Insurance', 'Licence', 'CPC', 'Delivery Note', 'Invoice', 'Other'] as const;

export const WALKAROUND_ITEMS = [
  { key: 'lights_front', label: 'Front Lights', cat: 'Lights' },
  { key: 'lights_rear', label: 'Rear Lights', cat: 'Lights' },
  { key: 'lights_indicators', label: 'Indicators', cat: 'Lights' },
  { key: 'lights_hazards', label: 'Hazard Lights', cat: 'Lights' },
  { key: 'tyres_condition', label: 'Tyre Condition', cat: 'Tyres & Wheels' },
  { key: 'tyres_pressure', label: 'Tyre Pressure', cat: 'Tyres & Wheels' },
  { key: 'tyres_tread', label: 'Tyre Tread Depth', cat: 'Tyres & Wheels' },
  { key: 'wheel_nuts', label: 'Wheel Nut Indicators', cat: 'Tyres & Wheels' },
  { key: 'brakes_service', label: 'Service Brake', cat: 'Brakes' },
  { key: 'brakes_parking', label: 'Parking Brake', cat: 'Brakes' },
  { key: 'fluid_oil', label: 'Engine Oil', cat: 'Fluids' },
  { key: 'fluid_coolant', label: 'Coolant Level', cat: 'Fluids' },
  { key: 'fluid_washer', label: 'Washer Fluid', cat: 'Fluids' },
  { key: 'mirrors', label: 'Mirrors & Glass', cat: 'Body & Cab' },
  { key: 'windscreen', label: 'Windscreen', cat: 'Body & Cab' },
  { key: 'wipers', label: 'Wipers', cat: 'Body & Cab' },
  { key: 'horn', label: 'Horn', cat: 'Body & Cab' },
  { key: 'body_damage', label: 'Body Damage', cat: 'Body & Cab' },
  { key: 'exhaust', label: 'Exhaust System', cat: 'Body & Cab' },
  { key: 'load_security', label: 'Load Security', cat: 'Load' },
  { key: 'trailer_coupling', label: 'Trailer Coupling', cat: 'Load' },
  { key: 'number_plates', label: 'Number Plates', cat: 'Legal' },
  { key: 'reflectors', label: 'Reflectors & Markers', cat: 'Legal' },
  { key: 'fire_extinguisher', label: 'Fire Extinguisher', cat: 'Safety' },
  { key: 'first_aid', label: 'First Aid Kit', cat: 'Safety' },
  { key: 'warning_triangle', label: 'Warning Triangle', cat: 'Safety' },
];

export const WALKAROUND_CATEGORIES = [...new Set(WALKAROUND_ITEMS.map(i => i.cat))];

export const DEFECT_CATEGORIES = [
  'Lights', 'Tyres', 'Brakes', 'Steering', 'Suspension',
  'Exhaust', 'Body Damage', 'Fluid Leak', 'Electrical', 'Load Security', 'Other',
];

export const LIMITS = {
  dailyDrive: 9 * 60,
  weeklyDrive: 56 * 60,
  fortnightDrive: 90 * 60,
  breakAfter: 270,
  minBreak: 45,
  dailyRest: 11 * 60,
  weeklyRest: 45 * 60,
};
