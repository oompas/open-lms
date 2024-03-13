import { MdCheck } from "react-icons/md"

export default function Checkbox({
    style,
    checked,
    setChecked,
    disabled
} : {
    style?: string,
    checked: boolean,
    setChecked?: any,
    disabled?: boolean
}) {
    return (
        <button 
            className={"flex items-center justify-center h-8 w-8 border-2 border-red-800 rounded-lg " + (style ? style : "") + (disabled ? " opacity-30" : "")}
            disabled={disabled}
            onClick={setChecked ? () => setChecked(!checked) : void(0)}
        >
            { checked ? <MdCheck size={28} color="rgb(153 27 27)"/> : null }
        </button>
    )
}