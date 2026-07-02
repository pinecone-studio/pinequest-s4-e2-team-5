import "./AnswerButton.css";

export default function AnswerButton({
    value,
    onClick
}){
    return(
        <button
            className="answer-button"
            onClick={()=>onClick(value)}
        >
            {value}
        </button>
    )
}