import Checkbox from "@/components/Checkbox";

export default function Requirement({ text, done } : { text: string, done: boolean }) {
  return (
    <div className="flex flex-row items-center mt-2"> 
        <Checkbox checked={done} setChecked={null} style="mr-3"/>
        <div>{text}</div>
    </div>
  );
}
