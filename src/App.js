import React, { useEffect, useRef, useState } from "react";
import './App.css';
import DwgPad from "./DwgPad";
import InputText from "./InputText";


// at https://wattenberger.com/blog/react-and-d3
// referencia: https://itnext.io/changing-children-state-from-another-component-with-react-hooks-5c982c042e8

function App() {
    const ref = useRef(null);
    const [valorparahijo, setValorParaHijo] = useState(generateDataset());
    const [valordesdehijo, setvalordesdehijo] = useState("");
    const [valorDesdeD3js, setValorDesdeD3js] = useState(null);
    
    const actualizaHijo = (newDatos) =>{
      ref.current.actualizaDatos(newDatos);
    }

    const actualizaPadre = (newDato) =>{
      setvalordesdehijo(newDato);
    }

    const recogeDatoDesdeD3js = (newDato) => {
      setValorDesdeD3js(newDato);
    }

    useEffect(() => {
          const inicia = () => {
            const newDataset = generateDataset();
            setValorParaHijo(newDataset);
            actualizaHijo(newDataset);
            //console.log("Valores D3js iniciados!");
          }
          if(valorparahijo.length === 0){
            inicia();
          }
          else{
            actualizaHijo(valorparahijo);
          }
        }, [valorparahijo])

    useEffect(() => {
            //console.log("valordesdehijo(en el padre): ", valordesdehijo);
          }
        , [valordesdehijo]);

    useEffect(() => {
          console.log("valorDesdeD3js: ", valorDesdeD3js);
        }, [valorDesdeD3js]); 

    return (
      <div>
        <h1>EQSApp</h1>
        <DwgPad data={{valorparahijo, recogeDatoDesdeD3js}} ref={ref} ></DwgPad>
        <InputText valor={valordesdehijo} onChange={actualizaPadre} ></InputText>
      </div>
    );
  }
//*****************Manera de actualizar el padre desde el hijo */
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
  
const generateDataset = () =>
Array(200)
  .fill(0)
  .map(() => [Math.random()/2 * 30, Math.random()/10 *30]);

export default App;
