import "./LifeBar.css";

export default function LifeBar({ lives }) {
  return (
    <div className="life-bar">
      {Array.from({ length: lives }).map((_, i) => (
        <span key={i}>❤️</span>
      ))}
    </div>
  );
}