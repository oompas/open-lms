export default function IDProfile({
    name,
    dateMonth,
    dateDay,
    dateYear,
    email,
    link,
    id
} : {
    name: string,
    dateMonth: string,
    dateDay: string,
    dateYear: string,
    email: string,
    link: string,
    id: number
}) {
    return (
        <div className="mt-8">
            <div className="text-2xl mb-2">{name}</div>
            <div className="flex flex-col items-end">
                <div className="mr-auto text-lg mb-6">
                    <div>joined {dateMonth} {dateDay}, {dateYear}</div>
                </div>
                <div className="mr-auto text-lg">
                    <div>{email}</div>
                </div>
            </div>
        </div>
    )
    }
