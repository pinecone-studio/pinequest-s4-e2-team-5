import "./CoinCounter.css";

export default function CoinCounter({ coins }) {
  return (
    <div className="coin-counter">
      🪙 {coins}
    </div>
  );
}