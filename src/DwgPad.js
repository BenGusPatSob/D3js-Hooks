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
//github.com/jaredLunde/react-hook/tree/master/packages/mouse-position#readme

const DwgPad = forwardRef((data, referencia) => {
  //1. Desestructuramos los datos y el callBack de actualización del padre
  const { valorparahijo, actualizaPadre } = data.data;
  //2. Creamos referencia al svg (d3js):
  const refToSvg = useRef();
  //3. Establecemos los hooks:
  const [svg, setSvg] = useState(() => d3.select(refToSvg.current));
  const [Geom, setGeom] = useState(valorparahijo.Geom);
  const [zoomTransform, setZoomTransform] = useState( valorparahijo.zoomTransform );
  const [geomTransf, setGeomTransf] = useState(() =>
    Geom.map((d) => [
      d[0] * zoomTransform.k + zoomTransform.x,
      d[1] * zoomTransform.k + zoomTransform.y,
      d[2],
    ])
  );
  const mouse = useMouse(refToSvg, {
    enterDelay: 10,
    leaveDelay: 10,
    fps: 60,
  });
  //4. Variables:
  const [height, setHeight] = useState(valorparahijo.height);
  const [width, setWidth] = useState(valorparahijo.width);
  const Bbox_Xinf = -500;
  const Bbox_Xsup = 500;
  const Bbox_Yinf = -500;
  const Bbox_Ysup = 500;
  const [puntoFlotante, setPuntoFlotante] = useState([]);
  const [tolGeom, setTolGeom] = useState(0.001);
  const [radPersPunto, setRadPersPunto] = useState(10);
  const [radEventPunto, setRadEventPunto] = useState(20);
  const [espEventSegmento, setEspEventoSegmento] = useState(20);
  const [Vars, setVars] = useState({
    height,
    width,
    tolGeom,
    radPersPunto,
    radEventPunto,
    espEventSegmento,
    Bbox_Xinf,
    Bbox_Xsup,
    Bbox_Yinf,
    Bbox_Ysup,
  });

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
  };
  //7. Gestores de eventos:

  ////7.1 Gestor de los clicks:
  const handleClick = () => {
    const AA = [
      (zoomTransform.x * mouse.elementWidth) / Vars.width,
      (zoomTransform.y * mouse.elementHeight) / Vars.height,
    ];
    const BB = [
      (zoomTransform.x * mouse.elementWidth) / Vars.width +
        mouse.elementWidth * zoomTransform.k,
      (zoomTransform.y * mouse.elementHeight) / Vars.height,
    ];
    const DD = [
      (zoomTransform.x * mouse.elementWidth) / Vars.width,
      (zoomTransform.y * mouse.elementHeight) / Vars.height +
        mouse.elementHeight * zoomTransform.k,
    ];
    const OO = [(AA[0] + BB[0]) / 2, (AA[1] + DD[1]) / 2];
    const P = [mouse.x, mouse.y];
    const PR = [
      (Vars.Bbox_Xinf * (P[0] - OO[0])) / (AA[0] - OO[0]),
      (Vars.Bbox_Ysup *
        (mouse.elementHeight / mouse.elementWidth) *
        (P[1] - OO[1])) /
        (AA[1] - OO[1]),
      1,
    ];
    setGeom([...Geom, PR]);
    actualizaDatos({
      width: Vars.width,
      height: Vars.height,
      zoomTransform,
      Geom: [...Geom, PR],
    });
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
      .domain([
        Vars.Bbox_Xinf *
          (1 + zoomTransform.x / ((Vars.width / 2) * zoomTransform.k)),
        Vars.Bbox_Xsup *
          (-1 +
            (Vars.width - zoomTransform.x) /
              ((Vars.width / 2) * zoomTransform.k)),
      ])
      .range([0, Vars.width]);
    //console.log("DwgPad_useEffect: x.domain", x.domain());
    let y = d3
      .scaleLinear()
      .domain([
        Vars.Bbox_Yinf *
          k *
          (-1 +
            (Vars.height - zoomTransform.y) /
              ((Vars.height / 2) * zoomTransform.k)),
        Vars.Bbox_Ysup *
          k *
          (1 + zoomTransform.y / ((Vars.height / 2) * zoomTransform.k)),
      ])
      .range([Vars.height, 0]);
    //console.log("DwgPad_useEffect: y.domain", y.domain());
    const xAxis = (g, x) =>
      g
        .style("font", "20px OCR A Std, monospace")
        .attr("transform", `translate(0,${Vars.height})`)
        .call(d3.axisTop(x).ticks(5))
        .call((g) => g.select(".domain").attr("display", "none"));
    const yAxis = (g, y) =>
      g
        .style("font", "20px OCR A Std, monospace")
        .call(d3.axisRight(y).ticks(5 * k))
        .call((g) => g.select(".domain").attr("display", "none"));

    const grid = (g, x, y) =>
      g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call((g) =>
          g
            .selectAll(".x")
            .data(x.ticks(20))
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
            .data(y.ticks(20 * k))
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
    const geomVertex = svg.append("g").attr("fill", "none");
    geomVertex
      .selectAll("circle")
      .data(geomTransf)
      .join("circle")
      .attr("cx", (d) => d[0])
      .attr("cy", (d) => d[1])
      .attr("r", Vars.radPersPunto)
      .attr("fill", "green");

    const gx = svg.append("g");
    const gy = svg.append("g");
    gx.call(xAxis, x);
    gy.call(yAxis, y);

    //Cdg tracker:
    const cdgLines = svg.append("g");
    cdgLines.exit().remove();
    cdgLines
      .append("line")
      .attr("x1", zoomTransform.x + (zoomTransform.k * Vars.width) / 2)
      .attr("y1", 0)
      .attr("x2", zoomTransform.x + (zoomTransform.k * Vars.width) / 2)
      .attr("y2", Vars.height - 20)
      .attr("stroke", "black")
      .attr("stroke-width", 0.7);
    cdgLines
      .append("line")
      .attr("x1", 20)
      .attr("y1", zoomTransform.y + (zoomTransform.k * Vars.height) / 2)
      .attr("x2", Vars.width)
      .attr("y2", zoomTransform.y + (zoomTransform.k * Vars.height) / 2)
      .attr("stroke", "black")
      .attr("stroke-width", 0.7);
    cdgLines
      .append("circle")
      .attr("cx", zoomTransform.x + (Vars.width / 2) * zoomTransform.k)
      .attr("cy", zoomTransform.y + (zoomTransform.k * Vars.height) / 2)
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
      });
    }
    //return actualizaPadreDesdeHijo();
  }, [Geom, geomTransf, zoomTransform, Vars, refToSvg]);

  const getPR = () => {
    const AA = [
      (zoomTransform.x * mouse.elementWidth) / Vars.width,
      (zoomTransform.y * mouse.elementHeight) / Vars.height,
    ];
    const BB = [
      (zoomTransform.x * mouse.elementWidth) / Vars.width +
        mouse.elementWidth * zoomTransform.k,
      (zoomTransform.y * mouse.elementHeight) / Vars.height,
    ];
    const DD = [
      (zoomTransform.x * mouse.elementWidth) / Vars.width,
      (zoomTransform.y * mouse.elementHeight) / Vars.height +
        mouse.elementHeight * zoomTransform.k,
    ];
    const OO = [(AA[0] + BB[0]) / 2, (AA[1] + DD[1]) / 2];
    const P = [mouse.x, mouse.y];
    const PR = [
      (Vars.Bbox_Xinf * (P[0] - OO[0])) / (AA[0] - OO[0]),
      (Vars.Bbox_Ysup *
        (mouse.elementHeight / mouse.elementWidth) *
        (P[1] - OO[1])) /
        (AA[1] - OO[1]),
      1,
    ];
    return PR;
  }

  useEffect(() => {
    if (mouse.isOver) {
      setPuntoFlotante(getPR());
    }
  }, [mouse, zoomTransform, Vars]);

  useLayoutEffect(() => {
    svg.selectAll(".temp").remove();
    if (mouse.isOver){
      if (mouse.x != null) {
        const geomFlotante = svg.append("g");
        geomFlotante.exit().remove();
        geomFlotante
          .append("circle")
          .attr("cx", mouse.x / (mouse.elementWidth / Vars.width))
          .attr("cy", mouse.y / (mouse.elementHeight / Vars.height))
          .attr("r", Vars.radEventPunto / 4)
          .classed("temp", true)
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .attr("fill", "none");
        geomFlotante
          .append("line")
          .attr("x1", mouse.x / (mouse.elementWidth / Vars.width))
          .attr(
            "y1",
            mouse.y / (mouse.elementHeight / Vars.height) -
              (3 * Vars.radEventPunto) / 2
          )
          .attr("x2", mouse.x / (mouse.elementWidth / Vars.width))
          .attr(
            "y2",
            mouse.y / (mouse.elementHeight / Vars.height) - Vars.radEventPunto / 4
          )
          .classed("temp", true)
          .attr("stroke", "black")
          .attr("stroke-width", 0.7);
        geomFlotante
          .append("line")
          .attr("x1", mouse.x / (mouse.elementWidth / Vars.width))
          .attr(
            "y1",
            mouse.y / (mouse.elementHeight / Vars.height) +
              (3 * Vars.radEventPunto) / 2
          )
          .attr("x2", mouse.x / (mouse.elementWidth / Vars.width))
          .attr(
            "y2",
            mouse.y / (mouse.elementHeight / Vars.height) + Vars.radEventPunto / 4
          )
          .classed("temp", true)
          .attr("stroke", "black")
          .attr("stroke-width", 0.7);
        geomFlotante
          .append("line")
          .attr(
            "x1",
            mouse.x / (mouse.elementWidth / Vars.width) -
              (3 * Vars.radEventPunto) / 2
          )
          .attr("y1", mouse.y / (mouse.elementHeight / Vars.height))
          .attr(
            "x2",
            mouse.x / (mouse.elementWidth / Vars.width) - Vars.radEventPunto / 4
          )
          .attr("y2", mouse.y / (mouse.elementHeight / Vars.height))
          .classed("temp", true)
          .attr("stroke", "black")
          .attr("stroke-width", 0.7);
        geomFlotante
          .append("line")
          .attr(
            "x1",
            mouse.x / (mouse.elementWidth / Vars.width) +
              (3 * Vars.radEventPunto) / 2
          )
          .attr("y1", mouse.y / (mouse.elementHeight / Vars.height))
          .attr(
            "x2",
            mouse.x / (mouse.elementWidth / Vars.width) + Vars.radEventPunto / 4
          )
          .attr("y2", mouse.y / (mouse.elementHeight / Vars.height))
          .classed("temp", true)
          .attr("stroke", "black")
          .attr("stroke-width", 0.7);
        
        const PR = getPR();
        const textoFlotante = `${Number(PR[0]).toFixed(2)}, ${Number(PR[1]).toFixed(2)}`;
        const anchoChar = 12;
        const posVert = mouse.y / (mouse.elementHeight / Vars.height) < mouse.elementHeight/20 ? -1: 1;
        geomFlotante
          .append("text")
          .text(textoFlotante)
          .attr("x", mouse.x / (mouse.elementWidth / Vars.width) + (
            mouse.x / (mouse.elementWidth / Vars.width) > (mouse.elementWidth - textoFlotante.length * anchoChar / 3) ? - (textoFlotante.length * anchoChar + 5): 5
          ))
          .attr("y", mouse.y / (mouse.elementHeight / Vars.height) - (
            mouse.y / (mouse.elementHeight / Vars.height) < mouse.elementHeight/20 ? -25: 5
          ))
          .classed("temp", true)
          .attr("font-family", "OCR A Std, monospace")
          .attr("font-size", "20px")
          .attr("fill", "red");
      }

    }
    
  }, [mouse, Vars, svg]);

  //9. GeometriaTranformada
  useLayoutEffect(() => {
    ////7.3. Genera geometria transformada por zoomTransform:
    const transformaGeometria = () => {
      setGeomTransf(
        Geom.map((d) => [
          zoomTransform.x +
            (Vars.width / 2) * zoomTransform.k -
            ((Vars.width / 2) * zoomTransform.k * d[0]) / Vars.Bbox_Xinf,
          zoomTransform.y +
            (Vars.width / 2) * zoomTransform.k -
            ((Vars.width / 2) * zoomTransform.k * d[1]) / Vars.Bbox_Ysup -
            ((Vars.width - Vars.height) * zoomTransform.k) / 2,
          d[2],
        ])
      );
    };
    return transformaGeometria();
  }, [zoomTransform, Geom, Vars]);

  return <svg ref={refToSvg} onChange={actualizaPadre} onClick={handleClick} />;
});

export default DwgPad;