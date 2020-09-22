import React, {
  useLayoutEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as d3 from "d3";
import useMouse from "@react-hook/mouse-position";

//https://www.npmjs.com/package/@react-hook/mouse-position

const DwgPad = forwardRef((data, referencia) => {
  //1. Desestructuramos los datos y el callBack de actualización del padre
  const { valorparahijo, actualizaPadre } = data.data;
  //2. Creamos referencia al svg (d3js):
  const refToSvg = useRef();
  //3. Establecemos los hooks:
  const [Geom, setGeom] = useState(valorparahijo.Geom);
  const [zoomTransform, setZoomTransform] = useState(valorparahijo.zoomTransform)
  const [geomTransf, setGeomTransf] = useState(() => {return Geom.map(d => [d[0]*zoomTransform.k + zoomTransform.x, d[1]*zoomTransform.k + zoomTransform.y, d[2]])})
  const mouse = useMouse(refToSvg, { enterDelay: 100, leaveDelay: 100, fps: 30 });
  //4. Variables:
  const numDivEjeXInicial = 10;
  const [height, setHeight] = useState(valorparahijo.height);
  const [width, setWidth] = useState(valorparahijo.width);
  //5. Actualización del hijo ordenada desde el padre (imperativa)
  useImperativeHandle(referencia, () => {
    console.log("DwgPad: Mandando actualizar datos (useImperativeHandle)");
    return { actualizaDatos };
  });
  const actualizaDatos = (datosNuevos) => {
    console.log("DwgPad: datosNuevos_actualizaDatos (inicial): ", datosNuevos);
    console.log("DwgPad: datosNuevos.Geom_actualizaDatos (inicial): ", ...datosNuevos.Geom);
    actualizaGeom(datosNuevos.Geom);
    actualizaHeight(datosNuevos.height);
    actualizaWidth(datosNuevos.width);
    console.log("DwgPad: datosNuevos.Geom_actualizaDatos (final): ", ...datosNuevos.Geom);
  };
  const actualizaGeom = (geomNueva) => {
    console.log("DwgPad: geomNueva_actualizaGeom (inicial):", ...geomNueva);
    setGeom(geomNueva);
    transformaGeometria();
    console.log("DwgPad: geomNueva_actualizaGeom (final):", ...Geom);
  };
  const actualizaHeight = (heightNueva) => {
    //console.log("DwgPad: heightNueva_actualizaHeight (inicial):", heightNueva);
    setHeight(heightNueva);
    //console.log("DwgPad: heightNueva_actualizaHeight (final):", height);
  };
  const actualizaWidth = (widthNueva) => {
    //console.log("DwgPad: widthNueva_actualizaWidth (inicial):", widthNueva);
    setWidth(widthNueva);
    //console.log("DwgPad: widthNueva_actualizaWidth (final):", width);
  };
  //6. Actualizacion del padre ordenada desde el hijo
  const actualizaPadreDesdeHijo = () => {
    let objetoActualizado = {
      width,
      height,
      zoomTransform,
      Geom,
    };
    console.log("DwgPad: Mandando actualizar Padre desde Hijo_actualizaPadreDesdeHijo (via actualizaPadre) con el objeto siguiente:", {
      width,
      height,
      zoomTransform,
      Geom,
    });
    actualizaPadre(objetoActualizado);
  }
  //7. Gestores de eventos:
  ////7.1 Gestor de los clicks:
  const handleClick = () => {
    console.log("Click!!!________________________________________________________________________________________________________");
    let datoAUnir = [
      (mouse.x - zoomTransform.x) / zoomTransform.k,
      (mouse.elementHeight - mouse.y - zoomTransform.y) / zoomTransform.k,
      1
    ];
    //Se actualiza a si mismo:
    console.log("DwgPad: Geom previa_handleClick: ", ...Geom);
    console.log("DwgPad: Dato a unir_handleClick: ", ...datoAUnir);
    actualizaDatos({width, height, zoomTransform, Geom: [...Geom, datoAUnir]});
    console.log(
      "DwgPad: Objeto actualizado enviado_handleClick (via actualizaDatos): ",
      { width, height, zoomTransform, Geom: [...Geom, datoAUnir] }
    );
    //Se actualiza (imperativamente) al padre desde el hijo:
    console.log("DwgPad: Llamada a actualizaPadreDesdeHijo_handleClick");
    //actualizaPadreDesdeHijo();
  };
  ////7.2. Actualizador del zoom transform: movido dentro del useEffect...
  ////7.3. Genera geometria transformada por zoomTransform:
  const transformaGeometria = () => { 
    setGeomTransf( Geom.map(d => [d[0]*zoomTransform.k + zoomTransform.x, d[1]*zoomTransform.k + zoomTransform.y, d[2]]) );
  };

  //8. El bloque de dibujo (d3js):
  useLayoutEffect(() => {
    console.log("DwgPad: Entrando en useEffect.. Objecto a renderizar: ", {
      width,
      height,
      zoomTransform,
      Geom,
    });

    console.log("DwgPad: Geometria a renderizar en useEffect.. (transformada): ", {
      width,
      height,
      zoomTransform,
      geomTransf,
    });

    ////7.2 Actualiza el zoomTransform:
    const actualizaZoomTransform = (nuevoZT) => {
      setZoomTransform(nuevoZT);
    };

    const k = height / width;
    //https://observablehq.com/@d3/zoomable-scatterplot
    const svg = d3.select(refToSvg.current);
    svg.selectAll("g").remove();
    svg.attr("viewBox", [0, 0, width, height]);

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
      .domain(geomTransf.map((d) => d[2]))
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

    const zoom = d3.zoom().scaleExtent([0.1, 50]).on("zoom", zoomed);
    const gGrid = svg.append("g");
    const gDot = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-linecap", "round");
    gDot
      .selectAll("path")
      .data(geomTransf)
      .join("path")
      .attr("d", (d) => `M${x(d[0])},${y(d[1])}h0`)
      .attr("stroke", (d) => z(d[2]))
      .attr("stroke-width", 20);
    const gx = svg.append("g");
    const gy = svg.append("g");

    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

    function zoomed({ transform }) {
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
      gDot
        .attr("transform", transform)
        .attr("stroke-width", 5 / `scale(${transform.k}) translate(${transform.x}, ${transform.y})`.k);
      gx.call(xAxis, x);
      gy.call(yAxis, y);
      gGrid.call(grid, x, y);
      console.log("EQSPad: transform_useEffect:", transform);
      console.log("EQSPad: zoomTransform_useEffect:", {
        k: transform.k * zoomTransform.k,
        x: transform.x + transform.k * zoomTransform.x,
        y: transform.y + transform.k * zoomTransform.y,
      });
      actualizaZoomTransform({
        k: transform.k * zoomTransform.k,
        x: transform.x + transform.k * zoomTransform.x,
        y: transform.y + transform.k * zoomTransform.y,
      });
    }

    return actualizaPadreDesdeHijo();
  }, [Geom, height, width]);
    
  return <svg ref={refToSvg} onChange={actualizaPadre} onClick={handleClick} />;
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
