import { MdCheck } from "react-icons/md"

export default function Checkbox({
    style,
    checked,
    setChecked
} : {
    style?: string,
    checked: boolean,
    setChecked: any
}) {
    return (
        <button 
            className="flex items-center justify-center h-8 w-8 border-2 border-red-800 rounded-lg"
            onClick={() => setChecked(!checked)}
        >
            { checked ? <MdCheck size={28} color="rgb(153 27 27)"/> : null }
        </button>
    )
}