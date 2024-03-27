import Button from "@/components/Button";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { LuExternalLink } from "react-icons/lu";

export default function IDCourse({
    title,
    id
} : {
    title: string,
    id: number
}) {

  return (
    <div className="flex flex-col border-2 w-[24%] items-center justify-center p-6 rounded-2xl">
      <Link href={"/course/"+id} className="flex flex-row items-center hover:opacity-60 text-xl text-center">
          {title}
          <LuExternalLink className="ml-1" color="rgb(153 27 27" />
      </Link>
    </div>
  )
}