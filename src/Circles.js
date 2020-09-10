import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef} from "react";
import * as d3 from "d3";

// const generateDataset = () =>
//   Array(10)
//     .fill(0)
//     .map(() => [Math.random() * 80 + 10, Math.random() * 35 + 10]);

const Circles = forwardRef((data, referencia) => {
  const [datos, setDataset] = useState(data);
  const ref = useRef();

  const actualizaDatos = (datosNuevos) => {
    setDataset(datosNuevos);
  }

  useEffect(() => {
      console.log("2_En Circles-useEffect:", datos[0]===undefined? undefined: datos[0][0]);
    const svgElement = d3.select(ref.current);
      //JOIN DATA TO GEOMETRY
      let circles = svgElement.selectAll("circle")
                              .data(datos);
      console.log("2_________circlesJoin: ", circles, datos.datos);
      //EXIT
      circles.exit().remove();
      console.log("2_________circlesExit: ", circles, datos.datos);
      //UPDATE
      circles
        .enter()
        .append("circle")
        .attr("cx", (d) => d[0])
        .attr("cy", (d) => d[1]);
        console.log("2_________circlesUpdate: ", circles, datos.datos);
        // svgElement
        //   .selectAll("circle")
        //   .data(datos)
        //   .enter()
        //   .append("circle")
        //   .attr("cx", (d) => {console.log("dentro de svg:", d[0]); return d[0];})
        //   .attr("cy", (d) => d[1])
        //   .attr("r", 3);
      //ENTER
      circles
        .enter()
        .append("circle")
        .attr("cx", (d) => d[0])
        .attr("cy", (d) => d[1])
        .attr("r", 30)
        .attr("fill", "black");
        console.log("2_________circlesEnter: ", circles, datos.datos);
  }, [datos]);

  //Para recibir la orden de actualización desde el padre de manera imperativa
  useImperativeHandle(referencia, () => { return {actualizaDatos : actualizaDatos}})

  //return () => <svg viewBox="0 0 100 50" ref={ref} />
  return () => <svg viewBox="0 0 100 50" ref={ref} />
});

export default Circles;
