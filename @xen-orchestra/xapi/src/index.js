const { utcFormat, utcParse } = require('d3-time-format')
const { Xapi: Base } = require('xen-api')

// VDI formats. (Raw is not available for delta vdi.)
exports.VDI_FORMAT_RAW = 'raw'
exports.VDI_FORMAT_VHD = 'vhd'

// Format a date (pseudo ISO 8601) from one XenServer get by
// xapi.call('host.get_servertime', host.$ref) for example
exports.formatDateTime = utcFormat('%Y%m%dT%H:%M:%SZ')
exports.parseDateTime = utcParse('%Y%m%dT%H:%M:%SZ')

class Xapi extends Base {
  constructor({ maxUncoalescedVdis, ...opts }) {
    super(opts)
    this._maxUncoalescedVdis = maxUncoalescedVdis
  }
}
function mixin(mixins) {
  const xapiProto = Xapi.prototype
  const {
    defineProperty,
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
  } = Object
  Object.keys(mixins).forEach(prefix => {
    const mixinProto = mixins[prefix].prototype
    getOwnPropertyNames(mixinProto)
      .filter(_ => _ !== 'constructor')
      .forEach(name => {
        defineProperty(
          xapiProto,
          `${prefix}_${name}`,
          getOwnPropertyDescriptor(mixinProto, name)
        )
      })
  })
}
mixin({
  VDI: require('./vdi'),
  VM: require('./vm'),
  task: require('./task'),
})
exports.Xapi = Xapi
