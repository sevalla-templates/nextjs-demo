import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Load ticker-CIK mapping
    const tickerPath = path.join(process.cwd(), 'src', 'data', 'company_tickers.json');
    const tickerData = JSON.parse(await readFile(tickerPath, 'utf-8'));
    
    return NextResponse.json(tickerData);
  } catch (error) {
    console.error('Error loading ticker data:', error);
    return NextResponse.json({}, { status: 200 }); // Return empty object if file doesn't exist
  }
}
