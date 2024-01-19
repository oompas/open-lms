export default function TextField({
    text
} : {
    text: string
}) {
    return (
        <div className="border-4 border-[#9D1939] w-[55%] px-4 py-2 -mt-2 text-xl rounded-2xl">
            {text}
        </div>
    );
}