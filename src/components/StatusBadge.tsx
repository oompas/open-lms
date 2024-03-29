export default function StatusBadge({
    style,
    status
}: {
    style?: string,
    status: string
}) {
    let textColour = "";
    let border = "";

    switch (status) {
        case "DEVELOPER":
            border = "border-2 border-orange-500";
            textColour = "text-orange-500";
            break;
        case "ADMINISTRATOR":
            border = "border-2 border-purple-500";
            textColour = "text-purple-500";
            break;
        case "LEARNER":
            border = "border-2 border-blue-500";
            textColour = "text-blue-500";
            break;
    }

    return (
        <div
            className={"inline-flex w-fit items-center px-2 py-1 rounded-full text-sm font-semibold " + border + " " + textColour + " " + style}
            style={{ verticalAlign: 'middle' }}
        >
            {status}
        </div>
    );
}
