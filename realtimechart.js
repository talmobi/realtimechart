function init (canvas, opts) {
  var log = function (s) {
    //console.log(s)
  }

  var canvas = (typeof canvas === 'string') ? document.getElementById(canvas) : canvas
  if (!canvas) return
  var ctx = canvas.getContext('2d')
  var api = null
  var timeout = null

  var defaults = {
    width: 300,
    height: 40
  }

  var opts = opts || {}

  var init = function (canvas, initData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    var __running = true

    var w = canvas.width
    var h = canvas.height

    var offset = typeof opts.offset === 'number' ? opts.offset : 1000 // in ms

    var ticks = 0
    var line_width = opts.line_width || 8

    ctx.fillRect(0, 0, w, h)

    function clear () {
      ctx.clearRect(0,0,w,h)
    }

    clear()

    function drawBorder () {
      ctx.strokeStyle = "black"
      ctx.strokeRect(0,0,w,h)
    }

    var scale = function (min, max) {
      return function (val) {
        return Math.max(0.0, Math.min(1.0, ((min + val) / max)))
      }
    }

    var yScale = scale(0, h)

    var interval = opts.interval || 10000 // ms
    var pps = canvas.width / (interval / 1000) // pixels per second

    var tpp = interval / canvas.width // time per pixel (= 50ms)

    // right offset
    var offset_len = Math.ceil((offset / tpp) / line_width) + 1

    // left offset, smoothes out exits
    var buf_left = 1

    var data = []
    for (var i = 0; i < Math.ceil(((canvas.width / line_width) + buf_left) + offset_len); i++) {
      var v = (i * 2) % 10
      v = 0
      data.push({value: v, time: tpp * i })
    }

    if (initData && (initData instanceof Array) && initData.length) {
      log('------------- INIT DATA FOUND --------------')
      log('init data length: %s', initData.length)
      var _id = initData.slice(initData.length - data.length)
      var len = Math.min(initData.length, data.length)
      for (var i = 0; i < len; i++) {
        var d = _id[i]
        //addValue(d.value, d.time)
        data.push(d)
        data.shift()
      }
    }

    log('data.length at init: %s', data.length)

    var timeToIndex = function (time) {
      var delta = (Date.now() - time)
      var index = Math.floor((delta / tpp) / line_width)
      //log("index: " + index)
      return index
    }

    var TICKS_PER_SECOND = pps
    var MS_PER_TICK = 1000 / TICKS_PER_SECOND

    var startTime = Date.now()

    var origin = {
      x: w,
      y: h,
    }

    function addValue (value, time) {
      time = time || Date.now()
      value = value || 0

      var index = timeToIndex(time)
      var t = data.length - index - 1
      if (t < data.length && t >= 0) {
        data[t].value += value
      }
    }

    function render () {
      var xoff = ticks % line_width
      xoff -= line_width

      var d = data.slice(0, data.length - offset_len + buf_left).reverse()

      ctx.strokeStyle = "green"
      // draw all data points
      ctx.beginPath()
      ctx.moveTo(origin.x - xoff, origin.y)

      // calculate new ySclale (based around max value)
      var yMax = 1
      for (var i = 0; i < d.length; i++) {
        var v = Number(d[i].value)
        if (v > yMax) {
          yMax = v
        }
      }
      //log("ymax: %s", yMax)
      yScale = scale(0, yMax * 1.25)

      for (var i = 0; i < d.length; i++) {
        var point = d[i]
        var to = {
          x: origin.x - i * line_width,
          y: origin.y - point.value,
        }

        to.y = origin.y - yScale(point.value) * h

        ctx.lineTo(to.x - xoff, to.y)
      }

      ctx.stroke()

    }

    function tick () {
      ticks++
      clear()

      if (ticks % line_width === 0) {
        data.push({value: 0, time: Date.now()})
        data.shift()
      }

      render()
      drawBorder()

      if (__running) {
        timeout = setTimeout(tick, MS_PER_TICK)
      }
    }

    tick()

    log('get end len: %s', data.length)

    return {
      addData: function (value, time) {
        addValue(value, time) // epochTime
      },
      getData: function () {
        return data.slice()
      },
      data: data,
      stop: function () {
        __running = false
      }
    }
  } // init

  function resize (params) {
    var opts = Object.assign({}, defaults, params)
    log('resizing: %sx%s', opts.width, opts.height)

    if (params.size === 'auto') {
      log('------------ IS AUTO ----------')
      opts.width = 'auto'
      opts.height = 'auto'
    }

    canvas.width = opts.width
    canvas.height = opts.height

    log('cw: %s, ch: %s', canvas.width, canvas.height)

    canvas.style.width = canvas.style.height = 'auto'

    if (opts.width === 'auto') {
      canvas.style.width = "100%"
      canvas.width = canvas.offsetWidth || 300
      log('offsetWidth: %s', canvas.offsetWidth)
    }

    if (opts.height === 'auto') {
      canvas.style.height = "100%"
      canvas.height = canvas.offsetHeight || 40
      canvas.style.marginTop = "4px"
      log('offsetHeight: %s', canvas.offsetHeight)
    }
  }
  resize(opts)

  var _opts = opts
  setTimeout(function () {
    resize(opts)
    update()
  }, 0)

  var update = function () {
    var _d = api.getData()
    api.stop()
    clearTimeout(timeout)
    log('UPDATE LENGTH: %s', _d.length)
    var _api = init(canvas, _d)
    api.addData = _api.addData
    api.stop = _api.stop
    api.getData = _api.getData
  }

  var _api = init(canvas)
  api = {
    addData: _api.addData,
    getData: function () {
      return _api.getData()
    },
    stop: _api.stop,
    update: function () {
      return update()
    },
    resize: function (opts) {
      resize(opts || {width: 'auto', height: 'auto'})
      update()
    }
  }

  return api
}

if (typeof module !== 'undefined' && module.exports) moduel.exports = init
