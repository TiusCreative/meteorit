import { NextResponse } from 'next/server';
import { getGlobalSettings, updateGlobalSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await getGlobalSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await updateGlobalSettings(body);
    if (result) {
      return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    }
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
