export default function Requirement({ text, done } : { text: string, done: boolean }) {
  return (
    <div className="flex flex-row items-center mt-2"> 
        <input type="checkbox" id="myCheckbox" checked={done} className="mr-2" />
        <div>{text}</div>
    </div>
  );
}
