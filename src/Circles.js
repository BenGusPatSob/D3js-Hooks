import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef} from "react";
import * as d3 from "d3";


const Circles = forwardRef((data, referencia) => {
  const {valorparahijo, recogeDatoDesdeD3js} = data.data;
  const [datos, setDataset] = useState(valorparahijo);
  const refToSvg = useRef();

  //Para recibir la orden de actualización desde el padre de manera imperativa
  useImperativeHandle(referencia, () => { return {actualizaDatos}})

  const actualizaDatos = (datosNuevos) => {
    setDataset(datosNuevos);
  }

  useEffect(() => {
    const recogeDatos = (event) => {
      recogeDatoDesdeD3js(event.target);
    }  
    const svgElement = d3.select(refToSvg.current);
    //JOIN DATA TO GEOMETRY
    let circles = null;
    circles = svgElement.selectAll("circle").data(datos, (d) => d);
    //EXIT
    circles.exit().remove();
    //UPDATE
    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => d[0])
      .attr("cy", (d) => d[1]);
    //ENTER
    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => d[0])
      .attr("cy", (d) => d[1])
      .attr("r", 3)
      .attr("fill", "black")
      .on("click", recogeDatos);

  }, [datos]);
  
  return <svg viewBox="0 0 100 50" ref={refToSvg} onChange={recogeDatoDesdeD3js}  />;
});

export default Circles;

// const Circles = forwardRef((data, referencia) => {
//   const [datos, setDataset] = useState(data);
//   const refToSvg = useRef();

//   //Para recibir la orden de actualización desde el padre de manera imperativa
//   useImperativeHandle(referencia, () => { return {actualizaDatos}})

//   const actualizaDatos = (datosNuevos) => {
//     setDataset(datosNuevos);
//   }

//   const recogeDatoDesdeD3js = (event) => {
//     props.onChange(event.target.recogeDatoDesdeD3js);
//   }  

//   useEffect(() => {
//         console.log("datos en circles.js: ", datos);
//     const svgElement = d3.select(refToSvg.current);
//     //JOIN DATA TO GEOMETRY
//     let circles = null;
//     circles = svgElement.selectAll("circle").data(datos, (d) => d);
//     //EXIT
//     circles.exit().remove();
//     //UPDATE
//     circles
//       .enter()
//       .append("circle")
//       .attr("cx", (d) => d[0])
//       .attr("cy", (d) => d[1]);
//     //ENTER
//     circles
//       .enter()
//       .append("circle")
//       .attr("cx", (d) => d[0])
//       .attr("cy", (d) => d[1])
//       .attr("r", 3)
//       .attr("fill", "black")
//       .on("click", recogeDatoDesdeD3js);

//   }, [datos]);
  
//   return <svg viewBox="0 0 100 50" ref={refToSvg} onChange={recogeDatoDesdeD3js}  />;
// });

// export default Circles;
