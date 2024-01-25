import Link from "next/link";

export default function Button({
    text,
    link="/",
    style
} : {
    text: string,
    link: string,
    style?: string,
}) {
    return (
        <Link
            href={link}
            className={"p-3 w-fit border-[3px] border-red-800 rounded-lg duration-75 ease-out hover:px-4 cursor-pointer " + style}
        >
            <div>{text}</div>
        </Link>
    )
}