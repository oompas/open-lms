export default function SearchBar({
    style
} : {
    style?: string
}) {
    return (
        <input 
            className={"border-4 border-[#9D1939] w-[55%] px-4 py-2 -mt-2 text-xl rounded-2xl " + style}
            type="text"
            placeholder="Search for a course..."
        />
    )
}