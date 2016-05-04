function init (canvas, opts) {
  var canvas = (typeof canvas === 'string') ? document.getElementById(canvas) : canvas;
  var ctx = canvas.getContext('2d');
  var api = null;
  var timeout = null;

  var opts = opts || {};

  // resize
  //window.addEventListener('resize', function () {
  //  if (canvas) {
  //    //var new_width = canvas.parentNode.clientWidth;
  //    var new_width = window.innerWidth;
  //    if (canvas.width == new_width) {
  //      // skip
  //    } else {
  //      canvas.width = new_width;
  //      api.stop();
  //      clearTimeout(timeout);
  //      var _api = resize(canvas);
  //      api.addData = _api.addData;
  //      api.stop = _api.stop;
  //    }
  //  }
  //});

  var resize = function (canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var __running = true;

    var w = canvas.width;
    var h = canvas.height;


    var offset = typeof opts.offset === 'number' ? opts.offset : 1000; // in ms

    var ticks = 0;
    var line_width = opts.line_width || 8;

    ctx.fillRect(0, 0, w, h);

    function clear () {
      ctx.clearRect(0,0,w,h);
    };

    clear();

    function drawBorder () {
      ctx.strokeStyle = "black";
      ctx.strokeRect(0,0,w,h);
    };

    var scale = function (min, max) {
      return function (val) {
        return Math.max(0.0, Math.min(1.0, ((min + val) / max)));
      };
    };

    var yScale = scale(0, h);

    var interval = opts.interval || 10000; // ms
    var pps = canvas.width / (interval / 1000); // pixels per second

    var tpp = interval / canvas.width; // time per pixel (= 50ms)

    // right offset
    var offset_len = Math.ceil((offset / tpp) / line_width) + 1;

    // left offset, smoothes out exits
    var buf_left = 1;


    var data = [];
    for (var i = 0; i < Math.ceil(((canvas.width / line_width) + buf_left) + offset_len); i++) {
      var v = (i * 2) % 10;
      v = 0;
      data.push({value: v, time: tpp * i });
    }

    var timeToIndex = function (time) {
      var delta = (Date.now() - time);
      var index = Math.floor((delta / tpp) / line_width);
      //console.log("index: " + index);
      return index;
    };

    var TICKS_PER_SECOND = pps;
    var MS_PER_TICK = 1000 / TICKS_PER_SECOND;

    var startTime = Date.now();

    var origin = {
      x: w,
      y: h,
    };

    function addValue (value, time) {
      time = time || Date.now();
      value = value || 0;

      var index = timeToIndex(time);
      var t = data.length - index - 1;
      if (t < data.length && t >= 0) {
        data[t].value += value;
      }

    };

    function render () {
      var xoff = ticks % line_width;
      xoff -= line_width;

      var d = data.slice(0, data.length - offset_len + buf_left).reverse();

      ctx.strokeStyle = "green";
      // draw all data points
      ctx.beginPath();
      ctx.moveTo(origin.x - xoff, origin.y);

      // calculate new ySclale (based around max value)
      var yMax = 1;
      for (var i = 0; i < d.length; i++) {
        var v = Number(d[i].value);
        if (v > yMax) {
          yMax = v;
        }
      };
      //console.log("ymax: %s", yMax);
      yScale = scale(0, yMax * 1.25);

      for (var i = 0; i < d.length; i++) {
        var point = d[i];
        var to = {
          x: origin.x - i * line_width,
          y: origin.y - point.value,
        };

        to.y = origin.y - yScale(point.value) * h;

        ctx.lineTo(to.x - xoff, to.y);
      }

      ctx.stroke();

    };

    function tick () {
      ticks++;
      //console.log(ticks);
      clear();
      drawBorder();

      /*
         if (ticks % line_width === 0) {
         addValue(5 + Math.random() * 10);
         }

         if (ticks % (pps) === 0) {
         addValue(30);
         }

         if (ticks % (pps * 5) === 0) {
         addValue(1000);
         }
         */

      if (ticks % line_width === 0) {
        data.push({value: 0, time: Date.now()});
        data.shift();
      }

      render();

      if (__running) {
        timeout = setTimeout(tick, MS_PER_TICK);
      }
    };

    tick();

    return {
      addData: function (value, time) {
        addValue(value, time); // epochTime
      },
      stop: function () {
        __running = false;
      }
    };
  };

  canvas.width = 300;
  canvas.height = 40;
  var _api = resize(canvas);
  api = {
    addData: _api.addData,
    stop: _api.stop,
    update: function () {
      api.stop();
      clearTimeout(timeout);
      var _api = resize(canvas);
      api.addData = _api.addData;
      api.stop = _api.stop;
      return api;
    }
  };
  return api;
};

