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
    <div className="flex flex-col border-2 w-[24%] justify-between items-center p-6 rounded-2xl">
      <div className="text-xl mb-2">{title}</div>
      <Button text="Unenroll" onClick={() => router.push('/home')}/>
    </div>
  )
}