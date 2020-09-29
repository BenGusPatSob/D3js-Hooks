import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from "react";
import * as d3 from "d3";
import useMouse from "@react-hook/mouse-position";
import {intersection as inters} from './Helpers';
import { zoom } from "d3";

//https://www.npmjs.com/package/@react-hook/mouse-position

const DwgPad = forwardRef((data, referencia) => {
  //1. Desestructuramos los datos y el callBack de actualización del padre
  const { valorparahijo, actualizaPadre } = data.data;
  //2. Creamos referencia al svg (d3js):
  const refToSvg = useRef();
  //3. Establecemos los hooks:
  const [svg, setSvg] = useState(() => d3.select(refToSvg.current))
  const [Geom, setGeom] = useState(valorparahijo.Geom);
  const [zoomTransform, setZoomTransform] = useState(valorparahijo.zoomTransform)
  const [geomTransf, setGeomTransf] = useState(() => Geom.map(d => [d[0]*zoomTransform.k + zoomTransform.x, d[1]*zoomTransform.k + zoomTransform.y, d[2]]));
  const mouse = useMouse(refToSvg, { enterDelay: 100, leaveDelay: 100, fps: 30 });
  //4. Variables:
  const [height, setHeight] = useState(valorparahijo.height);
  const [width, setWidth] = useState(valorparahijo.width);
  const Bbox_Xinf = -500;
  const Bbox_Xsup = 500
  const Bbox_Yinf = -500
  const Bbox_Ysup = 500;
  const [puntoFlotante, setPuntoFlotante] = useState([]);
  const [tolGeom, setTolGeom] = useState(0.001);
  const [radPersPunto, setRadPersPunto] = useState(10);
  const [radEventPunto, setRadEventPunto] = useState(20);
  const [espEventSegmento, setEspEventoSegmento] = useState(20);
  const [Vars, setVars] = useState({ height, width, tolGeom, radPersPunto, radEventPunto, espEventSegmento, Bbox_Xinf, Bbox_Xsup, Bbox_Yinf, Bbox_Ysup });




  //5. Actualización del hijo ordenada desde el padre (imperativa)
  useImperativeHandle(referencia, () => {
    //console.log("DwgPad: Mandando actualizar datos (useImperativeHandle)");
    return { actualizaDatos };
  });
  const actualizaDatos = (datosNuevos) => {
    // console.log("DwgPad_actualizaDatos: datosNuevos", datosNuevos);
    actualizaGeom(datosNuevos.Geom);
    actualizaHeight(datosNuevos.height);
    actualizaWidth(datosNuevos.width);
  };
  const actualizaGeom = (geomNueva) => {
    // console.log("DwgPad_actualizaGeom: geomNueva", {...geomNueva});
    setGeom(geomNueva);
  };
  const actualizaHeight = (heightNueva) => {
    setHeight(heightNueva);
  };
  const actualizaWidth = (widthNueva) => {
    setWidth(widthNueva);
  };
  //6. Actualizacion del padre ordenada desde el hijo
  const actualizaPadreDesdeHijo = () => {
    let objetoActualizado = {
      width,
      height,
      zoomTransform,
      Geom,
    };
    // console.log("DwgPad_actualizaPadreDesdeHijo: objetoActualizado", objetoActualizado);
    actualizaPadre(objetoActualizado);
  }
  //7. Gestores de eventos:
  ////7.1 Gestor de los clicks:
  const handleClick = () => {
    let x = d3
      .scaleLinear()
      .domain([Vars.Bbox_Xinf * (1 + zoomTransform.x / ((mouse.elementWidth  / 2)*zoomTransform.k)), 
        Vars.Bbox_Xsup * (-1 + (mouse.elementWidth - zoomTransform.x) / ((mouse.elementWidth / 2) * zoomTransform.k))])
      .range([0, mouse.elementWidth]);
    let y = d3
      .scaleLinear()
      .domain([ 
        Vars.Bbox_Yinf * (mouse.elementHeight / width) * (-1 + (mouse.elementHeight - zoomTransform.y) / ((mouse.elementHeight / 2) * zoomTransform.k)),
        Vars.Bbox_Ysup * (mouse.elementHeight / width) * (1 + (zoomTransform.y) / ((mouse.elementHeight / 2) * zoomTransform.k))])
      .range([mouse.elementHeight, 0]);
    let datoAUnir = [
      x.invert(mouse.x),
      y.invert(mouse.y),
      1
    ];
    setGeom( [...Geom, datoAUnir] );
    actualizaDatos({width: Vars.width, height: Vars.height, zoomTransform, Geom: [...Geom, datoAUnir]});
    //actualizaPadreDesdeHijo();
  };
  ////7.2. Actualizador del zoom transform: movido dentro del useEffect...
  ////7.3. Genera geometria transformada por zoomTransform: movido a useEffect

  //8. El bloque de dibujo (d3js):
  useLayoutEffect(() => {

    const k = Vars.height / Vars.width;
    setSvg(d3.select(refToSvg.current));
    svg.selectAll("g").remove();
    svg.attr("viewBox", [0, 0, Vars.width, Vars.height]);

    let x = d3
      .scaleLinear()
      .domain([Vars.Bbox_Xinf * (1 + zoomTransform.x / ((Vars.width / 2)*zoomTransform.k)), 
               Vars.Bbox_Xsup * (-1 + (Vars.width - zoomTransform.x) / ((Vars.width / 2) * zoomTransform.k))])
      .range([0, Vars.width]);
    //console.log("DwgPad_useEffect: x.domain", x.domain());
    let y = d3
      .scaleLinear()
      .domain([ 
        Vars.Bbox_Yinf * k * (-1 + (Vars.height - zoomTransform.y) / ((Vars.height / 2) * zoomTransform.k)),
        Vars.Bbox_Ysup * k * (1 + (zoomTransform.y) / ((Vars.height / 2) * zoomTransform.k))])
      .range([Vars.height, 0]);
    //console.log("DwgPad_useEffect: y.domain", y.domain());
    const xAxis = (g, x) =>
      g
        .attr("transform", `translate(0,${Vars.height})`)
        .call(d3.axisTop(x).ticks(10))
        .call((g) => g.select(".domain").attr("display", "none"));
    const yAxis = (g, y) =>
      g
        .call(d3.axisRight(y).ticks(10 * k))
        .call((g) => g.select(".domain").attr("display", "none"));

    const grid = (g, x, y) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .selectAll(".x")
            .data(x.ticks(10))
            .join(
              (enter) =>
                enter.append("line").attr("class", "x").attr("y2", Vars.height),
              (update) => update,
              (exit) => exit.remove()
            )
            .attr("x1", (d) => 0.5 + x(d))
            .attr("x2", (d) => 0.5 + x(d))
        )
        .call((g) =>
          g
            .selectAll(".y")
            .data(y.ticks(10 * k))
            .join(
              (enter) =>
                enter.append("line").attr("class", "y").attr("x2", Vars.width),
              (update) => update,
              (exit) => exit.remove()
            )
            .attr("y1", (d) => 0.5 + y(d))
            .attr("y2", (d) => 0.5 + y(d))
        );

    const gGrid = svg.append("g");
    gGrid.call(grid, x, y);

    //Geometria Persistida _ vertices:
    const geomVertex = svg
      .append("g")
      .attr("fill", "none");
    geomVertex
      .selectAll("circle")
      .data(geomTransf)
      .join("circle")
      .attr("cx", (d) => d[0])
      .attr("cy", (d) => d[1])
      .attr("r", Vars.radPersPunto)
      .attr("fill", "red");

    const gx = svg.append("g");
    const gy = svg.append("g");
    gx.call(xAxis, x);
    gy.call(yAxis, y);

    //Cdg tracker:
    const cdgLines = svg.append("g");
    cdgLines.exit().remove();
    cdgLines.append("line")
            .attr("x1", zoomTransform.x + zoomTransform.k * Vars.width / 2)
            .attr("y1", 0)
            .attr("x2", zoomTransform.x + zoomTransform.k * Vars.width / 2)
            .attr("y2", Vars.height - 20)
            .attr("stroke", "black")
            .attr("stroke-width", 0.7);
    cdgLines.append("line")
            .attr("x1", 20)
            .attr("y1", zoomTransform.y + zoomTransform.k * Vars.height / 2)
            .attr("x2", Vars.width)
            .attr("y2", zoomTransform.y + zoomTransform.k * Vars.height / 2)
            .attr("stroke", "black")
            .attr("stroke-width", 0.7);
    cdgLines.append("circle")
                    .attr("cx", zoomTransform.x + (Vars.width / 2) * zoomTransform.k)
                    .attr("cy", zoomTransform.y + zoomTransform.k * Vars.height / 2)
                    .attr("r", Vars.radPersPunto / 2)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .attr("fill", "grey") 
                    .attr("opacity", 0.2); 

    const zoom = d3.zoom().scaleExtent([0.1, 50]).on("zoom", zoomed);
    svg.call(zoom);
    // svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

    function zoomed({ transform }) {
      setZoomTransform({
          k: transform.k,
          x: transform.x,
          y: transform.y,
        })
    }
    //return actualizaPadreDesdeHijo();
  }, [Geom, geomTransf, zoomTransform, Vars, refToSvg]);

  useLayoutEffect(() => {

    let A = [0, 0];
    let B = [Vars.width, 0];
    let C = [Vars.width, Vars.height];
    let D = [0, Vars.height];
    let AA = [zoomTransform.x, zoomTransform.y];
    let DD = [zoomTransform.x, zoomTransform.y + Vars.height * zoomTransform.k];
    let BB = [zoomTransform.x + Vars.width * zoomTransform.k, zoomTransform.y];
    let OO = [(AA[0] + BB[0]) / 2, (AA[1] + DD[1]) / 2];
    let AAAB = inters(AA, OO, A, B);
    let AAAD = inters(AA, OO, A, D);
    let DDAD = inters(DD, OO, A, D);
    let BBAB = inters(BB, OO, A, B);
    console.log("A", A);
    console.log("B", B);
    console.log("C   ", C   );  
    console.log("D   ", D   );  
    console.log("AA  ", AA  );  
    console.log("DD  ", DD  );  
    console.log("BB  ", BB  );  
    console.log("OO  ", OO  );  
    console.log("AAAB", AAAB);  
    console.log("AAAD", AAAD);  
    console.log("DDAD", DDAD);  
    console.log("BBAB", BBAB);  
    console.log("__________________________________________");
    console.log("mouse.x", mouse.x);
    console.log("mouse.y", mouse.y);
    console.log("mouse.clientX", mouse.clientX);
    console.log("mouse.clientY", mouse.clientY);
    console.log("mouse.elementHeight", mouse.elementHeight);
    console.log("mouse.elementWidth", mouse.elementWidth);
    console.log("mouse.isOver", mouse.isOver);
    console.log("mouse.pageX", mouse.pageX);
    console.log("mouse.pageY", mouse.pageY);
    console.log("mouse.screenX", mouse.screenX);
    console.log("mouse.screenY", mouse.screenY);
    if(mouse.x !== null){
      try {
        // //Geometria Flotante _ punto:
        svg.selectAll(".temp").remove();
        const geomVertexFlotante = svg.append("g");
        geomVertexFlotante.exit().remove();
        geomVertexFlotante.append("circle")
                        .attr("cx", mouse.x)
                        .attr("cy", mouse.y)
                        .attr("r", Vars.radEventPunto/10)
                        .classed("temp", true )
                        .attr("stroke", "black")
                        .attr("stroke-width", 0.5)
                        .attr("fill", "black"); 
        const eleminaElPunto = setInterval(() => {      
          geomVertexFlotante.exit().remove();
        }, 100);
        return clearInterval(eleminaElPunto);
      } catch (error) {
      }


    let x = d3
      .scaleLinear()
      .domain([Vars.Bbox_Xinf * (1 + zoomTransform.x / ((mouse.elementWidth  / 2)*zoomTransform.k)), 
               Vars.Bbox_Xsup * (-1 + (mouse.elementWidth - zoomTransform.x) / ((mouse.elementWidth / 2) * zoomTransform.k))])
      .range([0, mouse.elementWidth]);
    let y = d3
      .scaleLinear()
      .domain([ 
        Vars.Bbox_Yinf * (mouse.elementHeight / Vars.width) * (-1 + (mouse.elementHeight - zoomTransform.y) / ((mouse.elementHeight / 2) * zoomTransform.k)),
        Vars.Bbox_Ysup * (mouse.elementHeight / Vars.width) * (1 + (zoomTransform.y) / ((mouse.elementHeight / 2) * zoomTransform.k))])
      .range([mouse.elementHeight, 0]);
    const pFloat = [ x.invert(mouse.x), y.invert(mouse.y), 1 ];
    setPuntoFlotante(pFloat);


      
    }
  }, [mouse, zoomTransform, Vars, svg])

  // useLayoutEffect(() => {
  //   console.log("DwgPad_useLayoutEffect: PuntoFlotante", [
  //     (mouse.x - zoomTransform.x) / zoomTransform.k,
  //     (mouse.elementHeight - mouse.y - zoomTransform.y) / zoomTransform.k,
  //     1
  //   ]);
  //   // console.log("DwgPad_useLayoutEffect: PuntoFlotante", [
  //   //   (-mouse.x / zoomTransform.k + zoomTransform.x + (width / 2) * zoomTransform.k) * Bbox_Xinf / ((width / 2) * zoomTransform.k),
  //   //   (-mouse.y / zoomTransform.k + zoomTransform.y + (width / 2) * zoomTransform.k - (width - height) * zoomTransform.k / 2) * Bbox_Ysup / ((width / 2) * zoomTransform.k),
  //   //   1
  //   // ]);
  //   setPuntoFlotante([
  //     (mouse.x - zoomTransform.x) / zoomTransform.k,
  //     (mouse.elementHeight - mouse.y - zoomTransform.y) / zoomTransform.k,
  //     1
  //   ]);
  // }, [mouse, zoomTransform])

  //9. GeometriaTranformada
  useLayoutEffect(() => {


    ////7.3. Genera geometria transformada por zoomTransform:
    const transformaGeometria = () => { 
      // console.log("DwgPad_useLayoutEffect_transformaGeometria: zoomTransform enviado", zoomTransform);
      // console.log("DwgPad_useLayoutEffect_transformaGeometria: geometriaTransformada", Geom.map(d => [d[0]*zoomTransform.k + zoomTransform.x, d[1]*zoomTransform.k + zoomTransform.y, d[2]]));
      ////setGeomTransf( Geom.map(d => [d[0]*zoomTransform.k + zoomTransform.x, height - d[1]*zoomTransform.k + zoomTransform.y, d[2]]) );
      setGeomTransf( Geom.map(d => [zoomTransform.x + (Vars.width / 2) * zoomTransform.k - (Vars.width / 2) * zoomTransform.k * d[0] / Vars.Bbox_Xinf, 
                                    (zoomTransform.y + (Vars.width / 2) * zoomTransform.k - (Vars.width / 2) * zoomTransform.k * d[1] / Vars.Bbox_Ysup - (Vars.width - Vars.height) * zoomTransform.k / 2), d[2]]) );
    };
    return transformaGeometria();
  }, [zoomTransform, Geom, Vars]);
    
  return <svg ref={refToSvg} onChange={actualizaPadre} onClick={handleClick} />;
});

export default DwgPad;