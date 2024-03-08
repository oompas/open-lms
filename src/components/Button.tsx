import { ReactElement } from "react";
import { MdAddCircleOutline, MdRemoveCircleOutline, MdArrowForward, MdOpenInNew } from "react-icons/md";

export default function Button({
    text,
    onClick,    // function to run on button press - pass in the form of: () => function()
    style,      // additional tailwind style to be applid - ex. "mx-2 shadow-md"
    filled,     // toggles border or filled button types
    icon        // toggles possible icons - "arrow" (more will be added)
} : {
    text: string,
    onClick: any,
    style?: string,
    filled?: boolean,
    icon?: string
}) {

    const background: any = " bg-red-800 text-white"
    const border: any = " text-red-800"
    const iconElem: ReactElement | null = <div>
        { icon === "arrow" ? 
        <MdArrowForward size={24} />
        : icon === "link" ? 
        <MdOpenInNew size={20} />
        : icon === "plus" ?
        <MdAddCircleOutline size={20} />
        : icon === "minus" ?
        <MdRemoveCircleOutline size={20} />
        : null }
    </div>

    return (
        <button
            onClick={onClick}
            className={ "flex h-fit items-center px-5 py-2 w-fit rounded-xl text-lg font-bold border-[3px] border-red-800 duration-75 ease-out hover:opacity-60 cursor-pointer " + style + (filled ? background : border) }
        >
            <div>{text}</div>
            { icon ? <div className="ml-2">{iconElem}</div> : null }
        </button>
    )
}