import React from 'react';

export default function check() {
  const [isChecked, setIsChecked] = React.useState(false);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
  };

  return (
    <div>
      <input type="checkbox" id="myCheckbox" checked={isChecked} onChange={handleCheckboxChange} />
      <label htmlFor="myCheckbox">Check me</label>
    </div>
  );
}
