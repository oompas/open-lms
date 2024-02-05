import Link from "next/link"
import link from './link.png'
import Image from 'next/image'


export default function IDCourse({
    title,
    status,
    description,
    time,
    color,
    id
} : {
    title: string,
    status: string,
    description: string,
    time: string,
    color: string,
    id: number
}) {

    const timeChecked = true
    const quizChecked = false
    const elapsedTime = "Not Started"

    return (
        <main>
            <main className="border-4 w-[100%] mb-8 p-10 rounded-2xl"             style={{borderColor: color}}>
                <div className="text-6xl">{title}
                    <div className="mt-4 text-xl text-white w-fit px-3 py-1 rounded-full mt-2" style={{backgroundColor: color}}>{status} </div>
                    <div className="mt-4 text-xl">{description}</div>
                    <div style={{ display: 'flex', alignItems: 'left'}}>
                    <Link href={"https://en.wikipedia.org/wiki/Course_(education)"}>
                        <div className="mt-4 text-xl text-white w-fit px-3 py-1 rounded-full mt-2 cursor-pointer hover:opacity-60 duration-100" style={{backgroundColor: "#000000", marginRight: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}> Go to course <Image src={link} alt="" width={20} height={20} /> </div> 
                        </div>
                    </Link>
                    <Link href={"https://en.wikipedia.org/wiki/Enrollment"}>
                        <div className="mt-4 text-xl border-2 w-fit px-3 py-1 rounded-full mt-2 cursor-pointer hover:opacity-60 duration-100" style={{borderColor: "#000000"}}>
                            <div style={{ display: 'flex', alignItems: 'center' }}> Enroll + </div>
                        </div>
                    </Link>
                    
                    </div>
                            <div className="mt-4" style={{ display: 'flex', alignItems: 'center', fontSize: '20px' }}> elapsed time:</div>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '30px'  }}> {elapsedTime}</div>


                </div>
            </main>
            <div className="mt-5 text-xl">
                <b>Required completion verification:</b>
                <div className="mt-2"> 
                <input type="checkbox" id="myCheckbox" checked={timeChecked}/>
                <label htmlFor="myCheckbox"> Spend at Least 15 mins on the course.</label></div>
                
                
                <div className="mt-2"> 
                <input type="checkbox" id="myCheckbox" checked={quizChecked}/>
                <label htmlFor="myCheckbox"> Complete available Quizzes.</label>
                </div>
            </div>
        </main>
    )
}
