import React, { useState, useRef } from "react";
import GameCanvas from "./components/GameCanvas";
import UIOverlay from "./components/UIOverlay";
import './index.css';

export default function App() {
  // Initialize with default HP values
  const [hpData, setHpData] = useState([
    { color: "blue", hp: 10 },
    { color: "red", hp: 10 },
  ]);
  
  const [skillsData, setSkillsData] = useState([
    { color: "blue", skills: { speedUp: {}, supersize: {} } },
    { color: "red", skills: { speedUp: {}, supersize: {} } },
  ]);
  
  const gameStateRef = useRef(null);

  const handleSkillUse = (color, skillName) => {
    console.log('Attempting to use skill:', skillName, 'for color:', color);
    
    if (gameStateRef.current) {
      const squares = gameStateRef.current.squares;
      console.log('Current squares:', squares);
      
      const square = squares.find(s => s.color.toLowerCase() === color.toLowerCase());
      console.log('Found square:', square);
      
      if (square) {
        if (skillName === 'speedup') {
          console.log('Activating speed up for', color);
          square.activateSpeedUp();
        } else if (skillName === 'supersize') {
          console.log('Activating supersize for', color);
          square.activateSupersize();
        }
      } else {
        console.warn('Square not found for color:', color);
      }
    } else {
      console.warn('GameState ref not available');
    }
  };

  const handleGameUpdate = (data) => {
    setHpData(data.hp);
    setSkillsData(data.skills);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <UIOverlay 
        hpData={hpData} 
        skillsData={skillsData}
        onSkillUse={handleSkillUse}
      />
      <GameCanvas 
        onUpdate={handleGameUpdate}
        ref={gameStateRef}
      />
    </div>
  );
}
