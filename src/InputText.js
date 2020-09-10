import React from "react";

function InputText(props) {

  function actualizaPadre(event) {
    props.onChange(event.target.value);
  }

  return <input type = "text" value = {props.valordesdehijo} onChange = {actualizaPadre} />
}

export default InputText;
//// Manera de actualizar el padre desde el hijo */
  // function Parent() {
  //   const [value, setValue] = React.useState("");
  
  //   function handleChange(newValue) {
  //     setValue(newValue);
  //   }
  
  //   // We pass a callback to Child
  //   return <Child value={value} onChange={handleChange} />;
  // }
  
  // function Child(props) {
  //   function handleChange(event) {
  //     // Here, we invoke the callback with the new value
  //     props.onChange(event.target.value);
  //   }
    
  //   return <input value={props.value} onChange={handleChange} />
  // }