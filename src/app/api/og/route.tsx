import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const COLOR_PRESETS = [
  // 0. Clean Metallic Slate & White Gradient
  { bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)', text: '#ffffff', titleColor: '#38bdf8', badgeBg: '#0284c7', badgeText: '#ffffff' },
  // 1. Facebook Blue Gradient
  { bg: 'linear-gradient(135deg, #1877f2 0%, #0d47a1 50%, #0a192f 100%)', text: '#ffffff', titleColor: '#60a5fa', badgeBg: '#2563eb', badgeText: '#ffffff' },
  // 2. Spotify Green Gradient
  { bg: 'linear-gradient(135deg, #1db954 0%, #05461e 50%, #022c22 100%)', text: '#ffffff', titleColor: '#4ade80', badgeBg: '#16a34a', badgeText: '#ffffff' },
  // 3. Metallic Purple Gradient
  { bg: 'linear-gradient(135deg, #7e22ce 0%, #3b0764 50%, #0f0728 100%)', text: '#ffffff', titleColor: '#c084fc', badgeBg: '#9333ea', badgeText: '#ffffff' },
  // 4. Solar Flare Amber Gradient
  { bg: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 50%, #451a03 100%)', text: '#ffffff', titleColor: '#fbbf24', badgeBg: '#f59e0b', badgeText: '#0f172a' },
  // 5. Deep Cosmos Cyan Gradient
  { bg: 'linear-gradient(135deg, #0891b2 0%, #164e63 50%, #042f2e 100%)', text: '#ffffff', titleColor: '#22d3ee', badgeBg: '#06b6d4', badgeText: '#ffffff' },
  // 6. Crimson Nebula Gradient
  { bg: 'linear-gradient(135deg, #e11d48 0%, #881337 40%, #1e1b4b 100%)', text: '#ffffff', titleColor: '#fda4af', badgeBg: '#f43f5e', badgeText: '#ffffff' },
  // 7. Electric Violet Gradient
  { bg: 'linear-gradient(135deg, #4c1d95 0%, #2e1065 50%, #030712 100%)', text: '#ffffff', titleColor: '#a78bfa', badgeBg: '#7c3aed', badgeText: '#ffffff' },
  // 8. Aurora Emerald Gradient
  { bg: 'linear-gradient(135deg, #0d9488 0%, #115e59 50%, #022c22 100%)', text: '#ffffff', titleColor: '#2dd4bf', badgeBg: '#14b8a6', badgeText: '#ffffff' },
  // 9. Obsidian Gold Gradient
  { bg: 'linear-gradient(135deg, #b45309 0%, #451a03 50%, #020617 100%)', text: '#ffffff', titleColor: '#fde047', badgeBg: '#d97706', badgeText: '#ffffff' },
];

function getPresetIndex(title: string, presetParam: string | null): number {
  if (presetParam && !isNaN(parseInt(presetParam))) {
    const idx = parseInt(presetParam);
    return Math.abs(idx) % COLOR_PRESETS.length;
  }
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % COLOR_PRESETS.length;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Meteorit Indonesia';
    const description = searchParams.get('description') || 'Pusat Data & Informasi Antariksa, Meteorit, Komet & Sains Indonesia';
    const category = searchParams.get('category') || 'SAINS & ASTRONOMI';
    const presetParam = searchParams.get('preset');

    const presetIdx = getPresetIndex(title, presetParam);
    const preset = COLOR_PRESETS[presetIdx];

    const host = request.headers.get('host') || 'www.meteorit.my.id';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const logoUrl = `${protocol}://${host}/logo-meteor.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: preset.bg,
            padding: '48px 60px',
            fontFamily: 'sans-serif',
            color: preset.text,
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* Background Decorative Rings */}
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              right: '-120px',
              width: '450px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
              display: 'flex',
            }}
          />

          {/* Header Row: Logo Brand & Category Badge */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Logo Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Meteorit Indonesia Logo"
                width={54}
                height={54}
                style={{ borderRadius: '12px', objectFit: 'contain' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.05em', color: '#ffffff' }}>
                  METEORIT INDONESIA
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em' }}>
                  WWW.METEORIT.MY.ID
                </span>
              </div>
            </div>

            <div
              style={{
                background: preset.badgeBg,
                color: preset.badgeText,
                padding: '8px 20px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
              }}
            >
              {category}
            </div>
          </div>

          {/* Middle Body: Title & Excerpt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', marginBottom: '20px', maxWidth: '1080px' }}>
            <h1
              style={{
                fontSize: title.length > 60 ? '42px' : '52px',
                fontWeight: 900,
                lineHeight: 1.15,
                color: preset.titleColor,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: '22px',
                  fontWeight: 500,
                  color: '#cbd5e1',
                  lineHeight: 1.4,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Footer Bar: Watermark & Brand Promise */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              paddingTop: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🌌</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>
                Pusat Data & Informasi Astronomi Terpercaya
              </span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
              meteorit.my.id
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    );
  } catch (error: any) {
    console.error('[OG Image Generator] Error:', error);
    return new Response(`Failed to generate OpenGraph image: ${error.message}`, { status: 500 });
  }
}
