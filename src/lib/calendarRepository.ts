export interface ScheduledCall {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  time?: string;
}

// Mock database for scheduled calls
let scheduledCalls: ScheduledCall[] = [
  { id: 'call-1', customerId: 'TDC-49201', customerName: 'Eleanor Vance', date: new Date().toISOString() }
];

const MOCK_DELAY = 200;

export async function getScheduledCalls(): Promise<ScheduledCall[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...scheduledCalls]);
    }, MOCK_DELAY);
  });
}

export async function addScheduledCall(call: Omit<ScheduledCall, 'id'>): Promise<ScheduledCall> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCall = { ...call, id: `call-${Date.now()}` };
      scheduledCalls.push(newCall);
      resolve(newCall);
    }, MOCK_DELAY);
  });
}
