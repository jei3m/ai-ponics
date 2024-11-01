import React from 'react';

const EmailTemplate = ({ temperature }) => (
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Temperature Alert</title>
    </head>
    <body style={{ margin: 0, padding: 0, backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '32px 24px', backgroundColor: '#ffffff' }}>
        <div style={{ borderBottom: '2px solid #38a169', paddingBottom: 16, marginBottom: 24 }}>
          <h1 style={{ color: '#38a169', fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', margin: 0 }}>Temperature Monitor</h1>
          <div style={{ display: 'inline-block', backgroundColor: '#f0fff4', color: '#38a169', padding: '4px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, marginTop: 8 }}>Critical Alert</div>
        </div>

        <div style={{ fontSize: 48, fontWeight: 700, color: '#38a169', margin: '24px 0', fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums' }}>
          {temperature}°C
        </div>

        <div style={{ color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
          <p>AI-Ponics has detected high temperature within your system!</p>
        </div>

        <div style={{ backgroundColor: '#f0fff4', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>Above Critical Threshold</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>Time Detected</div>
            <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>{new Date().toLocaleString()}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>Required Action</div>
            <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>Immediate Inspection Required</div>
          </div>
        </div>

        <div style={{ color: '#374151', lineHeight: 1.6, marginBottom: 24 }}>
          <p>Recommended actions:</p>
          <ul style={{ paddingLeft: 20, margin: '12px 0' }}>
            <li>Make sure the area is well ventilated</li>
            <li>Move to a different area with lower room temperature</li>
            <li>Monitor for additional fluctuations</li>
          </ul>
        </div>

        <div style={{ color: '#6b7280', fontSize: 13, borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 32 }}>
          <p>This is an automated alert from your monitoring system. Do not reply to this email.</p>
        </div>
      </div>
    </body>
  </html>
);

export default EmailTemplate;