import './App.css';

import React from 'react';
import {useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import {OdinApp, useAdapterEndpoint, TitleCard, WithEndpoint, ToggleSwitch, StatusBox, OdinGraph, DropdownSelector} from 'odin-react';
import 'odin-react/dist/index.css'

import {LOKIConnectionAlert, LOKIClockGenerator, LOKICarrierInfo, LOKIEnvironment, LOKICarrierTaskStatus, LOKIPerformanceDisplay, LOKICarrierSummaryCard, StatusBadge} from './Loki.js'

import {Row, Col, Container, ProgressBar, Alert, Button, Spinner, Stack, Accordion, InputGroup, Form, Dropdown} from 'react-bootstrap'
import * as Icon from 'react-bootstrap-icons';

function HMHz() {
    const periodicEndpoint = useAdapterEndpoint("lokicarrier", "", 1000);
    const staticEndpoint = useAdapterEndpoint("lokicarrier");
    //const periodicSlowEndpoint = useAdapterEndpoint("lokicarrier", "", 5000);

    const [loki_connection_ok, set_loki_connection_ok] = useState(true);
    const [foundLoopException, setFoundLoopException] = useState(false);
    const [all_firefly_channels_enabled, set_all_firefly_channels_enabled] = useState(false);

    let power_board_present = periodicEndpoint.data?.control?.presence_detection.backplane;
    let power_board_init = periodicEndpoint.data?.application?.system_state.POWER_BOARD_INIT;
    let cob_present = periodicEndpoint.data?.control?.presence_detection.application;
    let cob_init = periodicEndpoint.data?.application?.system_state.COB_INIT;
    let sys_init_state = periodicEndpoint?.data?.application?.system_state.ENABLE_STATE;
    let sys_init_state_target = periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_TARGET;
    let sys_init_progress = (periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_PROGRESS[0] / periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_PROGRESS[1]) * 100;
    let sys_init_err = periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_ERROR;
    let hv_enabled = periodicEndpoint?.data?.application?.HV.ENABLE;
    let hv_saved = periodicEndpoint?.data?.application?.HV?.control_voltage_save;
    let hv_overridden = periodicEndpoint?.data?.application?.HV?.control_voltage_overridden;
    let hv_mismatch = periodicEndpoint?.data?.application?.HV?.monitor_control_mismatch_detected;
    let hv_bias_readback = Math.round(periodicEndpoint?.data?.application?.HV.readback_bias);
    let power_board_temp = periodicEndpoint?.data?.environment?.temperature?.POWER_BOARD;
    let asic_temp = periodicEndpoint?.data?.environment?.temperature?.ASIC;
    let diode_temp = periodicEndpoint?.data?.environment?.temperature?.DIODE;
    let asic_init = periodicEndpoint?.data?.application?.system_state.ASIC_INIT;
    let asic_en = periodicEndpoint?.data?.application?.system_state.ASIC_EN;
    let fastdata_init = periodicEndpoint?.data?.application?.system_state.ASIC_FASTDATA_INIT;
    let fastdata_en = periodicEndpoint?.data?.application?.system_state.ASIC_FASTDATA_EN;
    let regs_en = periodicEndpoint?.data?.application?.system_state.REGS_EN;
    let asic_sync = periodicEndpoint?.data?.application?.system_state.SYNC;
    let ff1_pn = periodicEndpoint?.data?.application?.firefly?.ch00to09?.PARTNUMBER;
    let ff2_pn = periodicEndpoint?.data?.application?.firefly?.ch10to19?.PARTNUMBER;
    let peltier_proportion = periodicEndpoint?.data?.application?.peltier?.proportion;
    let peltier_en = periodicEndpoint?.data?.application?.peltier?.enable;
    let peltier_saved = periodicEndpoint?.data?.application?.peltier?.proportion_save;
    let trip_info = periodicEndpoint?.data?.application?.monitoring?.TRIPS;
    let vddd_i = periodicEndpoint?.data?.application?.monitoring?.VDDD_I;
    let vdda_i = periodicEndpoint?.data?.application?.monitoring?.VDDA_I;

    return (
        <OdinApp title="HEXITEC-MHz UI" navLinks={["HEXITEC-MHz Control", "Debug Info", "LOKI System"]}>
            <Container fluid>
                <Row>
                    <LOKIConnectionAlert adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} set_loki_connection_state={set_loki_connection_ok} />
                </Row>
                <Row className="justify-content-md-center">
                    <Col sm={12} xl={4} xxl={2}>
                        <LOKICarrierSummaryCard adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} foundLoopException={foundLoopException}/>
                    </Col>
                    <Col sm={12} xl={4} xxl="auto">
                        <HMHzPowerBoardSummaryCard loki_connection_state={loki_connection_ok} power_board_present={power_board_present} power_board_init={power_board_init} power_board_temp={power_board_temp} hv_enabled={hv_enabled} hv_bias_readback={hv_bias_readback} regs_en={regs_en} vddd_i={vddd_i} vdda_i={vdda_i} trip_info={trip_info} />
                    </Col>
                    <Col sm={12} xl={4} xxl={3}>
                        <HMHzCOBSummaryCard adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} cob_present={cob_present} cob_init={cob_init} asic_temp={asic_temp} diode_temp={diode_temp} asic_en={asic_en} asic_init={asic_init} fastdata_init={fastdata_init} fastdata_en={fastdata_en} asic_sync={asic_sync} ff1_pn={ff1_pn} ff2_pn={ff2_pn} />
                    </Col>
                    <Col sm="auto" xxl={5}>
                        <HMHzStateControl adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} sys_init_state={sys_init_state} sys_init_state_target={sys_init_state_target} sys_init_progress_perc={sys_init_progress} sys_init_err={sys_init_err} power_board_init={power_board_init} cob_init={cob_init} asic_init={asic_init}/>
                    </Col>
                </Row>
                <Row>
                    <Col xxl={8} lg={12}>
                        <TitleCard title="Slow Readout">
                            <Row>
                                <Col>
                                    <HMHzReadoutRender adapterEndpoint={periodicEndpoint} asic_init={asic_init} fakedata={false}/>
                                </Col>
                                <Col md="auto">
                                    Settings
                                </Col>
                            </Row>
                        </TitleCard>
                    </Col>
                    <Col xxl={4} lg="auto" style={{height: "55vh", overflowY: "auto"}}>
                        <HMHzAdvancedSettings adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} cob_init={cob_init} asic_init={asic_init} power_board_init={power_board_init} hv_enabled={hv_enabled} hv_bias_readback={hv_bias_readback} hv_saved={hv_saved} hv_overridden={hv_overridden} hv_mismatch={hv_mismatch} all_firefly_channels_enabled={all_firefly_channels_enabled} set_all_firefly_channels_enabled={set_all_firefly_channels_enabled} peltier_proportion={peltier_proportion} peltier_en={peltier_en} peltier_saved={peltier_saved} />
                    </Col>
                </Row>
            </Container>
            <Container fluid>
                <Row>
                    <LOKIConnectionAlert adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} set_loki_connection_state={set_loki_connection_ok} />
                </Row>
                <Row>
                    <Col>
                        <Row>
                            <LOKIClockGenerator adapterEndpoint={periodicEndpoint} />
                        </Row>
                        <Row>
                            <LOKIEnvironment adapterEndpoint={periodicEndpoint} records_to_render={10} />
                        </Row>
                        <Row>
                        </Row>
                    </Col>
                </Row>
            </Container>
            <Container fluid>
                <Row>
                    <LOKIConnectionAlert adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} set_loki_connection_state={set_loki_connection_ok} />
                </Row>
                <Row s={4} md={12}>
                    <Col >
                        <LOKIPerformanceDisplay adapterEndpoint={periodicEndpoint} />
                    </Col>
                    <Col md={3}>
                            <LOKICarrierInfo adapterEndpoint={staticEndpoint} loki_connection_state={loki_connection_ok}/>
                    </Col>
                    <Col md={4}>
                            <LOKICarrierTaskStatus adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} setFoundLoopException={setFoundLoopException} />
                    </Col>
                </Row>
            </Container>
        </OdinApp>
    )
}

const VCALEndpointButton = WithEndpoint(Button);
const FrameLengthEndpointButton = WithEndpoint(Button);
const IntegrationTimeEndpointButton = WithEndpoint(Button);
const PreAmpCapDropdown = WithEndpoint(DropdownSelector);
function HMHzAdvancedSettings({adapterEndpoint, loki_connection_state, cob_init, asic_init, power_board_init, hv_enabled, hv_bias_readback, hv_saved, hv_overridden, hv_mismatch, all_firefly_channels_enabled, set_all_firefly_channels_enabled, peltier_proportion, peltier_en, peltier_saved}) {
    const [vcal, set_vcal] = useState(null);
    const [frame_length_ui, set_frame_length_ui] = useState(null);
    const [integration_time_ui, set_integration_time_ui] = useState(null);

    if (!loki_connection_state) {
        return (<></>)
    }

    const update_vcal = (event) => {
        set_vcal(+event.target.value);
    }

    const update_frame_length = (event) => {
        set_frame_length_ui(+event.target.value);
    }

    const update_integration_time = (event) => {
        set_integration_time_ui(+event.target.value);
    }

    let feedback_capacitance = adapterEndpoint?.data?.application?.asic_settings?.feedback_capacitance;
    let feedback_gain = adapterEndpoint?.data?.application?.asic_settings?.feedback_gain;
    let frame_length = adapterEndpoint?.data?.application?.asic_settings?.frame_length;
    let integration_time = adapterEndpoint?.data?.application?.asic_settings?.integration_time;

    return (
        <>
            <Accordion >
                <Accordion.Item eventKey="0">
                    <Accordion.Button disabled={false}>
                        <Row className="justify-content-md-center">
                            <Col md="auto">
                                High Voltage Bias
                            </Col>
                            <Col md="auto" hidden={!power_board_init}>
                                <StatusBadge label={hv_enabled ? "ON" : "Off"} type={hv_enabled ? "success" : "warning"}/>
                            </Col>
                            <Col md="auto" hidden={!power_board_init}>
                                <StatusBadge label={Math.round(hv_bias_readback) + " v"} type={hv_enabled ? "success" : "warning"} />
                            </Col>
                            <Col md="auto" hidden={!power_board_init}>
                                <StatusBadge label={hv_saved ? "" : (<><Icon.Save /><span>&nbsp;unsaved</span></>)} type="danger" />
                            </Col>
                            <Col md="auto" hidden={!power_board_init}>
                                <StatusBadge label={hv_overridden ? (<><Icon.Save /><span>&nbsp;overridden</span></>) : ""} type="danger" />
                            </Col>
                            <Col md="auto" hidden={!power_board_init}>
                                <StatusBadge label={hv_mismatch ? (<><Icon.ExclamationTriangleFill /><span>&nbsp;mismatch</span></>) : ""} type="danger" />
                            </Col>
                        </Row>
                    </Accordion.Button>
                    <Accordion.Body>
                        <HMHzHVControl adapterEndpoint={adapterEndpoint} loki_connection_state={loki_connection_state} power_board_init={power_board_init} />
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                    <Accordion.Header>
                        <Row className="justify-content-md-center">
                            <Col md="auto">
                                Pre-Amplifier
                            </Col>
                            <Col md="auto" hidden={!asic_init}>
                                <StatusBadge label={feedback_capacitance + " fF"} type={feedback_capacitance ? "primary" : "warning"}/>
                            </Col>
                        </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                        <Row className="justify-content-md-center">
                            <Col md="auto" hidden={!asic_init}>
                                <PreAmpCapDropdown endpoint={adapterEndpoint} event_type="select" fullpath="application/asic_settings/feedback_capacitance" buttonText={Math.round(feedback_capacitance) + "fF (" + feedback_gain + ")"} variant="primary" >
                                    <Dropdown.Item eventKey={7}>7fF</Dropdown.Item>
                                    <Dropdown.Item eventKey={14}>14fF</Dropdown.Item>
                                    <Dropdown.Item eventKey={21}>21fF</Dropdown.Item>
                                </PreAmpCapDropdown>
                            </Col>
                        </Row>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                    <Accordion.Header>
                        <Row className="justify-content-md-center">
                            <Col md="auto">
                                Frame Config
                            </Col>
                            <Col md="auto" hidden={!asic_init}>
                                <StatusBadge label={frame_length} type={frame_length ? "primary" : "warning"}/>
                            </Col>
                            <Col md="auto" hidden={!asic_init}>
                                <StatusBadge label={integration_time} type={integration_time ? "primary" : "warning"}/>
                            </Col>
                        </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                        <Row className="justify-content-md-center">
                            <Col md="auto" hidden={!asic_init}>
                                <InputGroup>
                                    <InputGroup.Text>Frame Length</InputGroup.Text>
                                    <Form.Control type="number" onChange={update_frame_length} defaultValue={frame_length}/>
                                    <InputGroup.Text></InputGroup.Text>
                                    <FrameLengthEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/asic_settings/frame_length" value={frame_length_ui}>Set</FrameLengthEndpointButton>
                                </InputGroup>
                            </Col>
                            <Col md="auto" hidden={!asic_init}>
                                <InputGroup>
                                    <InputGroup.Text>Integration Time</InputGroup.Text>
                                    <Form.Control type="number" onChange={update_integration_time} defaultValue={integration_time}/>
                                    <InputGroup.Text></InputGroup.Text>
                                    <IntegrationTimeEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/asic_settings/integration_time" value={integration_time_ui}>Set</IntegrationTimeEndpointButton>
                                </InputGroup>
                            </Col>
                        </Row>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                    <Accordion.Header>
                        <Row className="justify-content-md-center">
                            <Col md="auto">
                                VCAL Input
                            </Col>
                            <Col md="auto" hidden={!power_board_init}>
                                <StatusBadge label={adapterEndpoint?.data?.application?.vcal + " v"} type={adapterEndpoint?.data?.application?.vcal ? "primary" : "warning"}/>
                            </Col>
                        </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                        <InputGroup>
                            <InputGroup.Text>VCAL</InputGroup.Text>
                            <Form.Control type="number" onChange={update_vcal} defaultValue={adapterEndpoint?.data?.application?.vcal}/>
                            <InputGroup.Text>V</InputGroup.Text>
                            <VCALEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/vcal" value={vcal}>Set</VCALEndpointButton>
                        </InputGroup>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="4">
                    <Accordion.Header>
                        <Row className="justify-content-md-center">
                            <Col md="auto">
                                Test Pattern
                            </Col>
                        </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                        <HMHzTestPatternControl adapterEndpoint={adapterEndpoint} loki_connection_state={loki_connection_state} asic_init={asic_init}/>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="5">
                    <Accordion.Header>
                        <Row className="justify-content-md-center">
                            <Col md="auto">
                                Channel Config
                            </Col>
                            <Col md="auto" hidden={all_firefly_channels_enabled || !asic_init}>
                                <StatusBadge label={(<><Icon.ExclamationTriangleFill /><span>&nbsp;Some FireFly Channels Disabled</span></>)} type="danger"/>
                            </Col>
                        </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                        <HMHzChannelControl adapterEndpoint={adapterEndpoint} loki_connection_state={loki_connection_state} cob_init={cob_init} asic_init={asic_init} set_all_firefly_channels_enabled={set_all_firefly_channels_enabled}/>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="6">
                    <Accordion.Header>
                        <Row className="justify-content-md-center">
                            <Col md="auto">
                                Peltier
                            </Col>
                            <Col md="auto" hidden={!(power_board_init)}>
                                <StatusBadge label={peltier_en ? "On" : "Disabled"} type={peltier_en ? "success" : "warning"}/>
                            </Col>
                            <Col md="auto" hidden={!(power_board_init && peltier_en)}>
                                <StatusBadge label={Math.round(peltier_proportion*100) + "%"} type="primary"/>
                            </Col>
                            <Col md="auto" hidden={!power_board_init}>
                                <StatusBadge label={peltier_saved ? "" : (<><Icon.Save /><span>&nbsp;unsaved</span></>)} type="danger" />
                            </Col>
                        </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                        <HMHzPeltierControl adapterEndpoint={adapterEndpoint} loki_connection_state={loki_connection_state} cob_init={cob_init} power_board_init={power_board_init} />
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </>
    )
}

function HMHzPowerBoardSummaryCard({loki_connection_state, power_board_present, power_board_init, power_board_temp, hv_enabled, hv_bias_readback, regs_en, vddd_i, vdda_i, trip_info}) {
    if (!loki_connection_state) {
        return (<></>)
    }

    let card_content;
    if (power_board_present && power_board_init) {

        // Trips
        console.log('trip info: ', trip_info);
        let trip_names = Object.keys(trip_info);
        console.log('trip names: ', trip_names);
        let trip_badges;
        trip_badges = trip_names.map((trip_name) => {
            let tripped = trip_info[trip_name].Tripped;
            let description = trip_info[trip_name].Description;

            // The ANY trip is not specific
            if (trip_name === 'ANY'){
                return(<></>);
            }

            return (
                <Row>
                    <Col md="auto" hidden={!tripped}>
                        <StatusBadge label={"TRIP: " + description} type="danger" />
                    </Col>
                </Row>
            )
        });

        card_content = (
            <Container fluid>
                <Row>
                    <Col md="auto">
                        <Icon.Thermometer />
                        Temperature:
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={Math.round(power_board_temp) + "\u00b0C"} />
                    </Col>
                </Row>
                <Row>
                    <Col md="auto">
                        <Icon.Lightning />
                        HV Bias:
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={hv_enabled ? "ON" : "Off"} type={hv_enabled ? "success" : "warning"}/>
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={Math.round(hv_bias_readback) + " v"} type={hv_enabled ? "success" : "warning"} />
                    </Col>
                </Row>
                <Row>
                    <Col md="auto">
                        <Icon.Lightning />
                        Regs:
                    </Col>
                    <Col md="auto" hidden={regs_en}>
                        <StatusBadge label="Disabled" type="warning" />
                    </Col>
                    <Col md="auto" hidden={!regs_en}>
                        <StatusBadge label={"D: " + vddd_i.toFixed(2) + "A"} type={trip_info['TRIP_REG_DI'].Tripped ? "danger" : "success"} />
                        <StatusBadge label={"A: " + vdda_i.toFixed(2) + "A"} type={trip_info['TRIP_REG_AI'].Tripped ? "danger" : "success"} />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {trip_badges}
                    </Col>
                </Row>
            </Container>
        )
    } else {
        // COB is either not initialised or not present at all
        card_content = (
            <Row className="justify-content-md-center">
                <Col md="auto">
                    <Row>
                        {power_board_present ? <Icon.Motherboard  size={30} /> : <Icon.QuestionSquare size={30}/>}
                    </Row>
                    <Row>
                        <StatusBadge label={power_board_present ? "Not Initialised" : "No Power Board Present"} type="warning" />
                    </Row>
                </Col>
            </Row>
        )
    }

    return (
        <TitleCard title={"Power Board - " + (power_board_init ? "Initialised" : (power_board_present ? "Present" : "Not Present"))}>
            {card_content}
        </TitleCard>
    )
}

const SyncEndpointToggleSwitch = WithEndpoint(ToggleSwitch);
const RegsEndpointToggleSwitch = WithEndpoint(ToggleSwitch);
const ASICEnEndpointToggleSwitch = WithEndpoint(ToggleSwitch);
function HMHzCOBSummaryCard({adapterEndpoint, loki_connection_state, cob_present, cob_init, asic_temp, diode_temp, asic_en, asic_init, fastdata_init, fastdata_en, asic_sync, ff1_pn, ff2_pn}) {
    if (!loki_connection_state) {
        return (<></>)
    }

    let card_content;
    if (cob_present && cob_init) {
        card_content = (
            <Container fluid>
                <Row>
                    <Col md={1}>
                        <Icon.Thermometer />
                    </Col>
                    <Col md={4}>
                        Temperature:
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={Math.round(asic_temp) + "\u00b0C"} />
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={Math.round(diode_temp) + "\u00b0C"} />
                    </Col>
                </Row>
                <Row>
                    <Col md={1}>
                        <Icon.Cpu />
                    </Col>
                    <Col md={4}>
                        ASIC State:
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={asic_en ? "Enabled" : "Disabled"} type={asic_en ? "success" : "warning"}/>
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={asic_init ? "Initialised" : "Not Initialised"} type={asic_init ? "success" : "warning"} />
                    </Col>
                </Row>
                <Row>
                    <Col md={1}>
                        <Icon.BoxArrowRight />
                    </Col>
                    <Col md={4}>
                        Fast Data:
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={fastdata_en ? "" : "Disabled"} type={fastdata_en ? "success" : "danger"} />
                    </Col>
                    <Col md="auto">
                        {fastdata_en && <StatusBadge label={fastdata_init ? "Initialised" : "Not Initialised"} type={fastdata_init ? "success" : "warning"} />}
                    </Col>
                </Row>
                <Row>
                    <Col md={1}>
                    </Col>
                    <Col md="auto">
                        FF1
                        <StatusBadge label={ff1_pn ? ff1_pn : "No Module"} type={ff1_pn ? "success" : "danger"} />
                    </Col>
                    <Col md="auto">
                        FF2
                        <StatusBadge label={ff2_pn ? ff2_pn : "No Module"} type={ff2_pn ? "success" : "danger"} />
                    </Col>
                </Row>
            </Container>
        )
    } else {
        // COB is either not initialised or not present at all
        card_content = (
            <Row className="justify-content-md-center">
                <Col md="auto">
                    <Row>
                        {cob_present ? <Icon.Motherboard  size={30} /> : <Icon.QuestionSquare size={30}/>}
                    </Row>
                    <Row>
                        <StatusBadge label={cob_present ? "Not Initialised" : "No COB Present"} type="warning" />
                    </Row>
                </Col>
            </Row>
        )
    }

    return (
        <TitleCard title={"COB - " + (cob_init ? "Initialised" : (cob_present ? "Present" : "Not Present"))}>
            {card_content}
        </TitleCard>
    )
}

const PowerBoardInitEndpointButton = WithEndpoint(Button);
const COBInitEndpointButton = WithEndpoint(Button);
const ASICInitEndpointButton = WithEndpoint(Button);
function HMHzStateControl({adapterEndpoint, loki_connection_state, sys_init_progress_perc, sys_init_state, sys_init_state_target, sys_init_err, power_board_init, cob_init, asic_init}) {
    if (!loki_connection_state) {
        return (<></>)
    }

    return (
        <TitleCard title="System Init">
            <Stack gap={1} direction="horizontal">
                <Stack gap={1}>
                    <Row>
                        <Col>
                            <ProgressBar now={sys_init_progress_perc} label={sys_init_state} variant={sys_init_err ? "danger" : sys_init_progress_perc === 100 ? "success" : "primary"} striped={sys_init_state !== sys_init_state_target ? true : false} animated={sys_init_state !== sys_init_state_target ? true : false}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Alert variant="danger" show={sys_init_err}>
                                {sys_init_err}
                            </Alert>
                        </Col>
                    </Row>
                        <Col>
                            placeholder -system status info
                        </Col>
                    <Row>
                    </Row>
                    <Row>
                        <Col md="auto">
                            <PowerBoardInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="PWR_DONE" variant={power_board_init ? "success" : "outline-primary"}>
                                {power_board_init && <Icon.Repeat size={20} />}
                                {sys_init_state === "PWR_INIT" && <Spinner animation="border" size="sm" />}
                                {power_board_init ? " Re-init Power Board" : " Init Power Board"}
                            </PowerBoardInitEndpointButton>
                        </Col>
                        <Col md="auto">
                            <COBInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="COB_DONE" variant={cob_init ? "success" : "outline-primary"}>
                                {cob_init && <Icon.Repeat size={20} />}
                                {sys_init_state === "COB_INIT" && <Spinner animation="border" size="sm" />}
                                {cob_init ? " Re-init COB" : " Init COB"}
                            </COBInitEndpointButton>
                        </Col>
                        <Col md="auto">
                            <ASICInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="ASIC_DONE" variant={asic_init ? "success" : "outline-primary"}>
                                {asic_init && <Icon.Repeat size={20} />}
                                {sys_init_state === "ASIC_INIT" && <Spinner animation="border" size="sm" />}
                                {asic_init ? " Re-init ASIC" : " Init ASIC"}
                            </ASICInitEndpointButton>
                        </Col>
                    </Row>
                </Stack>
                <Stack gap={1}>
                    <Row>
                        <Col md={12}>
                            <SyncEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="SYNC" fullpath="application/system_state/SYNC" checked={adapterEndpoint.data.application?.system_state?.SYNC} value={adapterEndpoint.data.application?.system_state?.SYNC} />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <RegsEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Regs" fullpath="application/system_state/REGS_EN" checked={adapterEndpoint.data.application?.system_state?.REGS_EN} value={adapterEndpoint.data.application?.system_state?.REGS_EN} />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <ASICEnEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="ASIC EN" fullpath="application/system_state/ASIC_EN" checked={adapterEndpoint.data.application?.system_state?.ASIC_EN} value={adapterEndpoint.data.application?.system_state?.ASIC_EN} />
                        </Col>
                    </Row>
                </Stack>
            </Stack>
        </TitleCard>
    )
}

const SaveVCONTEndpointButton = WithEndpoint(Button);
const HVEnableEndpointToggleSwitch = WithEndpoint(ToggleSwitch);
const HVAutoEndpointToggleSwitch = WithEndpoint(ToggleSwitch);
const DirectVCONTEndpointButton = WithEndpoint(Button);
const BiasTargetEndpointButton = WithEndpoint(Button);
function HMHzHVControl({adapterEndpoint, loki_connection_state, hv_enabled, power_board_init}) {
    const [vcont_direct, set_vcont_direct] = useState(null);
    const [target_bias, set_target_bias] = useState(null);

    if (!loki_connection_state || !power_board_init) {
        return (<></>)
    }

    let hvinfo = adapterEndpoint?.data?.application?.HV;

    const update_direct_vcont = (event) => {
        set_vcont_direct(+event.target.value);
    }

    const update_target_bias = (event) => {
        set_target_bias(+event.target.value);
    }

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Alert variant="warning" show={!hvinfo?.control_voltage_save}>
                    Warning: Control voltage unsaved: The current wiper setting is not saved to the potentiometer EEPROM, and will not be preserved after a power cycle.
                </Alert>
                <Alert variant="warning" show={hvinfo?.control_voltage_overridden}>
                    Warning: Control voltage overridden in configuration file: value saved in EEPROM will not be used.
                </Alert>
                <Alert variant="danger" show={hvinfo?.monitor_control_mismatch_detected}>
                    Warning: Control voltage and monitor voltage significantly mismatched. This could mean ADC, potentiometer, or HV module is faulty.
                </Alert>
            </Row>
            <Row>
                <Col>
                    <Row>
                        <Col md="auto">
                            <HVEnableEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="HV Enable" fullpath="application/HV/ENABLE" checked={hvinfo?.ENABLE} value={hvinfo?.ENABLE} />
                        </Col>
                        <Col md="auto">
                            <HVAutoEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Auto Set Control Voltage" fullpath="application/HV/AUTO_MODE_EN" checked={hvinfo?.AUTO_MODE_EN} value={hvinfo?.AUTO_MODE_EN} />
                        </Col>
                    </Row>
                </Col>
                <Col md="auto">
                    <TitleCard title="Control Voltage">
                        <Row>
                            <Col md={8}>
                                <InputGroup>
                                    <InputGroup.Text>Target Bias</InputGroup.Text>
                                    <Form.Control type="number" onChange={update_target_bias} defaultValue={hvinfo?.target_bias}/>
                                    <InputGroup.Text>V</InputGroup.Text>
                                    <BiasTargetEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/HV/target_bias" value={target_bias}>Set</BiasTargetEndpointButton>
                                </InputGroup>
                            </Col>
                            <Col md="auto">
                                <StatusBox label="Target Bias">{hvinfo?.target_bias?.toFixed(2) + " v"}</StatusBox>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={8} hidden={hvinfo?.AUTO_MODE_EN}>
                                <InputGroup>
                                    <InputGroup.Text>Control</InputGroup.Text>
                                    <Form.Control type="number" onChange={update_direct_vcont} defaultValue={hvinfo?.control_voltage.toFixed(2)}/>
                                    <InputGroup.Text>V</InputGroup.Text>
                                    <DirectVCONTEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/HV/control_voltage" value={vcont_direct}>Set</DirectVCONTEndpointButton>
                                </InputGroup>
                            </Col>
                            <Col md={6} hidden={!hvinfo?.AUTO_MODE_EN}>
                                <StatusBox label="PID Status">{hvinfo?.PID_STATUS}</StatusBox>
                            </Col>
                            <Col >
                                <StatusBox label="Control">{hvinfo?.control_voltage?.toFixed(2) + " v"}</StatusBox>
                            </Col>
                        </Row>
                        <Row>
                            <SaveVCONTEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/HV/control_voltage_save" value="" variant={hvinfo?.control_voltage_save ? "success" : "danger"}>
                                {!hvinfo?.control_voltage_save && <Spinner animation="grow" size="sm" />}
                                {hvinfo?.control_voltage_save ? " Saved " : " Save "}
                                {hvinfo?.control_voltage_save ? <Icon.Check size={20}/> : <></>}
                                {!hvinfo?.control_voltage_save && <Spinner animation="grow" size="sm" />}
                            </SaveVCONTEndpointButton>
                        </Row>
                    </TitleCard>
                </Col>
                <Col>
                    <TitleCard title="Bias Readback">
                        <Row>
                            <Col md="auto">
                                <StatusBox label="ADC">{hvinfo?.monitor_voltage?.toFixed(2) + " v"}</StatusBox>
                            </Col>
                            <Col md="auto">
                                <StatusBox label="Derived Bias">{hvinfo?.readback_bias?.toFixed(0) + " v"}</StatusBox>
                            </Col>
                        </Row>
                    </TitleCard>
                </Col>
            </Row>
        </Container>
    )
}

function HMHzTestPatternControl({adapterEndpoint, loki_connection_state, asic_init}) {
    if (!asic_init) {
        return (<></>);
    }

    return (<>Pattern Control Stuff</>);
}

function HMHzChannelControl({adapterEndpoint, loki_connection_state, cob_init, asic_init, set_all_firefly_channels_enabled}) {
    // This will display information relating to the fast data lanes, related to actual ASIC lane numbering.
    // Primarily will be focussed on on-COB devices that affect the signal (FireFly channel enable, retimer
    // settings etc) but could at some point feature ASIC settings such as CML enable.

    if (!cob_init) {
        return (<></>);
    }

    // Lanes are taken from firefly because they all exist for firefly. Some do not exist
    // for the retimer (the bypass, for example).
    let ff_laneinfo = adapterEndpoint.data?.application?.firefly?.CHANNELS;
    let retimer_laneinfo = adapterEndpoint.data?.application?.retimer?.CHANNELS;    // May or may not be present

    // Assume true unless we find a disabled channel, or can't read back the channel status
    let all_firefly_channels_enabled = true;

    let lane_rows;
    if (ff_laneinfo !== undefined ) {
        let lane_names = Object.keys(ff_laneinfo);
        lane_rows = lane_names.map((lane_name) => {
            let ff_en = ff_laneinfo[lane_name].Enabled;
            if (ff_en === undefined || ff_en === false){
                all_firefly_channels_enabled = false;
            }
            //const ffEndpointToggleSwitch = WithEndpoint(ToggleSwitch);      // Dynamically generate enable switches for current channel
            let ff_en_col = (
                <td>
                    <StatusBadge label={ff_en ? 'Enabled' : 'Disabled'} type={ff_en ? 'success' : 'danger'}/>
                </td>
            )

            let retimer_lock_col = (<></>);
            let retimer_passthrough_col = (<></>);
            if (retimer_laneinfo !== undefined) {
                let retimer_lock = lane_name in retimer_laneinfo ? retimer_laneinfo[lane_name].CDR_Locked : null;
                retimer_lock_col = (
                    <td>
                        <StatusBadge label={retimer_lock === null ? '' : (retimer_lock ? 'Locked' : 'No')} type={retimer_lock ? 'success' : 'danger'}/>
                    </td>
                )

                let retimer_passthrough = lane_name in retimer_laneinfo ? retimer_laneinfo[lane_name].Unlocked_Passthrough : null;
                retimer_passthrough_col = (
                    <td>
                        <StatusBadge label={retimer_passthrough === null ? '' : (retimer_passthrough ? 'Yes' : 'No')} type={retimer_passthrough ? 'success' : 'danger'}/>
                    </td>
                )
            }

            return (
                <tr>
                    <th scope="row">{lane_name}</th>
                    {ff_en_col}
                    {retimer_lock_col}
                    {retimer_passthrough_col}
                </tr>
            )
        });
    } else {
        lane_rows = null;
        all_firefly_channels_enabled = false;
    }

    set_all_firefly_channels_enabled(all_firefly_channels_enabled);

    return (
        <Container>
            <Row className="justify-content-md-center">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Lane Name</th>
                            <th scope="col">FireFly Output</th>
                            {retimer_laneinfo !== undefined && <th scope="col">Retimer Locked</th>}
                            {retimer_laneinfo !== undefined && <th scope="col">Retimer Passthrough</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {lane_rows}
                    </tbody>
                </table>
            </Row>
        </Container>
    )
}

const PeltierEnEndpointToggleSwitch = WithEndpoint(ToggleSwitch);
const SavePeltierEndpointButton = WithEndpoint(Button);
const PeltierProportionDropdown = WithEndpoint(DropdownSelector);
function HMHzPeltierControl({adapterEndpoint, loki_connection_state, cob_init, power_board_init}) {

    if (!power_board_init) {
        return (<></>);
    }

    let peltier_info = adapterEndpoint?.data?.application?.peltier;

    return (
        <Container>
            <Row className="justify-content-md-center">
                <HVEnableEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Peltier Enable" fullpath="application/peltier/enable" checked={peltier_info?.enable} value={peltier_info?.enable} />
                <Col md="auto">
                    <PeltierProportionDropdown endpoint={adapterEndpoint} event_type="select" fullpath="application/peltier/proportion" buttonText={"Proportion: " + Math.round(peltier_info.proportion*100) + "%"} variant="primary" >
                        <Dropdown.Item eventKey={0.2}>20%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.4}>40%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.45}>45%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.5}>50%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.55}>55%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.60}>60%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.65}>65%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.70}>70%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.75}>75%</Dropdown.Item>
                        <Dropdown.Item eventKey={0.80}>80%</Dropdown.Item>
                    </PeltierProportionDropdown>
                </Col>
                <Col md="auto">
                    <StatusBox label="Count">{peltier_info.count}</StatusBox>
                </Col>
                <Col md="auto">
                    <StatusBox label="Set Temperature">{peltier_info.temperature}</StatusBox>
                </Col>
                <SavePeltierEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/peltier/proportion_save" value={true} variant={peltier_info?.proportion_save ? "success" : "danger"}>
                    {!peltier_info?.proportion_save && <Spinner animation="grow" size="sm" />}
                    {peltier_info?.proportion_save ? " Saved " : " Save "}
                    {peltier_info?.proportion_save ? <Icon.Check size={20}/> : <></>}
                    {!peltier_info?.proportion_save && <Spinner animation="grow" size="sm" />}
                </SavePeltierEndpointButton>
            </Row>
        </Container>
    )
}

function HMHzReadoutRender({adapterEndpoint, asic_init, fakedata=false}) {
    let image_dat = adapterEndpoint.data?.application?.readout?.imgdat;
    if (fakedata) {
        image_dat = [
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
            Array.from(Array(80), () => Math.round(Math.random()*4095)),
        ];
    }

    if (asic_init) {
        return (<></>);
    }

    return (
        <Row>
            <Col>
                {image_dat !== undefined && <OdinGraph title='HEXITEC-MHz Sensor SPI Readback' type='heatmap' prop_data={image_dat} colorscale='viridis' />}
            </Col>
        </Row>
    )
}

export default HMHz;
