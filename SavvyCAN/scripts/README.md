# CAN messages
At the time of writing this ~12/2023, you need to use hardware that supports CAN-FD as well as have a development build of SavvyCAN to be able to read messages from the battery. There are currently problems with the EVTV can_due and esp32_can library with CAN-FD at 500k.

I used a [Canable V2](https://canable.io) and the LAWICEL serial interface.

The CAN-FD bus speed is 500k, and the data speed is 2M