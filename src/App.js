import React, { useEffect, useRef, useState } from "react";
import './App.css';
import DwgPad from "./DwgPad";
//import InputText from "./InputText";


// at https://wattenberger.com/blog/react-and-d3
// referencia: https://itnext.io/changing-children-state-from-another-component-with-react-hooks-5c982c042e8

function App() {
    const ref = useRef(null);
    const [width, setWidth] = useState(1000);
    const [height, setHeight] = useState(800);
    const [valorparahijo, setValorParaHijo] = useState({
      width,
      height,
      zoomTransform: { k: 1, x: 0, y: 0 },
      Geom: generateDataset()
    });
    
    const actualizaHijo = (newDatos) =>{
      console.log("Appjs: Iniciando_actualizaHijo...");
      console.log("Appjs: newDatos_actualizaHijo:", newDatos);
      ref.current.actualizaDatos(newDatos);
    }

    const actualizaPadre = (newDato) =>{
      console.log("Appjs: Iniciando_actualizaPadre...");
      console.log("Appjs: newDato_actualizaPadre:", newDato);
      setValorParaHijo(newDato);
    }

    const actualizaWidth = (newWidth) => {
      // console.log("Appjs: Iniciando_actualizaWidth...");
      // console.log("Appjs: newDato_actualizaWidth:", newWidth);
      setWidth(newWidth);
    };
    const actualizaHeigth = (newHeight) => {
      // console.log("Appjs: Iniciando_actualizaHegith...");
      // console.log("Appjs: newDato_actualizaHeigth:", newHeight);
      setHeight(newHeight);
    };

    useEffect(() => {
      // console.log("Appjs: Iniciando_useEffect (actualizaHeigth)...");
      actualizaHeigth(height);
    }, [height]);

    useEffect(() => {
      // console.log("Appjs: Iniciando_useEffect (actualizaWidth)...");
      actualizaWidth(width);
    }, [width]);

    useEffect(() => {
      console.log("Appjs: Iniciando_useEffect (iniciando state / actualizaHijo / actualizaPadre)...");
          const inicia = () => {
            const Geom = generateDataset();
            const newDataset = {
              width,
              height,
              zoomTransform: { k: 1, x: 0, y: 0 },
              Geom,
            };
            actualizaPadre(newDataset);
            actualizaHijo(newDataset);
          }
          if(!valorparahijo){
            const nuevoValor = inicia();
            console.log("Appjs: useEffect (iniciando state)...nuevoValor:", nuevoValor);
          }
          else{
            console.log("Appjs: useEffect (actualizaHijo)...valorparahijo:", valorparahijo);
            actualizaHijo(valorparahijo);
          }
        }, [valorparahijo, width, height]);

    return (
      <div>
        <h1>EQSApp</h1>
        <DwgPad data={{valorparahijo, actualizaPadre}} ref={ref} ></DwgPad>
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
Array(5)
  .fill(0)
  .map(() => [Math.random()/2 * 30, Math.random()/10 *30, 1]);

export default App;
