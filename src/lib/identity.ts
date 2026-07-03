// ============================================================================
// Device identity — a self-declared phone number + name kept in localStorage.
//
// There is no SMS/OTP provider wired into this project, so the phone number is
// NOT verified; it simply acts as a stable user id that ties every ticket from
// this device together, and lets a returning citizen reuse their name and look
// up past complaints. (Swap point: add OTP verification here if a provider is
// introduced later.)
// ============================================================================

const KEY = 'adhikar.identity.v1';

export interface DeviceIdentity {
  phone: string;
  name: string;
}

export function getDeviceIdentity(): DeviceIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceIdentity>;
    if (!parsed || !parsed.phone) return null;
    return { phone: parsed.phone, name: parsed.name || '' };
  } catch {
    return null;
  }
}

export function saveDeviceIdentity(id: DeviceIdentity): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(id));
  } catch {
    /* storage unavailable (private mode) — flow still works for this session */
  }
}

// Update just the stored name (used when a returning citizen picks a new name).
export function updateStoredName(name: string): void {
  const cur = getDeviceIdentity();
  if (cur) saveDeviceIdentity({ ...cur, name });
}

// Keep only the digits of whatever the citizen typed, so a variety of formats
// (+91, spaces, dashes) normalise to a single comparable id.
export function normalizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}
