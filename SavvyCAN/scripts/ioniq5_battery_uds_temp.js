// Script to dump the battery health/state using the SavvyCAN scripting interface
// based on https://github.com/maciek16c/hyundai-santa-fe-phev-battery/blob/main/uds.js
// and data from https://docs.google.com/spreadsheets/d/1eT2R8hmsD1hC__9LtnkZ3eDjLcdib9JR-3Myc97jy8M/edit#gid=246048743
// and https://github.com/Esprit1st/Hyundai-Ioniq-5-Torque-Pro-PIDs


var battery_temp1=0
var battery_temp2=0
var battery_temp3=0
var battery_temp4=0
var temp_x1=0
var temp_x2=0
var temp_x3=0
var temp_x4=0
var battery_inlet_temp=0
var coolant_temp=0

var received =1
var counter = 0
var id = 0x101

const c2f = (c) => (c * 9/5) + 32

function setup ()
{
    host.log("Hyundai/Kia e-GMP Battery temperature dump");
    host.setTickInterval(10);
    uds.setFilter(0x7EC, 0x7FF, 0)
    host.addParameter("battery_temp1")
    host.addParameter("battery_temp2")
    host.addParameter("battery_temp3")
    host.addParameter("battery_temp4")
    host.addParameter("temp_x1")
    host.addParameter("temp_x2")
    host.addParameter("temp_x3")
    host.addParameter("temp_x4")
    host.addParameter("battery_inlet_temp")
    host.addParameter("coolant_temp")
}

const dump_101 = (data) => {

    var battery_max_temp = data[17];
    var battery_min_temp = data[18];
    battery_temp1 = data[19];
    battery_temp2 = data[20];
    battery_temp3 = data[21];
    battery_temp4 = data[22];
    battery_inlet_temp = data[25];  // ?? shows 260.6F (127c) with 41F ambient

    var isolation_resistance = data[60]*(2^8)+data[61]

    host.log(" iso_r: " + isolation_resistance.toString(10) + "kOhm");  
    
    host.log(" min_temp: " + c2f(battery_min_temp) + "F max_temp: " + c2f(battery_max_temp) + "F"
        + " inlet_temp: " + c2f(battery_inlet_temp) + "F"
        + " temp1: " + c2f(battery_temp1) + "F temp2: " + c2f(battery_temp2) + "F" 
        + " temp3: " + c2f(battery_temp3) + "F temp4: " + c2f(battery_temp4) + "F")
}

const dump_105 = (data) => {
    temp_x1 = data[15] // ??
    temp_x2 = data[41] // ??
    host.log("temp x1: " + c2f(temp_x1) + "F temp x2: " + c2f(temp_x2) + "F")
}
const dump_106 = (data) => {
    coolant_temp = data[7]
    temp_x3 = data[9] // ??
    temp_x4 = data[23]
    
    host.log("coolant temp: " + c2f(coolant_temp) + "F" + " temp x3: " + c2f(temp_x3) + "F"  + " temp 4: " + c2f(temp_x4) + "F")
}

// decoding using https://docs.google.com/spreadsheets/d/1eT2R8hmsD1hC__9LtnkZ3eDjLcdib9JR-3Myc97jy8M/edit#gid=246048743
// and https://github.com/Esprit1st/Hyundai-Ioniq-5-Torque-Pro-PIDs
function gotUDSMessage(bus, id, service, subFunc, len, data)
{
    received =1;
    var data_id = data[1]*256+data[2];
    //host.log("bus=" + bus + " id=" + id + " service=" + service + " subFunc=" + subFunc + " len= " + len + " data_id=0x" + data_id.toString(16))
    if (data_id==0x101) {
        dump_101(data)
    } else if (data_id==0x105) {
        dump_105(data)
    } else if (data_id==0x106) {
        dump_106(data)
    } else {
        // 0x107, 108, 2231
        //host.log("got id " + data_id.toString(16) + " len=" + len + " ??????????");
    }
}

function tick()
{
    if (received ==1) {
        uds.sendUDS(0, 0x7e4, 0x22, 2, id, 0, 0)
        received = 0
        id +=1

        if (id >0x106) { // gets up to 0x0106 before repeating
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