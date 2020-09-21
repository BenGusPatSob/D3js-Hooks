import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as d3 from "d3";
import useMouse from "@react-hook/mouse-position";
//https://www.npmjs.com/package/@react-hook/mouse-position

const DwgPad = forwardRef((data, referencia) => {
  const { valorparahijo, recogeDatoDesdeD3js } = data.data;
  const [datos, setDataset] = useState(valorparahijo);
  //  const [datos, setDataset] = useState( (() => {
  //                                                const random = d3.randomNormal(0, 0.2);
  //                                                const sqrt3 = Math.sqrt(3);
  //                                                return [].concat(
  //                                                  Array.from({ length: 3 }, () => [random() + sqrt3, random() + 1, 0]),
  //                                                  Array.from({ length: 3 }, () => [random() - sqrt3, random() + 1, 1]),
  //                                                  Array.from({ length: 3 }, () => [random(), random() - 1, 2])
  //                                                );
  //                                              })() );
  const refToSvg = useRef();
  const mouse = useMouse(refToSvg, { enterDelay: 100, leaveDelay: 100, fps: 30 });
  let zoomTransform = { k: 1, x: 0, y: 0 };

  const numDivEjeXInicial = 10;
  const height = 800;
  const width = 1000;
  const k = height / width;

  //Para recibir la orden de actualización desde el padre de manera imperativa
  useImperativeHandle(referencia, () => {
    return { actualizaDatos };
  });
  // para actualizar el estado del padre
  const actualizaDatos = (datosNuevos) => {
    setDataset(datosNuevos);
  };
  //gestor de los clicks
  const handleClick = () => {
    console.log("datos a añadir (Raw): ", [
      mouse.x,
      mouse.elementHeight - mouse.y,
    ]);
    let datoAUnir = [
      (mouse.x - zoomTransform.x) / zoomTransform.k,
      (mouse.elementHeight - mouse.y - zoomTransform.y) / zoomTransform.k,
      0,
    ];
    console.log("datos añadidos (transformados): ", datoAUnir);
    setDataset([...datos, datoAUnir]);
  };
  //actualiza el zoomTransform:
  const actualizaZoomTransform = (nuevoZT) => {
    console.group("Zooms:");
    console.log("nuevoZT:", nuevoZT);
    console.log("zoomTransform", zoomTransform);
    zoomTransform = (nuevoZT.k === 1 && nuevoZT.x === 0 && nuevoZT === 0) ? zoomTransform: nuevoZT;
    console.log("nuevo zoomTransform", zoomTransform);
    return zoomTransform;
  };
  // //Actualiza el zoomTransform:
  // const actualizaZoomTransform = ( {transform} , gDot, gx, gy, gGrid, xAxis, yAxis, grid, x, y ) => {
  //   console.log("transform",transform);
  //   console.log("zoomTransform",zoomTransform);
  //   if(zoomTransform){
  //     console.log("adios");
  //     const zx = zoomTransform.rescaleX(x).interpolate(d3.interpolateRound);
  //     const zy = zoomTransform.rescaleY(y).interpolate(d3.interpolateRound);
  //     gDot
  //       .attr("transform", transform)
  //       .attr("stroke-width", 5 / transform.k);
  //     gx.call(xAxis, zx);
  //     gy.call(yAxis, zy);
  //     gGrid.call(grid, zx, zy);
  //     setZoomTransform(transform);
  //   } else {
  //     console.log("hola");
  //     setZoomTransform(transform);
  //   }
  //   console.log("transform",transform);
  //   console.log("zoomTransform",zoomTransform);
  // }

  //El bloque de dibujo:
  useEffect(() => {
    //Nuevo codigo basado en:
    //https://observablehq.com/@d3/zoomable-scatterplot
    //Inicializado svg object:
    const svg = d3.select(refToSvg.current);
    svg.selectAll("g").remove();
    svg.attr("viewBox", [0, 0, width, height]);
    // //Añadir punto:
    // const addPunto = () => {
    //   svg.append("circle")
    //                       .attr("cx", 100)
    //                       .attr("cy", 100)
    //                       .attr("r", 5);
    //                       console.log("Punto añadido!", mouse);
    // }
    //svg.on("click", addPunto(svg));

    // const data = (() => {
    //   const random = d3.randomNormal(0, 0.2);
    //   const sqrt3 = Math.sqrt(3);
    //   return [].concat(
    //     Array.from({ length: 300 }, () => [random() + sqrt3, random() + 1, 0]),
    //     Array.from({ length: 300 }, () => [random() - sqrt3, random() + 1, 1]),
    //     Array.from({ length: 300 }, () => [random(), random() - 1, 2])
    //   );
    // })();
    //////////////////////////////////////////////////////////////////////////////
    let x = d3
      .scaleLinear()
      .domain([-numDivEjeXInicial, numDivEjeXInicial])
      .range([0, width]);
    let y = d3
      .scaleLinear()
      .domain([-numDivEjeXInicial * k, numDivEjeXInicial * k])
      .range([height, 0]);
    let z = d3
      .scaleOrdinal()
      .domain(datos.map((d) => d[2]))
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

    //////////////////////////////////////////////////////////////////////////////

    const zoom = d3.zoom().scaleExtent([0.5, 32]).on("zoom", zoomed);

    const gGrid = svg.append("g");

    const gDot = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-linecap", "round");
    gDot
      .selectAll("path")
      .data(datos)
      .join("path")
      .attr("d", (d) => `M${x(d[0])},${y(d[1])}h0`)
      .attr("stroke", (d) => z(d[2]))
      .attr("stroke-width", 20);
    //.attr("stroke", (d) => z(d[2]));

    const gx = svg.append("g");

    const gy = svg.append("g");

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);
    //1a version
    // function zoomed( {transform }) {
    //   const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
    //   const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
    //   actualizaZoomTransform( {k: transform.k, x: transform.x, y: transform.y} );
    //   console.log("transform.rescaleX(x):", transform.rescaleX(x));
    //   gDot
    //     .attr("transform", transform)
    //     .attr("stroke-width", 5 / transform.k)
    //   gx.call(xAxis, zx);
    //   gy.call(yAxis, zy);
    //   gGrid.call(grid, zx, zy);
    // }

    //2a version
    function zoomed({ transform }) {
      let zoomDummy = actualizaZoomTransform({
        k: transform.k,
        x: transform.x,
        y: transform.y,
      });
      console.log("zoomDummy", zoomDummy);
      console.log("transform", transform);
      transform.k = zoomDummy.k;
      transform.x = zoomDummy.x;
      transform.y = zoomDummy.y;
      console.log("transform", transform);
      console.groupEnd("");
      x = d3
        .scaleLinear()
        .domain([
          -numDivEjeXInicial * transform.k + transform.x,
          numDivEjeXInicial * transform.k + transform.x,
        ])
        .range([0, width]);
      y = d3
        .scaleLinear()
        .domain([
          -numDivEjeXInicial * k * transform.k + transform.y,
          numDivEjeXInicial * k * transform.k + transform.y,
        ])
        .range([height, 0]);
      //const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
      gDot.attr("transform", transform).attr("stroke-width", 5 / transform.k);
      gx.call(xAxis, x);
      gy.call(yAxis, y);
      gGrid.call(grid, x, y);
    }

    // function zoomed( {transform }) {

    //   //const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
    //   actualizaZoomTransform( {k: transform.k, x: transform.x, y: transform.y} );
    //   updateGeom(gDot, transform);
    //   updateGx(gx, getXscale(numDivEjeXInicial));
    //   updateGy(gy, getYscale(numDivEjeXInicial));
    //   updateGgrid(grid, getXscale(numDivEjeXInicial), getYscale(numDivEjeXInicial));

    // }
  }, [datos]);
  // const getXscale = (numDiv) => { return d3.scaleLinear().domain([-numDiv * zoomTransform.k + zoomTransform.x,
  //   numDiv * zoomTransform.k + zoomTransform.x]).range([0, width]);}
  // const getYscale = (numDiv) => { return d3.scaleLinear().domain([-numDiv * k * zoomTransform.k + zoomTransform.y,
  //   numDiv * k * zoomTransform.k + zoomTransform.y]).range([height, 0]);}
  // const updateGeom = (gDot, transform) => { gDot
  //   .attr("transform", transform)
  //   .attr("stroke-width", 5 / transform.k)}
  // const updateGx = (gx, xAxis, x) => { gx.call(xAxis, x); }
  // const updateGy = (gy, yAxis, y) => { gy.call(yAxis, y); }
  // const updateGgrid = (gGrid, grid, x, y) => { gGrid.call(grid, x, y); }

  return (
    <svg ref={refToSvg} onChange={recogeDatoDesdeD3js} onClick={handleClick} />
  );
});

export default DwgPad;

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
