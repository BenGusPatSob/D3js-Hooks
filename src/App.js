// import React, { useEffect, useRef, useState } from "react";
// import { select, line, curveCardinal } from "d3";
import React, { useEffect, useState, useRef } from "react";
import './App.css';
import Circles from "./Circles";

// at https://wattenberger.com/blog/react-and-d3
// referencia: https://itnext.io/changing-children-state-from-another-component-with-react-hooks-5c982c042e8
// PASO 0
function App() {
    const ref = useRef(null);
    const [datos, setDatos] = useState(generateDataset())
    
    const actualizaHijo = (newDatos) =>{
      ref.current.actualizaDatos(newDatos);
    }
    useEffect(() => {
      const interval = setInterval(() => {
        const newDataset = generateDataset();
        setDatos(newDataset);
        console.log("  ");
        console.log("0_En App-useEffect-interval:", newDataset[0][0]);
        actualizaHijo(newDataset);
                  console.log("1_En App-useEffect:", datos[0][0]);
      }, 5000);
      return () => clearInterval(interval);
    }, [datos])
    // useEffect(() => {
    //     const newDataset = generateDataset();
    //     setDatos(newDataset);
    //     actualizaHijo(newDataset);
    //             console.log("1_En App-useEffect:", datos[0][0]);
    // }, [datos])

    return (
      <>
      <Circles datos = {datos} ref = {ref}></Circles>
      </>
    );
  }
//*****************Manera de actualizar el padre desde el hijo */
  // function Parent() {
  //   const [value, setValue] = React.useState("");
  
  //   function handleChange(newValue) {
  //     setValue(newValue);
  //   }
  
  //   // We pass a callback to MyInput
  //   return <MyInput value={value} onChange={handleChange} />;
  // }
  
  // function MyInput(props) {
  //   function handleChange(event) {
  //     // Here, we invoke the callback with the new value
  //     props.onChange(event.target.value);
  //   }
    
  //   return <input value={props.value} onChange={handleChange} />
  // }
  
const generateDataset = () =>
Array(10)
  .fill(0)
  .map(() => [Math.random() * 80 + 10, Math.random() * 35 + 10]);

// // at https://medium.com/better-programming/d3-using-react-hooks-and-machine-learning-994960cd24de
// // PASO 2
// function App() {
//   const svgRef = useRef();
//   const [data, setdata] = useState([15, 25, 45, 30, 50]);
//   /**
//   * This method using line() of d3 library and iterating our data array on its X-axis and y-axis
//   * for X-axis : we are moving ahead using index value and multiply it with 50
//   * y-axis : As our svg height is 150px, we are starting Y-axis from bottom and subtracting data item as per iteration.
//   * curve : for giving smooth curves in line path we use curveCardinal
//   */
//   const myLine = line()
//     .x((value, index) => index * 50)
//     .y(value => 150 - value)
//     .curve(curveCardinal);
  
//   useEffect(() => {
//     console.log(svgRef);
//     const svg = select(svgRef.current);
//     svg
//       .selectAll("path") //select all Path
//       .data([data]) // Sync our data as array of array to let d3 only our       data values bcs of single line
//       .join("path") // Create a path
//         .attr("transform", "translateY(20px)")
//         .attr("d", value => myLine(value)) // Create d of path with myLine() method and passing our data array
//         .attr("stroke", "blue")
//         .attr("fill", "None");
//   }, [data]);

//   return (
//     <React.Fragment>
//       <svg ref={svgRef}></svg>
//       <button onClick={() => setdata([...data, Math.floor(Math.random() * 16) + 5])}
//       >
//       Update Data
//       </button>
//       <br />
//       <button onClick={() => setdata(data.map(value => value + 5))}>
//       Update Y-Axis
//       </button>
//       <Circles></Circles>
//     </React.Fragment>
//   );
//   }

// at https://medium.com/better-programming/d3-using-react-hooks-and-machine-learning-994960cd24de
// PASO 1
// function App() {  
//   const svgRef = useRef();
//   const [data, setdata] = useState([10, 20, 30, 40, 50]);
//   useEffect(() => {
//     //console.log(svgRef);
//     const svg = select(svgRef.current);
//     svg
//       .selectAll("circle") // Will select all circles on the svg.
//         .data(data)   // Sync the data set with svg data
//           .join("circle")   // Create circle element on DOM as per data.length
//             .attr("r", value => value) // provide radius values,
//             //Note : value above is value of dataSet as per its index.
//             .attr("cx", value => value * 2)  //Cx 
//             .attr("cy", value => value * 2) //cy
//             .attr("stroke", "red")  //Stroke
//             .attr("fill", "None"); 
//   }, [data]);  
//   // Dependency of data to implement 'ComponentDidUpdate'
//   return <svg ref={svgRef}></svg>;
// }

export default App;
