import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef} from "react";
import * as d3 from "d3";


const Circles = forwardRef((data, referencia) => {
  const [datos, setDataset] = useState(data);
  const refToSvg = useRef();

  const actualizaDatos = (datosNuevos) => {
    setDataset(datosNuevos);
  }

  useEffect(() => {
    //const svgElement = d3.select("Circles");

    // let circles = svgElement
    //   .selectAll("circle")
    //   .data(datos)
    //   .enter()
    //   .append("circle")
    //   .attr("cx", (d) => d[0])
    //   .attr("cy", (d) => d[1])
    //   .attr("r", 3)
    //   .attr("fill", "black");
    const svgElement = d3.select(refToSvg.current);
    //JOIN DATA TO GEOMETRY
    let circles = null;
        console.log("2_En Circles-useEffect_svgElement:", svgElement);
        console.log("3_En Circles-useEffect_datos:", datos);
    circles = svgElement.selectAll("circle").data(datos, (d) => d);
        console.log("4_En Circles-useEffect_circles:", circles);
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
      .attr("fill", "black");
        console.log("5_En Circles-useEffect_svgElement:", svgElement);
        console.log("6_En Circles-useEffect_circles:", circles);
  }, [datos]);

  //Para recibir la orden de actualización desde el padre de manera imperativa
  useImperativeHandle(referencia, () => { return {actualizaDatos : actualizaDatos}})

  //return () => <svg viewBox="0 0 100 50" ref={ref} />
  return <svg viewBox="0 0 100 50" ref={refToSvg} />;
});

export default Circles;
