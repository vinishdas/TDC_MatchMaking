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

export async function GET() {
  try {
    const customers = readDB();
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newCustomer: Customer = await request.json();
    const customers = readDB();
    customers.unshift(newCustomer);
    writeDB(customers);
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write to database' }, { status: 500 });
  }
}
