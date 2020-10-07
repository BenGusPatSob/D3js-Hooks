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
  const [GeomTemp, setGeomTemp] = useState([]);
  const [zoomTransform, setZoomTransform] = useState( valorparahijo.zoomTransform );
  const [geomTransf, setGeomTransf] = useState(() =>
    Geom.map((d) => [
      d[0] * zoomTransform.k + zoomTransform.x,
      d[1] * zoomTransform.k + zoomTransform.y,
      d[2],
    ])
  );
  const [geomTempTransf, setGeomTempTransf] = useState(() =>
    GeomTemp.map((d) => [
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
  const [puntoOsnap, setPuntoOsnap] = useState([]);
  //4. Variables:
  const [height, setHeight] = useState(valorparahijo.height);
  const [width, setWidth] = useState(valorparahijo.width);
  const Bbox_Xinf = -500;
  const Bbox_Xsup = 500;
  const Bbox_Yinf = -500;
  const Bbox_Ysup = 500;
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
    return { actualizaDatos };
  });
  const actualizaDatos = (datosNuevos) => {
    actualizaGeom(datosNuevos.Geom);
    actualizaHeight(datosNuevos.height);
    actualizaWidth(datosNuevos.width);
  };
  const actualizaGeom = (geomNueva) => {
    setGeom(geomNueva);
  };
  const actualizaHeight = (heightNueva) => {
    setHeight(heightNueva);
  };
  const actualizaWidth = (widthNueva) => {
    setWidth(widthNueva);
  };
  
  const actualizaPadreDesdeHijo = () => {
    let objetoActualizado = {
      width,
      height,
      zoomTransform,
      Geom,
    };
    actualizaPadre(objetoActualizado);
  };
  //7. Gestores de eventos:

  ////7.1 Gestor de los clicks:
  const handleClick = () => {
    const PR = puntoOsnap.length === 0? getPR(): getPRfromP([puntoOsnap[0] * mouse.elementWidth / Vars.width, puntoOsnap[1] * mouse.elementHeight / Vars.height, 1], mouse.elementWidth, mouse.elementHeight);
    if(GeomTemp.length > 0 && Math.abs(PR[0] - GeomTemp[0][0]) <= tolGeom && Math.abs(PR[1] - GeomTemp[0][1]) <= tolGeom ){
      setGeom([...Geom, [...GeomTemp, PR]]);
      setGeomTemp([]);
      // actualizaDatos({
      //   width: Vars.width,
      //   height: Vars.height,
      //   zoomTransform,
      //   Geom: [...Geom],
      // });
    } else {
      setGeomTemp([...GeomTemp, PR]);
    }
  };

  const anclaPuntoOsnap = (punto) => {
    setPuntoOsnap(punto);
  };

  const desanclaPuntoOsnap = () => {
    setPuntoOsnap([]);
  };

  const getPolArea = (pol) => {
    //Solido: area>0; Hueco: area<0
    let area = 0;
    let d = pol.slice(0, pol.length - 1);
    d.map(
      (punto, i) =>
        (area += pol[i][0] * pol[i + 1][1] - pol[i + 1][0] * pol[i][1])
    );
    return area / 2;
  };
  

  //8. El bloque de dibujo (d3js):
  useLayoutEffect(() => {

    const lineFactory = d3.line()
                                .x(function(d) { return d[0]; })
                                .y(function(d) { return d[1]; })
                                .curve(d3.curveLinear);


    const k = Vars.height / Vars.width;
    setSvg(d3.select(refToSvg.current));
    svg.selectAll("g").remove();
    svg.attr("viewBox", [0, 0, Vars.width, Vars.height]);
    //Escalas x e y:
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

    //The grid (+axes):
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

    const gx = svg.append("g");
    const gy = svg.append("g");
    gx.call(xAxis, x);
    gy.call(yAxis, y);

    //O tracker:
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

    const geomPers = svg.append("g").attr("fill", "none");
    //Geometria Persistida _ vertices:
    geomTransf.map((pol) =>
      pol.map((punto) =>
        geomPers
          .append("circle")
          .attr("cx", punto[0])
          .attr("cy", punto[1])
          .attr("r", Vars.radPersPunto / 2)
          .attr("fill", "green")
      )
    );
    geomTempTransf.map((punto) =>
      geomPers
        .append("circle")
        .attr("cx", punto[0])
        .attr("cy", punto[1])
        .attr("r", Vars.radPersPunto)
        .attr("fill", "blue")
    );
    //Geometria Persistida _ segmentos:
    geomTransf.map((pol) =>
      pol.map((punto, i) =>
        geomPers
          .append("line")
          .attr("x1", function() {if(i < pol.length - 1) return punto[0];})
          .attr("y1", function() {if(i < pol.length - 1) return punto[1];})
          .attr("x2", function() {if(i < pol.length - 1) return pol[i + 1][0];})
          .attr("y2", function() {if(i < pol.length - 1) return pol[i + 1][1];})
          .attr("stroke", "green")
          .attr("stroke-width", 2)
      )
    );
    geomTempTransf.map((punto, i) =>
        geomPers
          .append("line")
          .attr("x1", function() {if(i < geomTempTransf.length - 1) return punto[0];})
          .attr("y1", function() {if(i < geomTempTransf.length - 1) return punto[1];})
          .attr("x2", function() {if(i < geomTempTransf.length - 1) return geomTempTransf[i + 1][0];})
          .attr("y2", function() {if(i < geomTempTransf.length - 1) return geomTempTransf[i + 1][1];})
          .attr("stroke", "blue")
          .attr("stroke-width", 2)
    );

    //EventTriggers_Puntos
    geomTransf.map((pol) =>
      pol.map((punto) =>
        geomPers
          .append("circle")
          .attr("cx", punto[0])
          .attr("cy", punto[1])
          .attr("r", Vars.radEventPunto)
          .attr("fill", "blue")
          .attr("opacity", 0)
          .on("mouseover", function () {
            d3.select(this).attr("opacity", 1);
            anclaPuntoOsnap(punto);
          })
          .on("mouseout", function () {
            d3.select(this).attr("opacity", 0);
            desanclaPuntoOsnap();
          })
      )
    );
    geomTempTransf.map((punto) =>
      geomPers
        .append("circle")
        .attr("cx", punto[0])
        .attr("cy", punto[1])
        .attr("r", Vars.radEventPunto)
        .attr("fill", "blue")
        .attr("opacity", 0)
        .on("mouseover", function () {
          d3.select(this).attr("opacity", 1);
          anclaPuntoOsnap(punto);
        })
        .on("mouseout", function () {
          d3.select(this).attr("opacity", 0);
          desanclaPuntoOsnap();
        })
    );
    //EventTriggers_Segmentos:
    // geomTransf.map((pol) => pol.map( (punto, i) => 
    //         {
    //           const isSolid = getPolArea(pol) > 0 ? true : false;
    //           if(i<pol.length - 1){
    //             const direcc = [
    //               (pol[i + 1][0] - pol[i][0]),
    //               (pol[i + 1][1] - pol[i][1]),
    //             ];
    //             const mod = Math.sqrt( direcc[0] * direcc[0] + direcc[1] * direcc[1] );
    //             const segmentos = [
    //               [punto[0] - direcc[1] * Vars.espEventSegmento / mod, punto[1] + direcc[0] * Vars.espEventSegmento / mod],
    //               [punto[0] - direcc[1] * Vars.espEventSegmento / mod + direcc[0], punto[1] + direcc[0] * Vars.espEventSegmento / mod + direcc[1]],
    //               [pol[i + 1][0] + direcc[1] * Vars.espEventSegmento * 2 / mod, pol[i+1][1] - direcc[0] * Vars.espEventSegmento * 2 / mod],
    //               [pol[i + 1][0] + direcc[1] * Vars.espEventSegmento * 2 / mod - direcc[0], pol[i+1][1] - direcc[0] * Vars.espEventSegmento * 2 / mod - direcc[1]],
    //               [punto[0] - direcc[1] * Vars.espEventSegmento / mod, punto[1] + direcc[0] * Vars.espEventSegmento / mod]
    //             ];
    //             console.log("puntoA, puntoB", punto, pol[i + 1]);
    //             console.log("segmentos", segmentos);
    //             geomPers
    //               .append("path")
    //               .attr("d", lineFactory(segmentos))
    //               .on("mouseover", function () { d3.select(this).attr("opacity", 1) })
    //               .on("mouseout", function () { d3.select(this).attr("opacity", 0) });
    //               // .attr("fill", isSolid ? "#eee" : "green")
    //               // .attr("opacity", isSolid ? 1 : 0.2);
    //           }
    //         }
    //                                 )
    // );

    //Configuración del zoom
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

    //Lo siguiente está en observación...
    return actualizaPadreDesdeHijo();
  }, [Geom, geomTransf, geomTempTransf, zoomTransform, Vars, refToSvg]);

  //Dada la posición del mouse y un estado del ZoomTransform, obtener coord reales de un punto
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
  //Dado un las coordenadas reales de un punto, devuelve su representación en pantalla
  const getPRfromP = (P, elemWidth, elemHeight) => {
    const AA = [
      (zoomTransform.x * elemWidth) / Vars.width,
      (zoomTransform.y * elemHeight) / Vars.height,
    ];
    const BB = [
      (zoomTransform.x * elemWidth) / Vars.width + elemWidth * zoomTransform.k,
      (zoomTransform.y * elemHeight) / Vars.height,
    ];
    const DD = [
      (zoomTransform.x * elemWidth) / Vars.width,
      (zoomTransform.y * elemHeight) / Vars.height +
        elemHeight * zoomTransform.k,
    ];
    const OO = [(AA[0] + BB[0]) / 2, (AA[1] + DD[1]) / 2];
    const PR = [
      (Vars.Bbox_Xinf * (P[0] - OO[0])) / (AA[0] - OO[0]),
      (Vars.Bbox_Ysup * (elemHeight / elemWidth) * (P[1] - OO[1])) /
        (AA[1] - OO[1]),
      1,
    ];
    return PR;
  };

//Dado un punto con coordenadas reales, devuelve la representación en pantalla
  const getP = (PR) => {
    return [
      zoomTransform.x +
        (Vars.width / 2) * zoomTransform.k -
        ((Vars.width / 2) * zoomTransform.k * PR[0]) / Vars.Bbox_Xinf,
      zoomTransform.y +
        (Vars.width / 2) * zoomTransform.k -
        ((Vars.width / 2) * zoomTransform.k * PR[1]) / Vars.Bbox_Ysup -
        ((Vars.width - Vars.height) * zoomTransform.k) / 2,
      PR[2],
    ];
  }

  useLayoutEffect(() => {
    
    svg.selectAll(".temp").remove();
    if (mouse.isOver){
      if (mouse.x != null) {
        const PR = puntoOsnap.length === 0? getPR(): getPRfromP([puntoOsnap[0] * mouse.elementWidth / Vars.width, puntoOsnap[1] * mouse.elementHeight / Vars.height, 1], mouse.elementWidth, mouse.elementHeight);
        const geomFlotante = svg.append("g");
        geomFlotante.exit().remove();
        //Puntero:
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
        //Texto Puntero
        const textoFlotante = `${Number(PR[0]).toFixed(2)}, ${Number(PR[1]).toFixed(2)}`;
        const anchoChar = 12;
        geomFlotante
          .append("text")
          .text(textoFlotante)
          .attr("x", mouse.x / (mouse.elementWidth / Vars.width) + (
            mouse.x / (mouse.elementWidth / Vars.width) > (mouse.elementWidth - textoFlotante.length * anchoChar) * 4 / 5 ? - (textoFlotante.length * anchoChar + 5): 5
          ))
          .attr("y", mouse.y / (mouse.elementHeight / Vars.height) - (
            mouse.y / (mouse.elementHeight / Vars.height) < mouse.elementHeight/20 ? -25: 5
          ))
          .classed("temp", true)
          .attr("font-family", "OCR A Std, monospace")
          .attr("font-size", "20px")
          .attr("fill", "red");
        //Linea flotante:
        if(geomTempTransf.length > 0){
          const puntoAncla = geomTempTransf[geomTempTransf.length - 1];
          const vectorFlotante = [
                                  mouse.x / (mouse.elementWidth / Vars.width) - geomTempTransf[geomTempTransf.length - 1][0],
                                  mouse.y / (mouse.elementHeight / Vars.height) - geomTempTransf[geomTempTransf.length - 1][1]
                                 ];
          const mod = Math.sqrt(vectorFlotante[0]*vectorFlotante[0] + vectorFlotante[1]*vectorFlotante[1]);
          if(mod>0){
            geomFlotante
              .append("line")
              .attr("x1", puntoAncla[0] )
              .attr("y1", puntoAncla[1] )
              .attr("x2", puntoAncla[0] + (mod - Vars.radEventPunto / 4) * vectorFlotante[0] / mod)
              .attr("y2", puntoAncla[1] + (mod - Vars.radEventPunto / 4) * vectorFlotante[1] / mod )
              .classed("temp", true)
              .attr("stroke", "black")
              .attr("stroke-width", 0.7);
          }
        }
      }

    }
  }, [mouse, Vars, svg, geomTempTransf, puntoOsnap, getPR]);

  //9. GeometriaTranformada
  useLayoutEffect(() => {
    ////7.3. Genera geometria transformada por zoomTransform:
    const transformaGeometria = () => {
      setGeomTransf(
        Geom.map( (pol) => pol.map((punto) => [
          zoomTransform.x +
            (Vars.width / 2) * zoomTransform.k -
            ((Vars.width / 2) * zoomTransform.k * punto[0]) / Vars.Bbox_Xinf,
          zoomTransform.y +
            (Vars.width / 2) * zoomTransform.k -
            ((Vars.width / 2) * zoomTransform.k * punto[1]) / Vars.Bbox_Ysup -
            ((Vars.width - Vars.height) * zoomTransform.k) / 2,
          punto[2],
        ]))      
      );
      setGeomTempTransf(
        GeomTemp.map((punto) => [
            zoomTransform.x +
              (Vars.width / 2) * zoomTransform.k -
              ((Vars.width / 2) * zoomTransform.k * punto[0]) / Vars.Bbox_Xinf,
            zoomTransform.y +
              (Vars.width / 2) * zoomTransform.k -
              ((Vars.width / 2) * zoomTransform.k * punto[1]) / Vars.Bbox_Ysup -
              ((Vars.width - Vars.height) * zoomTransform.k) / 2,
            punto[2],
          ]
        )
      );
    };
    return transformaGeometria();
  }, [zoomTransform, Geom, GeomTemp, Vars]);

  useEffect(() => {
    setTolGeom(tolGeom);
  }, [tolGeom]);

  useEffect(() => {
    setRadPersPunto(radPersPunto);
  }, [radPersPunto]);

  useEffect(() => {
    setRadEventPunto(radEventPunto);
  }, [radEventPunto]);

  useEffect(() => {
    setEspEventoSegmento(espEventSegmento);
  }, [espEventSegmento]);

  return <svg ref={refToSvg} onChange={actualizaPadre} onClick={handleClick} />;
});

export default DwgPad;