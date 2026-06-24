import { useRef } from 'react';
import { DraggableTile } from './DraggableTile.jsx';

export function DropZone({ value, color, onDrop, label = '?' }) {
  const ref = useRef();

  // Use direct classList manipulation instead of useState to avoid
  // React re-renders during drag (which causes visual jitter)
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (value === null) ref.current?.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    // Only remove class if the pointer truly left the zone (not entered a child)
    if (!ref.current?.contains(e.relatedTarget)) {
      ref.current?.classList.remove('dragover');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    ref.current?.classList.remove('dragover');
    const num = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(num)) onDrop(num);
  };

  return (
    <div
      ref={ref}
      className={`drop-zone ${value !== null ? 'filled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {value !== null
        ? <DraggableTile value={value} color={color} disabled />
        : label
      }
    </div>
  );
}
