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
    // const recogeDatos = (event) => {
    //   recogeDatoDesdeD3js(event.target);
    // }
    // const svgElement = d3.select(refToSvg.current);
    // //JOIN DATA TO GEOMETRY
    // let circles = null;
    // circles = svgElement.selectAll("circle").data(datos, (d) => d);
    // //EXIT
    // circles.exit().remove();
    // //UPDATE
    // circles
    //   .enter()
    //   .append("circle")
    //   .attr("cx", (d) => d[0])
    //   .attr("cy", (d) => d[1]);
    // //ENTER
    // circles
    //   .enter()
    //   .append("circle")
    //   .attr("cx", (d) => d[0])
    //   .attr("cy", (d) => d[1])
    //   .attr("r", 3)
    //   .attr("fill", "black")
    //   .on("click", recogeDatos);

    //Nuevo Codigo:
    //https://observablehq.com/@d3/zoomable-scatterplot

    const height = 1000;
    const width = 800;
    const k = height / width;
    let zoomTranform = [1, 1, 1];

    const svg = d3.select(refToSvg.current);
    svg.attr("viewBox", [0, 0, width, height]);

    const data = (() => {
      const random = d3.randomNormal(0, 0.2);
      const sqrt3 = Math.sqrt(3);
      return [].concat(
        Array.from({ length: 300 }, () => [random() + sqrt3, random() + 1, 0]),
        Array.from({ length: 300 }, () => [random() - sqrt3, random() + 1, 1]),
        Array.from({ length: 300 }, () => [random(), random() - 1, 2])
      );
    })();
    //////////////////////////////////////////////////////////////////////////////
    const x = d3.scaleLinear().domain([-4.5, 4.5]).range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([-4.5 * k, 4.5 * k])
      .range([height, 0]);
    const z = d3
      .scaleOrdinal()
      .domain(data.map((d) => d[2]))
      .range(d3.schemeCategory10);
    const xAxis = (g, x) =>
      g
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisTop(x).ticks(12))
        .call((g) => g.select(".domain").attr("display", "none"));
    const yAxis = (g, y) =>
      g
        .call(d3.axisRight(y).ticks(12 * k))
        .call((g) => g.select(".domain").attr("display", "none"));

    const grid = (g, x, y) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .selectAll(".x")
            .data(x.ticks(12))
            .join(
              (enter) =>
                enter.append("line").attr("class", "x").attr("y2", height),
              (update) => update,
              (exit) => exit.remove()
            )
            .attr("x1", (d) => 0.5 + x(d))
            .attr("x2", (d) => 0.5 + x(d))
        )
        .call((g) =>
          g
            .selectAll(".y")
            .data(y.ticks(12 * k))
            .join(
              (enter) =>
                enter.append("line").attr("class", "y").attr("x2", width),
              (update) => update,
              (exit) => exit.remove()
            )
            .attr("y1", (d) => 0.5 + y(d))
            .attr("y2", (d) => 0.5 + y(d))
        );


    const handleMouseOver = (d) => {
      
      console.log("picado");
      // const xCoord = d.x * zoomTranform[0] + zoomTranform[1];
      // const yCoord = d.y * zoomTranform[0] + zoomTranform[2];
      // svg
      //   .append("circle")
      //   .attr("cx", xCoord)
      //   .attr("cy", yCoord)
      //   .attr("r", 5);
    };

    const updateTransform = (d) => zoomTranform = d;         
    //////////////////////////////////////////////////////////////////////////////


    const zoom = d3.zoom().scaleExtent([0.5, 32]).on("zoom", zoomed);

    const gGrid = svg
      .append("g");

    const gDot = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-linecap", "round");

    gDot
      .selectAll("path")
      .data(data)
      .join("path")
      .attr("d", (d) => `M${x(d[0])},${y(d[1])}h0`)
      .attr("stroke", (d) => z(d[2]));

    const gx = svg.append("g");

    const gy = svg.append("g");

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

    function zoomed({ transform }) {
      updateTransform(transform);
      const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
      const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
      gDot
        .attr("transform", transform)
        .attr("stroke-width", 5 / transform.k)
        .on("click", handleMouseOver);
      gx.call(xAxis, zx);
      gy.call(yAxis, zy);
      gGrid.call(grid, zx, zy);
    }

    // return Object.assign(svg.node(), {
    //   reset() {
    //     svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    //   },
    // });
  }, [datos]);
  
  return <svg ref={refToSvg} onChange={recogeDatoDesdeD3js}  />;
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
