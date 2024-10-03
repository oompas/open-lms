import { ReactElement } from "react";
import { MdAddCircleOutline, MdRemoveCircleOutline, MdArrowForward, MdOpenInNew, MdReport } from "react-icons/md";
import React, { useState } from 'react';
import './buffering.css';
import { IoMdArrowBack } from "react-icons/io";

export default function Button({
    text,
    onClick,   
    style,    
    filled,    
    icon,
    iconBefore,
    disabled
} : {
    text: string,
    onClick: any,
    style?: string,
    filled?: boolean,
    icon?: string,
    iconBefore?: boolean,
    disabled?: boolean
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async (arg: React.MouseEvent<HTMLButtonElement> | undefined) => {
        if (arg instanceof MouseEvent) {
            arg.preventDefault();
        }
        setIsLoading(true);
        if(onClick) {
            await onClick(arg);
        }
        setIsLoading(false);
    };

    const background: any = " bg-red-800 text-white"
    const border: any = " text-red-800"
    const iconElem: ReactElement | null = <div>
        { icon === "arrow" ? 
        <MdArrowForward size={24}/>
        : icon === "arrow-back" ?
        <IoMdArrowBack size={24}/>
        : icon === "link" ? 
        <MdOpenInNew size={20}/>
        : icon === "plus" ?
        <MdAddCircleOutline size={20}/>
        : icon === "minus" ?
        <MdRemoveCircleOutline size={20}/>
        : icon === "report" ?
        <MdReport size={20}/>
        : null }
    </div>

    return (
        <>
            <button
                onClick={handleClick}
                className={ "flex h-fit items-center px-5 py-2 w-fit rounded-xl text-lg font-bold border-[3px]" +
                    " border-red-800 duration-75 ease-out " + style + (filled ? background : border) + (disabled ? " opacity-40" : " hover:opacity-60 cursor-pointer") }
                disabled={disabled}
            >
                { iconBefore && <div className="mr-2">{iconElem}</div> }
                <div>{text}</div>
                { !iconBefore && icon && <div className="ml-2">{iconElem}</div> }
            </button>
            {isLoading && 
                <div className="fixed flex justify-center items-center w-[100vw] h-[100vh] top-0 left-0 bg-white bg-opacity-50">
                    <div className="loading ml-4">
                        <div className="inner-circle"></div>
                    </div>
                </div>
            }
        </>
    )
}