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
    
    // Check for code
    const isCode = /[\w\s]*(function|const|let|var|if|else|return|class|for|while|switch|case|break|default|import|from|export|new|this|super|try|catch|finally|throw|break|continue|null|true|false|Infinity|NaN|undefined|typeof|instanceof|delete|void|yield|await)[\w\s]*[{()}]/.test(text.toString());
    if (isCode) {
        throw new Error("Entered text should not be code.");
    }

    // Check of SQL attack
    const isSqlInjection = /(\bSELECT\b|\bUPDATE\b|\bDELETE\b|\bINSERT\b|\bWHERE\b|\bDROP\b|\bEXEC\b|\bCREATE\b|\bALTER\b|\bTRUNCATE\b|\bTABLE\b|\bDATABASE\b|\bUNION\b|\bALL\b)/i.test(text.toString());
    if (isSqlInjection) {
        throw new Error("Entered text should not be code.");
    }

    // Check for XSS attack
    const isXssAttack = /(<\s*script\b[^<]*(?:(?!<\/\s*script\s*>)<[^<]*)*<\/\s*script\s*>)/i.test(text.toString());
    if (isXssAttack) {
        throw new Error("Entered text should not be code.");
    }

    // Check for Command Injection attack
    const isCommandInjection = /(;|\|\||&&)\s*(ls|pwd|whoami|wget|curl|nc|netcat|python|ruby|perl|bash|sh|ssh|telnet|get|post|head|options|ftp|tftp|sftp)/i.test(text.toString());
    if (isCommandInjection) {
        throw new Error("Entered text should not be code.");
    }

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