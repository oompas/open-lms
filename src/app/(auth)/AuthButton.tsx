import { ReactElement } from "react";
import { FaGoogle, FaKey } from "react-icons/fa";

export default function AuthButton({
    text,
    onClick,
    icon
} : {
    text: string,
    onClick: any,
    icon?: string
}) {

    const iconElem: ReactElement | null = icon === "google" ? 
        <FaGoogle size={26}/>
        : icon === "sso" ?
        <FaKey size={26}/> 
        : null

    return (
        <div
            onClick={onClick}
            className="flex items-center px-5 py-3 w-fit rounded-xl duration-75 ease-out hover:px-4 cursor-pointer border-[3px] border-red-800"
        >
            { icon ? <div className="mr-2">{iconElem}</div> : null }
            <div className="text-xl">{text}</div>
        </div>
    )
}