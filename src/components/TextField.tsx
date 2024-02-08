export default function TextField({
    placeholder,
    text,
    onChange        // onChange function of the state object - pass in the form of: setValue   <- (no brackets)
} : {
    placeholder?: string,
    text: string,
    onChange: any
}) {
    return (
        <input 
            className="border-2 border-[#9D1939] px-4 py-2 -mt-2 text-xl rounded-xl "
            type="text"
            placeholder={placeholder}
            value={text}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}