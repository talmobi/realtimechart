function init (element, params) {
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns,'svg');
  var path = document.createElementNS(ns, 'path');

  window.svg = svg;
  window.path = path;

  params = params || {};
  params.interval = params.interval || 5000;
  params.data = params.data || [];
  params.offset = params.offset || 1000;
  params.spacing = params.spacing || 100;

  //params.width = params.width || 300;
  //params.height = params.height || 80;

  // time per pixel
  //var tpp = (params.interval / params.width);

  var data = params.data || [{ time: Date.now(), value: 0 }];

  function insertData (time, value) {
    var tv = (typeof time === 'object') ? time : { time: time, value: value };
    //tv.time = Math.round(tv.time);
    var counter = 0;

    // insert data point at the correct position (sorted by time)
    for (var i = data.length - 1; i >= 0; i--) {
      counter++;
      if (tv.time >= data[i].time) {
        return data.splice(i + 1, 0, tv);
      }
    }

    console.log('insert counter: %s', counter);
    return data.splice(0, 0, tv);
  } // insertData

  var seed = 1;
  function random () {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // insert bogus fake data for testing
  if (typeof debug !== 'undefined') {
    var now = Date.now();
    for (var i = 0; i < 50; i++) {
      insertData ({
        time: now - i * 50,
        value: random() * height() * .5,
      })
    }
  }

  // sort data by time
  function sort () {
    data.sort(function (a, b) {
      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    })
  } // sort

  var ticks = 0;
  function animate () {
    //path.setAttribute('transform', 'translate(-$t)'.replace('$t', ticks += 5))
    if (data[0]) path.setAttribute('d', dataToPathString(data));

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  function p (type, values) {
    return type + values.join(',');
  }

  //sort();

  function width () {
    return svg.offsetWidth || 300;
  }
  function height () {
    return svg.offsetHeight || 80;
  }
  function timePerPixel () {
    return (params.interval / width());
  }
  function scale (floor, ceil) {
    return function (value) {
      return (floor + value) / ceil;
    }
  }

  // time value data to path string
  function dataToPathString (data) {
    var tpp = timePerPixel();

    var w = width() + Math.ceil(params.offset / tpp);
    var h = height();

    var pathString = p('M', [0, h]);

    if (!(data[0] && w && h && tpp)) return pathString;

    var now = Date.now();
    var count = 0;

    var expiredCount = 0;
    for (var i = 0; i < data.length; i++) {
      var tv = data[i];
      // delete
      if (tv.time <= (now - params.interval - params.offset)) {
        expiredCount++;
        continue;
      }
      break;
    }

    // delete expired values (hidden to the left of the chart)
    expiredCount > 1 && data.splice(0, expiredCount - 1);
    //console.log('expiredCount: %s, data.length: %s', expiredCount, data.length);

    // find min max values and use it to scale the chart to fit the screen
    var minValue = 0;
    var maxValue = minValue;
    data.forEach(function (tv) {
      if (tv.value > maxValue) maxValue = tv.value;
      if (tv.value < minValue) minValue = tv.value;
    });

    yScale = scale(minValue, maxValue);

    var x = w + ((data[0].time - now) / tpp);
    pathString += ' ' + p('L', [x, h]);

    // construct lines on path
    data.forEach(function (timeValue) {
      var t = timeValue.time;
      var v = timeValue.value;
      var x = w + ((t - now) / tpp);
      var y = h - yScale(v) * h;
      pathString += ' ' + p('L', [x, y]);
    });

    pathString += ' ' + p('L', [w, h]);
    return pathString + '';
  }

  path.setAttribute('d', dataToPathString(data));
  path.setAttribute('fill', 'transparent');
  path.setAttribute('stroke', 'black');
  path.setAttribute('stroke-width', 1);

  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  //svg.setAttribute('viewBox', '0 0 ' + params.width + ' ' + params.height);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.appendChild(path);

  element.appendChild(svg);
  return insertData;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = init;
}
