export default function TextField({
    placeholder,
    text,
    onChange,        // onChange function of the state object - pass in the form of: setValue   <- (no brackets)
    style,
    hidden
} : {
    placeholder?: string,
    text: number | string,
    onChange: any,
    style?: string,
    hidden?: boolean
}) {
    return (
        <input 
            className={"border-[1px] border-[#9D1939] px-4 py-2 text-xl rounded-xl " + (style ? style : "")}
            type={hidden ? "password" : "text"}
            placeholder={placeholder}
            value={text}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}