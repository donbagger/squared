import React, { memo } from 'react';

const UIOverlay = memo(({ hpData }) => {
  // Ensure we have valid HP data with fallbacks
  const blueHP = hpData?.find(data => data.color.toLowerCase() === "blue")?.hp ?? 10;
  const redHP = hpData?.find(data => data.color.toLowerCase() === "red")?.hp ?? 10;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      color: 'white',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '8px',
      margin: '10px'
    }}>
      {/* Blue Box HP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ 
          color: 'blue', 
          fontWeight: 'bold', 
          minWidth: '100px',
          fontSize: '18px'
        }}>
          BLUE HP: {blueHP}
        </span>
      </div>

      {/* Red Box HP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ 
          color: 'red', 
          fontWeight: 'bold', 
          minWidth: '100px', 
          textAlign: 'right',
          fontSize: '18px'
        }}>
          RED HP: {redHP}
        </span>
      </div>
    </div>
  );
});

export default UIOverlay;
