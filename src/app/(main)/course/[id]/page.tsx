export default function Course({ params }: { params: { id: string } }) {
    return (
        <main className="flex items-center justify-center">
            COURSE PAGE - ID: {params.id}
        </main>
    )
}
