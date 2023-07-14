const { SBFParser: Parser } = require('sbf-parser')

module.exports = function(RED) {

  const isString = value => typeof value === 'string' || value instanceof String
  const isBoolean = value => typeof value == "boolean"

  // Component
  function SBFParser(config) {
    RED.nodes.createNode(this, config)
    const node = this

    const { name, firmware, memory } = config
    node.name = name
    node.firmware = firmware
    node.memory = memory
    
    try {
      node.parser = new Parser(firmware, memory)
      node.status = ({
        fill: "green",
        shape: "dot",
        text: node.firmware
      })
    } catch (err) {
      node.status = ({
        fill: "red",
        shape: "dot",
        text: "disable"
      })
    }

    const addData = data => node.parser.addData(data)

    const getData = () => node.parser.getFrames()

    const setMemory = memory => { node.parser.memory = memory }

    node.on('input', (msg, send, done) => {
      let error = null
      const { command, payload } = msg
      switch(command) {
        // DATA --------------------------------------
        case 'addData':
          if (Buffer.isBuffer(payload)) {
            addData(payload)
          }
          send(null)
          break
        case 'getData':
          msg.payload = getData()
          send(msg)
          break
        // FIRMWARE ---------------------------------
        case 'setFirmware':
          if (isString(payload)) {
            const previousFirmware = node.parser.firmware
            try {
              node.parser.firmware = payload
            } catch (err) {
              error = err
              node.parser.firmware = previousFirmware
            }
          }
          send(null)
          break
        case 'getFirmware':
          msg.payload = node.parser.firmware
          send(msg)
          break
        // MEMORY ------------------------------------
        case 'setMemory':
          if (isBoolean(payload)) {
            node.parser.memory = payload
          }
          send(null)
          break
        case 'getMemory':
          msg.payload = node.parser.memory
          send(msg)
          break
      }
      // Finish
      if (done) { 
        (error === null ) ? done(error) : done()
      }
    })
  }
  // Register
  RED.nodes.registerType('sbf-parser', SBFParser)
}
