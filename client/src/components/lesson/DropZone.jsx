import { useState } from 'react';
import { DraggableTile } from './DraggableTile.jsx';

export function DropZone({ value, color, onDrop, label = '?' }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`drop-zone ${value !== null ? 'filled' : ''} ${over && value === null ? 'dragover' : ''}`}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const num = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(num)) onDrop(num);
      }}
    >
      {value !== null
        ? <DraggableTile value={value} color={color} disabled />
        : label
      }
    </div>
  );
}
