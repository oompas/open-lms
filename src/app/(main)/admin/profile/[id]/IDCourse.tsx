import Button from "@/components/Button";
import {useRouter} from "next/navigation";

export default function IDCourse({
    title,
    grade,
    completion,
    link,
    id
} : {
    title: string,
    grade: number,
    completion: number,
    link: string,
    id: number
}) {

  const router = useRouter();

  return (
    <div className="flex flex-col border-4 w-[21%] justify-between items-center mb-8 p-6 rounded-2xl" style={{borderColor: "#9D1939"}}>
      <div className="text-2xl mb-5">{title}</div>
      <Button text="Unenroll" onClick={() => router.push('/home')}/>
    </div>
  )
}