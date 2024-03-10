import { ReactElement } from "react";
import { MdCheckCircleOutline } from "react-icons/md";

export default function QuizProgress({
    completed,
    icon,
    number
} : {
    completed: boolean,
    icon?: string,
    number: number
}) {
    // Render icon if completed is true
    const iconElem: ReactElement | null = completed && icon === "check" ? (
        <div className="ml-2">
            <MdCheckCircleOutline size={24} />
        </div>
    ) : null;

    return (
        <div className="flex mt-4">
            <div className="flex-grow border-4 border-gray-300 mb-2 p-4 rounded-2xl duration-100 flex items-center">
                <div className="text-2xl">Q{number}</div>
                {iconElem}
            </div>
        </div>
    )
}