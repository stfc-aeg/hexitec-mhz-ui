import './App.css';

import React from 'react';
import {useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import {OdinApp, useAdapterEndpoint, TitleCard, WithEndpoint, ToggleSwitch} from 'odin-react';
import 'odin-react/dist/index.css'

import {LOKIConnectionAlert, LOKIClockGenerator, LOKICarrierInfo, LOKIEnvironment, LOKICarrierTaskStatus, LOKIPerformanceDisplay, LOKICarrierSummaryCard, StatusBadge} from './Loki.js'

import {Row, Col, Container, Card, ProgressBar, Alert, Button, Spinner, Stack} from 'react-bootstrap'
import * as Icon from 'react-bootstrap-icons';

function HMHz() {
    const periodicEndpoint = useAdapterEndpoint("lokicarrier", "", 1000);
    const staticEndpoint = useAdapterEndpoint("lokicarrier");
    //const periodicSlowEndpoint = useAdapterEndpoint("lokicarrier", "", 5000);

    const [loki_connection_ok, set_loki_connection_ok] = useState(true);
    const [foundLoopException, setFoundLoopException] = useState(false);

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
    let hv_bias_readback = Math.round(periodicEndpoint?.data?.application?.HV.readback_bias);
    let power_board_temp = periodicEndpoint?.data?.environment?.temperature?.POWER_BOARD;
    let asic_temp = periodicEndpoint?.data?.environment?.temperature?.ASIC;
    let asic_init = periodicEndpoint?.data?.application?.system_state.ASIC_INIT;
    let asic_en = periodicEndpoint?.data?.application?.system_state.ASIC_EN;
    let fastdata_init = periodicEndpoint?.data?.application?.system_state.ASIC_FASTDATA_INIT;
    let fastdata_en = periodicEndpoint?.data?.application?.system_state.ASIC_FASTDATA_EN;
    let regs_en = periodicEndpoint?.data?.application?.system_state.REGS_EN;
    let asic_sync = periodicEndpoint?.data?.application?.system_state.SYNC;

    return (
        <OdinApp title="HEXITEC-MHz UI" navLinks={["HEXITEC-MHz Control", "Debug Info", "LOKI System"]}>
            <Container fluid>
                <Row>
                    <LOKIConnectionAlert adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} set_loki_connection_state={set_loki_connection_ok} />
                </Row>
                <Row>
                    <Col md={2}>
                        <LOKICarrierSummaryCard adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} foundLoopException={foundLoopException}/>
                    </Col>
                    <Col md={3}>
                        <HMHzPowerBoardSummaryCard loki_connection_state={loki_connection_ok} power_board_present={power_board_present} power_board_init={power_board_init} power_board_temp={power_board_temp} hv_enabled={hv_enabled} hv_bias_readback={hv_bias_readback} hv_saved={hv_saved} regs_en={regs_en} />
                    </Col>
                    <Col md={3}>
                        <HMHzCOBSummaryCard adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} cob_present={cob_present} cob_init={cob_init} asic_temp={asic_temp} asic_en={asic_en} asic_init={asic_init} fastdata_init={fastdata_init} fastdata_en={fastdata_en} asic_sync={asic_sync} />
                    </Col>
                    <Col>
                        <HMHzStateControl adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} sys_init_state={sys_init_state} sys_init_state_target={sys_init_state_target} sys_init_progress_perc={sys_init_progress} sys_init_err={sys_init_err} power_board_init={power_board_init} cob_init={cob_init} asic_init={asic_init}/>
                    </Col>
                </Row>
                <Row>
                    <HMHzHVControl adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok}/>
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

function HMHzPowerBoardSummaryCard({loki_connection_state, power_board_present, power_board_init, power_board_temp, hv_enabled, hv_bias_readback, hv_saved, regs_en}) {
    if (!loki_connection_state) {
        return (<></>)
    }

    let card_content;
    if (power_board_present && power_board_init) {
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
                    <Col md="auto">
                        <StatusBadge label={hv_saved ? "" : (<><Icon.Save /><span>&nbsp;unsaved</span></>)} type="danger" />
                    </Col>
                </Row>
                <Row>
                    <Col md="auto">
                        <Icon.Lightning />
                        LV Regulators:
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={regs_en ? "Enabled" : "Disabled"} type={regs_en ? "success" : "warning"} />
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
function HMHzCOBSummaryCard({adapterEndpoint, loki_connection_state, cob_present, cob_init, asic_temp, asic_en, asic_init, fastdata_init, fastdata_en, asic_sync}) {
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
                        <Icon.Cpu />
                    </Col>
                    <Col md={4}>
                        ASIC SYNC:
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={asic_sync ? "High" : "Low"} type={asic_sync ? "success" : "warning"} />
                        <SyncEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Manual" fullpath="application/system_state/SYNC" checked={adapterEndpoint.data.application?.system_state?.SYNC} value={adapterEndpoint.data.application?.system_state?.SYNC} />
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
                        <StatusBadge label={fastdata_en ? "Enabled" : "Disabled"} type={fastdata_en ? "success" : "danger"} />
                    </Col>
                    <Col md="auto">
                        <StatusBadge label={fastdata_init ? "Initialised" : "Not Initialised"} type={fastdata_init ? "success" : "warning"} />
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
            <Stack gap={1}>
                <Row>
                    <Col>
                        <ProgressBar now={sys_init_progress_perc} label={sys_init_state} variant={sys_init_err ? "danger" : sys_init_progress_perc == 100 ? "success" : "primary"} striped={sys_init_state != sys_init_state_target ? true : false} animated={sys_init_state != sys_init_state_target ? true : false}/>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Alert variant="danger" show={sys_init_err}>
                            {sys_init_err}
                        </Alert>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <PowerBoardInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="PWR_DONE" variant={power_board_init ? "success" : "outline-primary"}>
                            {power_board_init && <Icon.Repeat size={20} />}
                            {sys_init_state == "PWR_INIT" && <Spinner animation="border" size="sm" />}
                            {power_board_init ? " Re-init Power Board" : " Init Power Board"}
                        </PowerBoardInitEndpointButton>
                    </Col>
                    <Col md={4}>
                        <COBInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="COB_DONE" variant={cob_init ? "success" : "outline-primary"}>
                            {cob_init && <Icon.Repeat size={20} />}
                            {sys_init_state == "COB_INIT" && <Spinner animation="border" size="sm" />}
                            {cob_init ? " Re-init COB" : " Init COB"}
                        </COBInitEndpointButton>
                    </Col>
                    <Col md={2}>
                        <ASICInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="ASIC_DONE" variant={asic_init ? "success" : "outline-primary"}>
                            {asic_init && <Icon.Repeat size={20} />}
                            {sys_init_state == "ASIC_INIT" && <Spinner animation="border" size="sm" />}
                            {asic_init ? " Re-init ASIC" : " Init ASIC"}
                        </ASICInitEndpointButton>
                    </Col>
                </Row>
            </Stack>
        </TitleCard>
    )
}

function HMHzHVControl({adapterEndpoint, loki_connection_state, hv_enabled}) {
    if (!loki_connection_state) {
        return (<></>)
    }

    let hvinfo = adapterEndpoint.data?.application?.HV;
    console.log(hvinfo);

    return (
        <Col class="col align-self-center">
            <TitleCard title="High Voltage Control">
                High Voltage Stuff
            </TitleCard>
        </Col>
    )
}

export default HMHz;
