import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Customer } from '@/types';

const dbPath = path.join(process.cwd(), 'src', 'data', 'database.json');

const readDB = (): Customer[] => {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
};

const writeDB = (data: Customer[]) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const customers = readDB();
    const customer = customers.find(c => c.id === params.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const updates = await request.json();
    const customers = readDB();
    const index = customers.findIndex(c => c.id === params.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    customers[index] = { ...customers[index], ...updates };
    writeDB(customers);
    
    return NextResponse.json(customers[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
