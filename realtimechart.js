function init(canvas, params) {
  if (typeof canvas === 'string') canvas = document.getElementById(canvas)
  var ctx = canvas.getContext('2d')

  params = params || {}
  params.width = params.width || 300
  params.height = params.height || 40


  canvas.width = params.width
  canvas.height = params.height

  var interval = params.interval || 10000

  // add initial data if available
  var data = params.data || []
  data.sort(function (a, b) {
    if (a.time < b.time) return -1
    if (a.time > b.time) return 1
    return 0
  })

  var seed = 1
  function random () {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x)
  }

  var ticks = 0
  var tpp = (interval / canvas.width) | 0

  // add initial fake data
  //for (var i = 0; i < 100; i++) {
  //  data.push({
  //    value: 10 + random() * 20,
  //    time: Date.now() - tpp * 10 * i
  //  })
  //}
  //data.reverse()

  function clear () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function drawBorder () {
    ctx.strokeStyle = '#000'
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
  }

  function tti (time) {
    var delta = Date.now() - time
    return delta / tpp
  }

  // group values near each other as one
  function compressData () {
    var newData = []
    var time = data[0]
    var sum = 0
    var count = 0
    for (var i = 0; i < data.length; i++) {
      var o = data[i]

      if (o.time <= time) {
        sum += o.value
        count++
      } else {
        newData.push({
          time: time,
          value: sum / count
        })

        sum = o.value
        count = 1
        time = o.time
      }
    }
    newData.push({
      time: time,
      value: sum / count
    })

    data = newData
  }

  function plotData () {
    ctx.strokeStyle = '#394'

    var origin = {
      x: canvas.width,
      y: canvas.height
    }

    // apply offset
    if (params.offset) origin.x += (params.offset / tpp)

    ctx.beginPath()

    if (params.bound) ctx.moveTo(origin.x, origin.y)

    for (var i = 1; i < data.length; i++) {
      var d = data[data.length - i]
        var value = d.value
        var time = d.time - (d.time % tpp)

        var to = {
          x: origin.x - tti(time),
          y: canvas.height - value * .5
        }
      ctx.lineTo(to.x, to.y)
    }

    ctx.stroke()
  }

  function render () {
    clear()
    console.log('before compress lenth: %s', data.length)
    compressData()
    console.log('after compress length: %s', data.length)
    plotData()
    console.log('plot length: %s', data.length)
    drawBorder()
  }

  function insertData (value, time) {
    var o = {
      value: value,
      time: time
    }

    for (var i = data.length - 1; i > 0; i--) {
      var d = data[i]
      if (time > d.time) {
        data.splice(i + 1, 0, o)
        return
      }
    }

    data.push(o)
  }

  function tick () {
    var now = Date.now()

    ticks++

    if (ticks % tpp === 0) {
      if (params.flat) insertData(1, now + tpp * tpp)
    }
    //insertData(random() * 25, now + 500 * random())

    var index = 0
    while (data[index] && data[index].time < (now - interval * 1)) {
      index++
    }
    data = data.slice(Math.max(index - 2, 0))

    render()
    setTimeout(tick, tpp)
  }
  tick()

  render()

  var ctrl = {
    insertData: insertData
  }


  return ctrl
}

module = module || {}
module.exports = init
