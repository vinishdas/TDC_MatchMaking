import { Customer } from '@/types';

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch('/api/customers');
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch customer');
  }
  return res.json();
}

export async function updateCustomerStatus(id: string, newStatus: Customer['statusTag']): Promise<Customer | null> {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statusTag: newStatus })
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateCustomerNotes(id: string, newNotes: string[]): Promise<Customer | null> {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: newNotes })
  });
  if (!res.ok) return null;
  return res.json();
}

// We removed the UI for "Add Client", but the function remains if needed by other systems.
export async function addCustomer(newCustomer: Customer): Promise<Customer> {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCustomer)
  });
  if (!res.ok) throw new Error('Failed to add customer');
  return res.json();
}
