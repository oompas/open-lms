import { ReactElement } from "react";
import { MdArrowForward } from "react-icons/md";

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
    const border: any = " border-[3px] border-red-800"
    const iconElem: ReactElement | null = icon === "arrow" ? 
        <MdArrowForward size={24}/>
        : null

    return (
        <div
            onClick={onClick}
            className={ "flex items-center px-5 py-2 w-fit rounded-xl duration-75 ease-out hover:px-4 cursor-pointer " + style + (filled ? background : border) }
        >
            <div>{text}</div>
            { icon ? <div className="ml-2">{iconElem}</div> : null }
        </div>
    )
}