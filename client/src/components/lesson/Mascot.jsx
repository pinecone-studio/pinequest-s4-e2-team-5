export function Mascot({ content, mood = 'happy' }) {
  return (
    <div className="mascot-wrap">
      <div className={`mascot-figure ${mood === 'cheer' ? 'cheer' : ''}`}>
        🤖
      </div>
      <div className="mascot-bubble">{content}</div>
    </div>
  );
}
