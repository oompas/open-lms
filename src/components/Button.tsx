import { ReactElement } from "react";
import { MdAddCircleOutline, MdRemoveCircleOutline, MdArrowForward, MdOpenInNew, MdReport } from "react-icons/md";
import React, { useState } from 'react';
import './buffering.css';

export default function Button({
    text,
    onClick,   
    style,    
    filled,    
    icon,        
    disabled
} : {
    text: string,
    onClick: any,
    style?: string,
    filled?: boolean,
    icon?: string,
    disabled?: boolean
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        setIsLoading(true);
        onClick();
        setTimeout(() => {
            setIsLoading(false);
        }, 5000);
    };

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
        : icon === "report" ?
        <MdReport size={20} />
        : null }
    </div>

    return (
        <>
            <button
                onClick={handleClick}
                className={ "flex h-fit items-right px-5 py-2 w-fit rounded-xl text-lg font-bold border-[3px] border-red-800 duration-75 ease-out " + style + (filled ? background : border) + (disabled ? " opacity-40" : " hover:opacity-60 cursor-pointer") }
                disabled={disabled}
            >
                <div>{text}</div>
                { icon ? <div className="ml-2">{iconElem}</div> : null }
            </button>
            {isLoading && <div className="loading ml-4"></div>}
        </>
    )
}