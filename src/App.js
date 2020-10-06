import React, { useEffect, useRef, useState } from "react";
import './App.css';
import DwgPad from "./DwgPad";
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// import InputText from "./InputText";


// at https://wattenberger.com/blog/react-and-d3
// referencia: https://itnext.io/changing-children-state-from-another-component-with-react-hooks-5c982c042e8

function App() {
    const ref = useRef(null);
    const [width, setWidth] = useState(1000);
    const [height, setHeight] = useState(2000);
    const [valorparahijo, setValorParaHijo] = useState({
      width,
      height,
      zoomTransform: { k: 1, x: 0, y: 0 },
      Geom: generateDataset()
    });
    
    const actualizaHijo = (newDato) =>{
      ref.current.actualizaDatos(newDato);
    }

    const actualizaPadre = (newDato) =>{
      setValorParaHijo(newDato);
    }

    const actualizaWidth = (newWidth) => {
      setWidth(newWidth);
    };
    const actualizaHeigth = (newHeight) => {
      setHeight(newHeight);
    };

    useEffect(() => {
      actualizaHeigth(ref.current.height);
    }, [height]);

    useEffect(() => {
      actualizaWidth(ref.current.width);
    }, [width]);

    useEffect(() => {
        const inicia = () => {
          const Geom = generateDataset();
          const newDataset = {
            width,
            height,
            zoomTransform: { k: 1, x: 0, y: 0 },
            Geom,
          };
          actualizaPadre(newDataset);
          actualizaHijo(newDataset);
        }
        if(!valorparahijo){
          const nuevoValor = inicia();
          actualizaHijo(nuevoValor);
        }
        else{
          actualizaHijo(valorparahijo);
        }
      }, [valorparahijo, width, height]);

    return (
      <div>
        <Navbar bg="light">
          <Navbar.Brand>EQSApp</Navbar.Brand>
        </Navbar>
        <Container fluid>
          <Row>
            <Col xs={1} md={1} lg={1} xl={1}></Col>
            <Col xs={11} md={5} >
              <DwgPad
                data={{ valorparahijo, actualizaPadre }}
                ref={ref}
              ></DwgPad>
            </Col>
            <Col xs={12} md={6} lg={6} xl={6}>
              <h2>DwgPadForm</h2>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
const generateDataset = () => [
  [
    [-500, -400, 1],
    [500, -400, 1],
    [500, 400, 1],
    [-500, 400, 1],
    [-500, -400, 1]
  ],
  [
    [-200, -200, 1],
    [-200, 200, 1],
    [200, 200, 1],
    [200, -200, 1],
    [-200, -200, 1]
  ],
];

export default App;
