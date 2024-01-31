// Script to dump the battery health/state using the SavvyCAN scripting interface
// based on https://github.com/maciek16c/hyundai-santa-fe-phev-battery/blob/main/uds.js
// and data from https://docs.google.com/spreadsheets/d/1eT2R8hmsD1hC__9LtnkZ3eDjLcdib9JR-3Myc97jy8M/edit#gid=246048743
// and https://github.com/Esprit1st/Hyundai-Ioniq-5-Torque-Pro-PIDs


var enable_uds =1;
var received =1;
var counter = 0;
var id = 0x101;
const cellVoltages = Array(192).fill(0)

function int16(v) {
    return (v << 16) >>16;
}

const c2f = (c) => (c * 9/5) + 32

function setup ()
{
    host.log("Hyundai/Kia e-GMP Battery data cell dump");
    host.setTickInterval(10);
    uds.setFilter(0x7EC, 0x7FF, 0)
}

const save_cell_voltages = (data, dataOffset, cellOffset, cnt) => {
    for (let i=0; i < cnt; i++) {
        const c = data[dataOffset + i]/50
        cellVoltages[cellOffset + i] = c
    }
}

const logCellVoltages = (start, end) => {
    //host.log(cellVoltages)
    var found = false
    for (let i=start-1; i < end; i++) { // 180 on 72.6kWh
        if ( cellVoltages[i] < 0.5 ) {
            found = true
            break
        }
    }

    if ( found ) {
        host.log('cell voltages (v):\n')
        let out = ''
        for (let i=start-1; i < end; i++) { // 180 on 72.6kWh
            const o = i + 1
            out += o.toString().padStart(3, '0') + ": " + cellVoltages[i].toString().padEnd(4, '0') + "    "
            if ( o%8 == 0 ) {
                host.log(out)
                out = ''
            }
        }
    }
    
   // host.log("cell voltages (v):\n" + out)
}

/*
    Battery options:
    58 kWh: 24 modules (288 cells) 144 cell voltages
    72.6 kWh: 30 modules (360 cells) it's 360/2 = 180 since each module has 2 parallel
    77.4 kWh: 32 modules (384 cells) 192 cell voltages
*/

// contains cell 1-32 voltages starting at data[7]
const dump_102 = (data) => {
    save_cell_voltages(data, 7, 0, 32)
    logCellVoltages(1, 32)
}

// contains cell 33-64 voltages starting at data[7]
const dump_103 = (data) => {
    save_cell_voltages(data, 7, 32, 32)
    logCellVoltages(33, 64)
}
// contains cell 65-96 voltages starting at data[7]
const dump_104 = (data) => {
    //const out = dump_cell_voltages(data, 7, 64, 32)
    //host.log("cell voltages (v):\n" + out)
    save_cell_voltages(data, 7, 64, 32)
    logCellVoltages(65, 96)
}
// contains cell 97-128 voltages starting at data[7]
const dump_10A = (data) => {
    //const out = dump_cell_voltages(data, 7, 96, 32)
    //host.log("cell voltages (v):\n" + out)
    save_cell_voltages(data, 7, 96, 32)
    logCellVoltages(97, 128)
}
// contains cell 129-160 voltages starting at data[7]
const dump_10B = (data) => {
    //const out = dump_cell_voltages(data, 7, 128, 32)
    //host.log("cell voltages (v):\n" + out)
    save_cell_voltages(data, 7, 128, 32)
    logCellVoltages(129, 160)
}
// contains cell 161-192 voltages starting at data[7]
const dump_10C = (data) => {
    //const out = dump_cell_voltages(data, 7, 160, 32)
    //host.log("cell voltages (v):\n" + out)
    save_cell_voltages(data, 7, 160, 20) // 32
    logCellVoltages(161,180) //192
    // does not seem to be able to log that much
    //logCellVoltages(1, 192)
}


// decoding using https://docs.google.com/spreadsheets/d/1eT2R8hmsD1hC__9LtnkZ3eDjLcdib9JR-3Myc97jy8M/edit#gid=246048743
// and https://github.com/Esprit1st/Hyundai-Ioniq-5-Torque-Pro-PIDs
function gotUDSMessage(bus, id, service, subFunc, len, data)
{
    received =1;
    var data_id = data[1]*256+data[2];
    //host.log("bus=" + bus + " id=" + id + " service=" + service + " subFunc=" + subFunc + " len= " + len + " data_id=0x" + data_id.toString(16))
    if (data_id==0x102) {
        dump_102(data)
    } else if (data_id==0x103) {
        dump_103(data)
    } else if (data_id==0x104) {
        dump_104(data)
    } else if (data_id==0x10A) {
        dump_10A(data)
    } else if (data_id==0x10B) {
        dump_10B(data)
    } else if (data_id==0x10C) {
        dump_10C(data)
    } else {
        // 0x107, 108, 2231
        //host.log("got id " + data_id.toString(16) + " len=" + len + " ??????????");
    }
}

function tick()
{
    if (enable_uds == 1  &&  received ==1) {
        uds.sendUDS(0, 0x7e4, 0x22, 2, id, 0, 0)
        received = 0
        id +=1

        if (id >0x10C) { // gets up to 0x010C before repeating
            id=0x101
        }
    }

    // at 10ms tick intervaal, this triggers the sendUDS every second
    counter +=1;
    if (counter >100) {
        received =1
        counter=0
    }
}