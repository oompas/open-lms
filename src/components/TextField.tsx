export function validateEmailAndLength(input: string): string {
    const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailFormat.test(input)) {
        return "Invalid email format.";
    }

    return "";
}

export function validatePassword(input: string): string[] {
    const trimmedInput = input.trim();
    const minLength = 10;
    const upperCaseFormat = /[A-Z]/;
    const lowerCaseFormat = /[a-z]/;
    const numberFormat = /[0-9]/;
    const specialCharFormat = /[!@#$%^&*(),.?":{}|<>]/;

    let errors = [];

    if (input !== trimmedInput) {
        errors.push("Password should not have leading or trailing whitespace.");
    }

    if (input.length < minLength) {
        errors.push("Password is too short. It should be at least 10 characters.");
    }

    if (!upperCaseFormat.test(input)) {
        errors.push("Password should contain at least one uppercase letter.");
    }

    if (!lowerCaseFormat.test(input)) {
        errors.push("Password should contain at least one lowercase letter.");
    }

    if (!numberFormat.test(input)) {
        errors.push("Password should contain at least one number.");
    }

    if (!specialCharFormat.test(input)) {
        errors.push("Password should contain at least one special character.");
    }

    if (errors.length === 0) {
        return [""];
    }

    return errors;
}

export default function TextField({
    placeholder,
    text,
    onChange,        // onChange function of the state object - pass in the form of: setValue   <- (no brackets)
    style,
    hidden,
    readonly,
    area,            // toggle multi-line text input
} : {
    placeholder?: string,
    text: number | string,
    onChange: any,
    style?: string,
    hidden?: boolean,
    readonly?: boolean,
    area?: boolean
}) {

    const textarea = (
        <textarea 
            className={"border-[1px] border-[#9D1939] px-4 py-2 text-xl rounded-xl " + (style ? style : "")}
            placeholder={placeholder}
            value={text}
            onChange={(e) => onChange(e.target.value)}
        />
    )

    const textfield = (
        <input 
            className={"border-[1px] border-[#9D1939] px-4 py-2 text-xl rounded-xl " + (style ? style : "")}
            type={hidden ? "password" : "text"}
            placeholder={placeholder}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readonly}
        />
    )

    return (
        area ? textarea : textfield
    );
}