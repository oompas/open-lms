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
        case "Developer":
            border = "border-2 border-orange-500";
            textColour = "text-orange-500";
            break;
        case "Administrator":
            border = "border-2 border-purple-500";
            textColour = "text-purple-500";
            break;
        case "Learner":
            border = "border-2 border-blue-500";
            textColour = "text-blue-500";
            break;
    }

    return (
        <div
            className={`inline-flex w-fit items-center px-2 py-1 rounded-full text-lg font-semibold ${border} ${textColour} ${style}`}
        >
            {status}
        </div>
    );
}
