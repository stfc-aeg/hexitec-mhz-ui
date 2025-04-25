import './App.css';

import React from 'react';
import {useState} from 'react';
import {useEffect} from 'react';
import {useMemo} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import {OdinApp, useAdapterEndpoint, TitleCard, WithEndpoint, ToggleSwitch, StatusBox, DropdownSelector} from 'odin-react';
import 'odin-react/dist/index.css'

import {LOKIConnectionAlert, LOKIClockGenerator, LOKICarrierInfo, LOKIEnvironment, LOKICarrierTaskStatus, LOKIPerformanceDisplay, LOKICarrierSummaryCard, StatusBadge} from './Loki.js'

import {Row, Col, Container, ProgressBar, Alert, Button, Spinner, Stack, Accordion, InputGroup, Form, Dropdown} from 'react-bootstrap'
import * as Icon from 'react-bootstrap-icons';


// Temporary copy of OdinGraph with PR'ed changes
import Plot from 'react-plotly.js';
// Linting disabled as this is intentionally kept in line with odin-react repo copy
/* eslint-disable */
function OdinGraph(props) {


    const {title, prop_data, x_data=null, width=null, height=null, 
           num_x=null, num_y=null, type='scatter', series_names=[],
           colorscale="Portland", zoom_event_handler=null, layout={}} = props;
    const [data, changeData] = useState([{}]);
    const [layout_state, changeLayout] = useState(layout);


    const get_array_dimenions = (data) => {
        var x = (x_data) ? x_data.length : data.length;
        var y = (Array.isArray(data[0]) ? data[0].length : 1);
        // var z = (Array.isArray(data[0]) ? (Array.isArray(data[0][0]) ? data[0][0].length : 1) : 1);

        console.log("(" + x + ", " + y + ")");
        return {x: x, y: y};
    }

    useEffect(() => {
        console.log("Updating Data");
        var data_dims = get_array_dimenions(prop_data);
        var data = [];
        if(type == "scatter" || type == "line")
        {
            //one dimensional data set(s)
            if(data_dims.y > 1)
            {
                // multiple datasets
                for(var i = 0; i<data_dims.x; i++){
                    var dataset = {
                        x: (x_data) ? x_data : Array.from(prop_data[i], (v, k) => k),
                        y: prop_data[i],
                        type: "scatter",
                        name: series_names[i] || null
                    }
                    data.push(dataset);
                }
            }
            else
            {
                var dataset = {
                    x: (x_data) ? x_data : Array.from(prop_data, (v, k) => k),
                    y: prop_data,
                    type: "scatter"
                }
                data.push(dataset);
                
            }
            
            changeLayout(Object.assign(
                // Default values
                {
                    yaxis: {
                        autorange: true
                    },
                    title:title,
                    autosize: true,
                },

                // Apply any overrides
                layout
            ));

        }
        else if(type == "heatmap" || type == "contour")
        {
            //2d dataset

            if(data_dims.y > 1)
            {
                //data is 2 dimensional,  easy to turn into a 2d heatmap
                var dataset = {
                    z: prop_data,
                    type: type,
                    xaxis: "x",
                    yaxis: "y",
                    coloraxis: 'coloraxis',

                }
                data.push(dataset);
                
            }
            else
            {
                var reshape_data = [];
                for(var i = 0; i<prop_data.length; i+= num_x)
                {
                    reshape_data.push(prop_data.slice(i, i+num_x));
                }
                //data is one dimensional, we need to reshape it?
                var dataset = {
                    z: reshape_data,
                    type: type,
                    xaxis: "x",
                    yaxis: "y",
                    coloraxis: 'coloraxis',
                }
                data.push(dataset);
            }

            changeLayout(Object.assign(
                // Default values: pixels are 1:1 x:y, auto ranged colorscale
                {
                    zaxis: {
                        autorange: true
                    },
                    title:title,
                    autosize: true,
                    xaxis: {
                        constrain: 'domain',    // Where plot is reduced, scale axis domain to fit
                    },
                    yaxis: {
                        scaleanchor: 'x',       // Aspect ratio 1:1
                        scaleratio: 1,          // Aspect ratio 1:1
                        constrain: 'domain',    // Where plot is reduced, scale axis domain to fit
                    },
                    coloraxis: {
                        // Note: if you override coloraxis, these settings will be lost unless
                        // you duplicate them.
                        colorscale: colorscale, // This value overrides the colorscale in data
                    },
                },

                // Apply any overrides
                layout
            ));
        }

        changeData(data);

    }, [prop_data, layout]);

    return (
        <Plot data={data} layout={layout_state} debug={true} onRelayout={zoom_event_handler} config={{responsive: true}} style={{height: '100%', width:'100%'}} useResizeHandler={true}/>
    )
}
/* eslint-enable */

function HMHz() {
    const periodicEndpoint = useAdapterEndpoint("lokicarrier", process.env.REACT_APP_ENDPOINT_URL, 1000);
    const staticEndpoint = useAdapterEndpoint("lokicarrier", process.env.REACT_APP_ENDPOINT_URL);

    const [loki_connection_ok, set_loki_connection_ok] = useState(true);
    const [foundLoopException, setFoundLoopException] = useState(false);
    const [all_firefly_channels_enabled, set_all_firefly_channels_enabled] = useState(false);
    const [readout_cbar_min, set_readout_cbar_min] = useState(null);
    const [readout_cbar_max, set_readout_cbar_max] = useState(null);
    const [readout_cbar_autorange, set_readout_cbar_autorange] = useState(true);

    let power_board_present = periodicEndpoint.data?.control?.presence_detection.backplane;
    let power_board_init = periodicEndpoint.data?.application?.system_state.POWER_BOARD_INIT;
    let cob_present = periodicEndpoint.data?.control?.presence_detection.application;
    let cob_init = periodicEndpoint.data?.application?.system_state.COB_INIT;
    let sys_init_state = periodicEndpoint?.data?.application?.system_state.ENABLE_STATE;
    let sys_init_state_target = periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_TARGET;
    let sys_init_progress = (periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_PROGRESS[0] / periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_PROGRESS[1]) * 100;
    let sys_init_err = periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_ERROR;
    let sys_init_message = periodicEndpoint?.data?.application?.system_state.ENABLE_STATE_STATUS_MESSAGE;
    let hv_enabled = periodicEndpoint?.data?.application?.HV.ENABLE;
    let hv_saved = periodicEndpoint?.data?.application?.HV?.control_voltage_save;
    let hv_overridden = periodicEndpoint?.data?.application?.HV?.control_voltage_overridden;
    let hv_mismatch = periodicEndpoint?.data?.application?.HV?.monitor_control_mismatch_detected;
    let hv_bias_readback = Math.round(periodicEndpoint?.data?.application?.HV.readback_bias);
    let power_board_temp = periodicEndpoint?.data?.environment?.temperature?.POWER_BOARD;
    let block_temp = periodicEndpoint?.data?.environment?.temperature?.BLOCK;
    let diode_temp = periodicEndpoint?.data?.environment?.temperature?.DIODE;
    let dew_point = periodicEndpoint?.data?.environment?.temperature?.DEWPOINT;
    let humidity_rh = periodicEndpoint?.data?.environment?.humidity?.BOARD;
    let asic_init = periodicEndpoint?.data?.application?.system_state.ASIC_INIT;
    let asic_en = periodicEndpoint?.data?.application?.system_state.ASIC_EN;
    let asic_rebonding = periodicEndpoint?.data?.application?.system_state.ASIC_REBOND;
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

    let image_dat = periodicEndpoint.data?.application?.asic_settings?.segment_readout?.SEGMENT_DATA;
    let image_request_state = periodicEndpoint.data?.application?.asic_settings?.segment_readout?.REQUEST;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const image_dat_stable = useMemo(() => image_dat, [JSON.stringify(image_dat)]);

    let cal_dat = periodicEndpoint.data?.application?.asic_settings?.calibration_pattern?.DIRECT_MAP;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cal_dat_stable = useMemo(() => cal_dat, [JSON.stringify(cal_dat)]);

    return (
        <OdinApp title="HEXITEC-MHz UI" navLinks={["HEXITEC-MHz Control", "Debug Info", "LOKI System"]}>
            <Container fluid>
                <Row>
                    <LOKIConnectionAlert adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} set_loki_connection_state={set_loki_connection_ok} />
                </Row>
                <Row className="justify-content-md-center">
                    <Col sm={12} xl={4} xxl="auto" hidden={!loki_connection_ok}>
                        <HMHzPowerBoardSummaryCard loki_connection_state={loki_connection_ok} power_board_present={power_board_present} power_board_init={power_board_init} power_board_temp={power_board_temp} dew_point={dew_point} humidity_rh={humidity_rh} hv_enabled={hv_enabled} hv_bias_readback={hv_bias_readback} regs_en={regs_en} vddd_i={vddd_i} vdda_i={vdda_i} trip_info={trip_info} />
                    </Col>
                    <Col sm={12} xl={4} xxl={3} hidden={!loki_connection_ok}>
                        <HMHzCOBSummaryCard adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} cob_present={cob_present} cob_init={cob_init} block_temp={block_temp} diode_temp={diode_temp} asic_en={asic_en} asic_init={asic_init} fastdata_init={fastdata_init} fastdata_en={fastdata_en} asic_sync={asic_sync} ff1_pn={ff1_pn} ff2_pn={ff2_pn} />
                    </Col>
                    <Col sm="auto" xxl={5} hidden={!loki_connection_ok}>
                        <HMHzStateControl adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} sys_init_state={sys_init_state} sys_init_state_target={sys_init_state_target} sys_init_progress_perc={sys_init_progress} sys_init_err={sys_init_err} sys_init_message={sys_init_message} power_board_init={power_board_init} cob_init={cob_init} asic_init={asic_init} asic_rebonding={asic_rebonding} />
                    </Col>
                </Row>
                <Row hidden={!loki_connection_ok}>
                    <Col xxl={8} lg={12}>
                        <TitleCard title="Slow Readout">
                            <Row className="justify-content-md-center">
                                <Col md={8}>
                                    <HMHzReadoutRender image_dat={image_dat_stable} asic_init={asic_init} cbar_min={readout_cbar_min} cbar_max={readout_cbar_max} cbar_autorange={readout_cbar_autorange} image_request_state={image_request_state} fakedata={false}/>
                                </Col>
                                <Col md={4}>
                                    <HMHzReadoutSettings adapterEndpoint={periodicEndpoint} asic_init={asic_init} readout_cbar_min={readout_cbar_min} set_readout_cbar_min={set_readout_cbar_min} readout_cbar_max={readout_cbar_max} set_readout_cbar_max={set_readout_cbar_max} readout_cbar_autorange={readout_cbar_autorange} set_readout_cbar_autorange={set_readout_cbar_autorange}/>
                                </Col>
                            </Row>
                        </TitleCard>
                    </Col>
                    <Col xxl={4} lg="auto" style={{height: "55vh", overflowY: "auto"}}>
                        <HMHzAdvancedSettings adapterEndpoint={periodicEndpoint} loki_connection_state={loki_connection_ok} cob_init={cob_init} asic_init={asic_init} power_board_init={power_board_init} hv_enabled={hv_enabled} hv_bias_readback={hv_bias_readback} hv_saved={hv_saved} hv_overridden={hv_overridden} hv_mismatch={hv_mismatch} all_firefly_channels_enabled={all_firefly_channels_enabled} set_all_firefly_channels_enabled={set_all_firefly_channels_enabled} peltier_proportion={peltier_proportion} peltier_en={peltier_en} peltier_saved={peltier_saved} cal_dat={cal_dat_stable}/>
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
const PreAmpNegRangeDropdown = WithEndpoint(DropdownSelector);
function HMHzAdvancedSettings({adapterEndpoint, loki_connection_state, cob_init, asic_init, power_board_init, hv_enabled, hv_bias_readback, hv_saved, hv_overridden, hv_mismatch, all_firefly_channels_enabled, set_all_firefly_channels_enabled, peltier_proportion, peltier_en, peltier_saved, cal_dat}) {
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
    let negative_range = adapterEndpoint?.data?.application?.asic_settings?.negative_range;
    let negative_range_name = adapterEndpoint?.data?.application?.asic_settings?.negative_range_name;
    let frame_length = adapterEndpoint?.data?.application?.asic_settings?.frame_length;
    let integration_time = adapterEndpoint?.data?.application?.asic_settings?.integration_time;
    let cal_en = adapterEndpoint.data?.application?.asic_settings?.calibration_pattern?.ENABLE;

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
                                <StatusBadge label={feedback_capacitance + " fF (" + feedback_gain + ")"} type={feedback_capacitance ? "primary" : "warning"}/>
                            </Col>
                            <Col md="auto" hidden={!asic_init}>
                                <StatusBadge label={negative_range + " keV (" + negative_range_name + ")"} type={negative_range ? "primary" : "warning"}/>
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
                            <Col md="auto" hidden={!asic_init}>
                                <PreAmpNegRangeDropdown endpoint={adapterEndpoint} event_type="select" fullpath="application/asic_settings/negative_range" buttonText={Math.round(negative_range) + "keV (" + negative_range_name + ")"} variant="primary" >
                                    <Dropdown.Item eventKey={-20}>-20keV</Dropdown.Item>
                                    <Dropdown.Item eventKey={-10}>-10keV</Dropdown.Item>
                                </PreAmpNegRangeDropdown>
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
                            <Col md="auto" hidden={!asic_init || !cal_en}>
                                <StatusBadge label={cal_en ? "Pattern On" : "Pattern Off"} type={"primary"}/>
                            </Col>
                        </Row>
                    </Accordion.Header>
                    <Accordion.Body>
                        <HMHzCalpatternRender adapterEndpoint={adapterEndpoint} asic_init={asic_init} cal_en={cal_en} cal_dat={cal_dat}/>
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

function HMHzPowerBoardSummaryCard({loki_connection_state, power_board_present, power_board_init, power_board_temp, dew_point, humidity_rh, hv_enabled, hv_bias_readback, regs_en, vddd_i, vdda_i, trip_info}) {
    if (!loki_connection_state) {
        return (<></>)
    }

    let card_content;
    if (power_board_present && power_board_init) {

        // Trips
        let trip_names = Object.keys(trip_info);
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
                        <Icon.Thermometer />
                        Dew Point:
                    </Col>
                    <Col md="auto">
                        {(dew_point === null) && <StatusBadge label={"?"} type="warning"/>}
                        {(dew_point !== null) && <StatusBadge label={Math.round(dew_point) + "\u00b0C"} type="primary" />}
                        (
                        <StatusBadge label={Math.round(humidity_rh) + "%"} />
                        )
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
function HMHzCOBSummaryCard({adapterEndpoint, loki_connection_state, cob_present, cob_init, block_temp, diode_temp, asic_en, asic_init, fastdata_init, fastdata_en, asic_sync, ff1_pn, ff2_pn}) {
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
                    <Col md="auto">
                        Block:
                        <StatusBadge label={Math.round(block_temp) + "\u00b0C"} type={block_temp<50 ? "primary" : "danger"}/>
                    </Col>
                    <Col md={1}>
                        <Icon.Thermometer />
                    </Col>
                    <Col md="auto">
                        Diode:
                        {(diode_temp === null) && <StatusBadge label={"No Diode"} type="warning"/>}
                        {(diode_temp !== null) && <StatusBadge label={Math.round(diode_temp) + "\u00b0C"} type={diode_temp<50 ? "primary" : "danger"} />}
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
const RebondEndpointButton = WithEndpoint(Button);
function HMHzStateControl({adapterEndpoint, loki_connection_state, sys_init_progress_perc, sys_init_state, sys_init_state_target, sys_init_err, sys_init_message, power_board_init, cob_init, asic_init, asic_rebonding}) {
    if (!loki_connection_state) {
        return (<></>)
    }

    return (
        <TitleCard title="System Init">
            <Stack gap={3} direction="horizontal">
                <Stack gap={2}>
                    <Row>
                        <Col>
                            <ProgressBar now={sys_init_progress_perc} label={sys_init_state} variant={sys_init_err ? "danger" : sys_init_progress_perc === 100 ? "success" : "primary"} striped={sys_init_state !== sys_init_state_target ? true : false} animated={sys_init_state !== sys_init_state_target ? true : false}/>
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Col md="auto">
                            <PowerBoardInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="PWR_DONE" variant={power_board_init ? "success" : "outline-primary"} size="sm">
                                {power_board_init && <Icon.Repeat size={20} />}
                                {sys_init_state === "PWR_INIT" && <Spinner animation="border" size="sm" />}
                                {power_board_init ? " Re-init Power Board" : " Init Power Board"}
                            </PowerBoardInitEndpointButton>
                        </Col>
                        <Col md="auto">
                            <COBInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="COB_DONE" variant={cob_init ? "success" : "outline-primary"} size="sm">
                                {cob_init && <Icon.Repeat size={20} />}
                                {sys_init_state === "COB_INIT" && <Spinner animation="border" size="sm" />}
                                {cob_init ? " Re-init COB" : " Init COB"}
                            </COBInitEndpointButton>
                        </Col>
                        <Col md="auto">
                            <ASICInitEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ENABLE_STATE" value="ASIC_DONE" variant={asic_init ? "success" : "outline-primary"} size="sm">
                                {asic_init && <Icon.Repeat size={20} />}
                                {sys_init_state === "ASIC_INIT" && <Spinner animation="border" size="sm" />}
                                {asic_init ? " Re-init ASIC" : " Init ASIC"}
                            </ASICInitEndpointButton>
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Col>
                            <Alert variant="danger" show={sys_init_err}>
                                {sys_init_err}
                            </Alert>
                            <Alert variant="info" show={(!sys_init_err)}>
                                {sys_init_message}
                            </Alert>
                        </Col>
                        <Col md="auto" hidden={!(sys_init_state == "ASIC_DONE") || !(asic_init)}>
                            <RebondEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/system_state/ASIC_REBOND" value={true} variant={asic_rebonding ? "outline-primary" : "primary"} size="sm">
                                {asic_rebonding && <Spinner animation="border" size="sm" />}
                                {" Re-bond"}
                            </RebondEndpointButton>
                        </Col>
                    </Row>
                </Stack>
                <Stack gap={1}>
                    <Row>
                        <Col md={12}>
                            <SyncEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Data SYNC" fullpath="application/system_state/SYNC" checked={adapterEndpoint.data.application?.system_state?.SYNC} value={adapterEndpoint.data.application?.system_state?.SYNC} />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <RegsEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Regulators" fullpath="application/system_state/REGS_EN" checked={adapterEndpoint.data.application?.system_state?.REGS_EN} value={adapterEndpoint.data.application?.system_state?.REGS_EN} />
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <ASICEnEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="ASIC Enable" fullpath="application/system_state/ASIC_EN" checked={adapterEndpoint.data.application?.system_state?.ASIC_EN} value={adapterEndpoint.data.application?.system_state?.ASIC_EN} />
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
                    <Row className="justify-content-md-center">
                        <Col md="auto">
                            <HVEnableEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="HV Enable" fullpath="application/HV/ENABLE" checked={hvinfo?.ENABLE} value={hvinfo?.ENABLE} />
                        </Col>
                        <Col md="auto" hidden={true}>
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
                                <StatusBox label="">{hvinfo?.target_bias?.toFixed(2) + " v"}</StatusBox>
                            </Col>
                        </Row>
                        <Row hidden={true}>
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
                <Col hidden={true}>
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
                <PeltierEnEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Peltier Enable" fullpath="application/peltier/enable" checked={peltier_info?.enable} value={peltier_info?.enable} />
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

function HMHzReadoutRender({image_dat, asic_init, cbar_min, cbar_max, cbar_autorange, image_request_state, fakedata=false}) {
    const layout_stable = useMemo(() => {
        // Override the default layout with a reduced colorscale  range.
        const layout_new = {
            'coloraxis': {
                'colorscale': 'Viridis',
            },
            'height': 500,
        };

        if (cbar_min !== null && cbar_min !== '' && cbar_max !== null && cbar_max !== '' && !cbar_autorange) {
            Object.assign(layout_new['coloraxis'], {'cmin':Number(cbar_min)});
            Object.assign(layout_new['coloraxis'], {'cmax':Number(cbar_max)});
        }

        console.debug('updated readout layout: ', layout_new);
        return layout_new;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cbar_min, cbar_max, cbar_autorange, image_dat]);

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

    return (
        <Row>
            <Col hidden={image_request_state}>
                {(image_dat !== undefined && image_dat !== null) && <OdinGraph title='HEXITEC-MHz Sensor SPI Readback' type='heatmap' prop_data={image_dat} colorscale='Viridis' layout={layout_stable}/>}
            </Col>
        </Row>
    )
}

const ReadoutStartEndpointButton = WithEndpoint(Button);
const SegmentSelectDropdown = WithEndpoint(DropdownSelector);
const SegmentTriggerEndpointButton = WithEndpoint(Button);
function HMHzReadoutSettings({adapterEndpoint, asic_init, readout_cbar_min, set_readout_cbar_min, readout_cbar_max, set_readout_cbar_max, readout_cbar_autorange, set_readout_cbar_autorange}) {
    const [segment_trigger, set_segment_trigger] = useState(null);

    if (!asic_init) {
        return (<></>)
    }

    let request_state = adapterEndpoint.data?.application?.asic_settings?.segment_readout?.REQUEST;
    let current_segment = adapterEndpoint.data?.application?.asic_settings?.segment_readout?.SEGMENT_SELECT;

    const update_segment_trigger = (event) => {
        set_segment_trigger(+event.target.value);
    }

    return (
        <TitleCard title="Readout Settings">
            <TitleCard title="Request">
                <Stack gap={2} direction="vertial">
                    <Row>
                        <Col>

                            <SegmentSelectDropdown endpoint={adapterEndpoint} event_type="select" fullpath="application/asic_settings/segment_readout/SEGMENT_SELECT" buttonText={current_segment === 20 ? "All Segments" : "Segment " + current_segment} variant="primary" >
                                <Dropdown.Item eventKey={20}>All Segments</Dropdown.Item>
                                <Dropdown.Item eventKey={0}>Segment 0</Dropdown.Item>
                                <Dropdown.Item eventKey={1}>Segment 1</Dropdown.Item>
                                <Dropdown.Item eventKey={2}>Segment 2</Dropdown.Item>
                                <Dropdown.Item eventKey={3}>Segment 3</Dropdown.Item>
                                <Dropdown.Item eventKey={4}>Segment 4</Dropdown.Item>
                                <Dropdown.Item eventKey={5}>Segment 5</Dropdown.Item>
                                <Dropdown.Item eventKey={6}>Segment 6</Dropdown.Item>
                                <Dropdown.Item eventKey={7}>Segment 7</Dropdown.Item>
                                <Dropdown.Item eventKey={8}>Segment 8</Dropdown.Item>
                                <Dropdown.Item eventKey={9}>Segment 9</Dropdown.Item>
                                <Dropdown.Item eventKey={10}>Segment 10</Dropdown.Item>
                                <Dropdown.Item eventKey={11}>Segment 11</Dropdown.Item>
                                <Dropdown.Item eventKey={12}>Segment 12</Dropdown.Item>
                                <Dropdown.Item eventKey={13}>Segment 13</Dropdown.Item>
                                <Dropdown.Item eventKey={14}>Segment 14</Dropdown.Item>
                                <Dropdown.Item eventKey={15}>Segment 15</Dropdown.Item>
                                <Dropdown.Item eventKey={16}>Segment 16</Dropdown.Item>
                                <Dropdown.Item eventKey={17}>Segment 17</Dropdown.Item>
                                <Dropdown.Item eventKey={18}>Segment 18</Dropdown.Item>
                                <Dropdown.Item eventKey={19}>Segment 19</Dropdown.Item>
                            </SegmentSelectDropdown>
                        </Col>
                        <Col>
                            <ReadoutStartEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/asic_settings/segment_readout/REQUEST" value={true} variant={!request_state ? "success" : "outline-primary"}>
                                {request_state && <Spinner animation="border" size="sm" />}
                                New Image
                            </ReadoutStartEndpointButton>
                        </Col>
                    </Row>
                    <Row>
                        <InputGroup>
                            <InputGroup.Text>Pixel Value Trigger</InputGroup.Text>
                            <Form.Control type="number" onChange={update_segment_trigger} defaultValue={adapterEndpoint?.data?.application?.asic_settings?.segment_readout?.TRIGGER}/>
                            <SegmentTriggerEndpointButton endpoint={adapterEndpoint} event_type="click" fullpath="application/asic_settings/segment_readout/TRIGGER" value={segment_trigger}>Set</SegmentTriggerEndpointButton>
                        </InputGroup>
                    </Row>
                </Stack>
            </TitleCard>
            <TitleCard title="Plot">
                <Stack>
                    <Row>
                        <InputGroup>
                            <Form.Check label="Auto-scale Colour Range" checked={readout_cbar_autorange} defaultValue={readout_cbar_autorange} onChange={(event) => {set_readout_cbar_autorange(Boolean(event.target.checked))}} />
                        </InputGroup>
                        <InputGroup hidden={readout_cbar_autorange}>
                            <InputGroup.Text>Colour Range</InputGroup.Text>
                            <Form.Control type="number" disabled={readout_cbar_autorange} onChange={(event) => {set_readout_cbar_min(Number(event.target.value))}} defaultValue={Number(readout_cbar_min)}/>
                            <Form.Control type="number" disabled={readout_cbar_autorange} onChange={(event) => {set_readout_cbar_max(Number(event.target.value))}} defaultValue={Number(readout_cbar_max)}/>
                        </InputGroup>
                    </Row>
                </Stack>
            </TitleCard>
        </TitleCard>
    )
}

const CalibrationEnableEndpointToggleSwitch = WithEndpoint(ToggleSwitch);
const CalModeDropdown = WithEndpoint(DropdownSelector);
function HMHzCalpatternRender({adapterEndpoint, asic_init, cal_en, cal_dat}) {
    if (!asic_init) {
        return (<></>);
    }

    let cal_mode_info = adapterEndpoint.data?.application?.asic_settings?.calibration_pattern?.MODES;
    let cal_mode_current = adapterEndpoint.data?.application?.asic_settings?.calibration_pattern?.MODE;

    let cal_mode_names = Object.keys(cal_mode_info);
    console.debug('cal_mode_names ' + cal_mode_names);
    let cal_dropdown_items = cal_mode_names.map((cal_mode_name) => {
        return (
            <Dropdown.Item eventKey={cal_mode_name}>{cal_mode_name}</Dropdown.Item>
        );
    });
    console.debug(cal_dropdown_items);

    return (
        <Container>
            <Stack gap={1} direction="vertical">
                <Row className="justify-content-md-center">
                    <Col>
                    <CalibrationEnableEndpointToggleSwitch endpoint={adapterEndpoint} event_type="click" label="Calibration Pattern Enable" fullpath="application/asic_settings/calibration_pattern/ENABLE" checked={cal_en} value={cal_en} />
                    </Col>
                    <Col>
                        <CalModeDropdown endpoint={adapterEndpoint} event_type="select" fullpath="application/asic_settings/calibration_pattern/MODE" buttonText={"Mode: " + cal_mode_current} variant="primary" >
                            {cal_dropdown_items}
                        </CalModeDropdown>
                    </Col>
                </Row>
                <Row className="justify-content-md-center">
                    <HMHzCalpatternPresetConfig adapterEndpoint={adapterEndpoint} presetConfig={adapterEndpoint.data?.application?.asic_settings?.calibration_pattern?.MODES?.PRESET} />
                </Row>
                <Row>
                    <Col>
                        {(cal_dat !== undefined && cal_dat !== null) && <OdinGraph title='Calibration Pattern' type='heatmap' prop_data={cal_dat} num_x={80} colorscale="Viridis" layout={{'height':400}} />}
                    </Col>
                </Row>
            </Stack>
        </Container>
    )
}

const PresetSelectDropdown = WithEndpoint(DropdownSelector);
function HMHzCalpatternPresetConfig({adapterEndpoint, presetConfig}) {
    let presets_available = presetConfig?.AVAIL;
    let current_preset = presetConfig?.SELECT;
    let dropdown_items = presets_available.map((preset_name) => {
        return (
            <Dropdown.Item eventKey={preset_name}>{preset_name}</Dropdown.Item>
        );
    });

    return (
        <TitleCard title="Preset Config">
            <PresetSelectDropdown endpoint={adapterEndpoint} event_type="select" fullpath="application/asic_settings/calibration_pattern/MODES/PRESET/SELECT" buttonText={current_preset} >
                {dropdown_items}
            </PresetSelectDropdown>
        </TitleCard>
    )
}

export default HMHz;
