import "./ProgressBar.css";

export default function ProgressBar({ current, total }) {
  const percent = total === 0 ? 0 : (current / total) * 100;

  return (
    <div className="progress-wrapper">
      <div
        className="progress-fill"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}