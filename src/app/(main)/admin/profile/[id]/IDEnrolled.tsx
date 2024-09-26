import Link from "next/link";
import { LuExternalLink } from "react-icons/lu";

export default function IDEnrolled({
    title,
    id
} : {
    title: string,
    id: number
}) {

    return ( title === "_placeholder" ?
        <div className="flex flex-col border-2 w-[24%] items-center justify-center p-6 rounded-2xl opacity-0"></div>
        :
        <div className="flex flex-col border-2 w-[24%] items-center justify-center p-6 rounded-2xl">
          <Link href={`/admin/course/${id}/insights/`} className="flex flex-row items-center hover:opacity-60 text-xl text-center">
              {title}
              <LuExternalLink className="ml-1" color="rgb(153 27 27" />
          </Link>
        </div>
    )
}
