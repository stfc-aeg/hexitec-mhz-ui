import './App.css';

import React from 'react';
import {useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import {OdinApp, useAdapterEndpoint} from 'odin-react';
import 'odin-react/dist/index.css'

import {LOKIConnectionAlert, LOKIClockGenerator, LOKICarrierInfo, LOKIEnvironment, LOKICarrierTaskStatus, LOKIPerformanceDisplay, LOKICarrierSummaryCard} from './Loki.js'

import {Row, Col, Container} from 'react-bootstrap'

function HMHz() {
    const periodicEndpoint = useAdapterEndpoint("lokicarrier", "", 1000);
    const staticEndpoint = useAdapterEndpoint("lokicarrier");
    //const periodicSlowEndpoint = useAdapterEndpoint("lokicarrier", "", 5000);

    const [loki_connection_ok, set_loki_connection_ok] = useState(true);
    const [foundLoopException, setFoundLoopException] = useState(false);

    return (
        <OdinApp title="HEXITEC-MHz UI" navLinks={["HEXITEC-MHz Control", "Debug Info"]}>
            <Container fluid>
                <Row>
                    <LOKIConnectionAlert adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} set_loki_connection_state={set_loki_connection_ok} />
                </Row>
                <Row>
                    <LOKICarrierSummaryCard adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} foundLoopException={foundLoopException}/>
                </Row>
            </Container>
            <Container>
                <Row>
                    <LOKIConnectionAlert adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} set_loki_connection_state={set_loki_connection_ok} />
                </Row>
                <Row>
                    <Col>
                        <Row>
                            <LOKIClockGenerator adapterEndpoint={periodicEndpoint} />
                        </Row>
                        <Row>
                            <LOKIPerformanceDisplay adapterEndpoint={periodicEndpoint} />
                        </Row>
                        <Row>
                            <LOKIEnvironment adapterEndpoint={periodicEndpoint} records_to_render={10} />
                        </Row>
                        <Row>
                        </Row>
                    </Col>
                    <Col>
                        <Row>
                        </Row>
                        <Row>
                            <LOKICarrierInfo adapterEndpoint={staticEndpoint} loki_connection_state={loki_connection_ok}/>
                        </Row>
                        <Row>
                            <LOKICarrierTaskStatus adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} setFoundLoopException={setFoundLoopException} />
                        </Row>
                    </Col>
                </Row>
            </Container>
        </OdinApp>
    )
}

export default HMHz;
