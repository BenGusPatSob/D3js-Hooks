import React, { useEffect, useRef, useState } from "react";
import './App.css';
import DwgPad from "./DwgPad";
//import Navbar from 'react-bootstrap/Navbar';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
//import InputText from "./InputText";


// at https://wattenberger.com/blog/react-and-d3
// referencia: https://itnext.io/changing-children-state-from-another-component-with-react-hooks-5c982c042e8

function App() {
    const ref = useRef(null);
    const [width, setWidth] = useState(1000);
    const [height, setHeight] = useState(500);
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
        {/* <Navbar bg="light">
          <Navbar.Brand>EQSApp</Navbar.Brand>
        </Navbar>
        <DwgPad data={{valorparahijo, actualizaPadre}} ref={ref} ></DwgPad> */}
        {/* <Container>
          <Row>
            <Col xs={1} md={2} lg={2} xl={2}> </Col>
            <Col xs={11} md={10} lg={5} xl={5}><DwgPad data={{valorparahijo, actualizaPadre}} ref={ref} ></DwgPad></Col>
            <Col xs={11} md={12} lg={5} xl={5}><h2>DwgPadForm</h2></Col>   
          </Row>
        </Container>         */}
        <DwgPad data={{valorparahijo, actualizaPadre}} ref={ref} ></DwgPad>
      </div>
    );
  }
const generateDataset = () => [[-200, -200, 1], [400, -200, 1], [500, 500, 1], [-200, 500, 1]];

export default App;
