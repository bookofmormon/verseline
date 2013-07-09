
var colors = d3.scale.category20()
  , chart;

var margin = {top: 20, right: 15, bottom: 15, left: 60}
  , width = 960 - margin.left - margin.right
  , height = 500 - margin.top - margin.bottom
  , miniHeight = lanes.length * 12 + 50
  , mainHeight = height - miniHeight - 50;

function numb(objs) {
  for (var i=0; i<objs.length; i++) {
    objs[i].id = +objs[i].id;
  }
  return objs;
}

function numv(objs) {
  for (var i=0; i<objs.length; i++) {
    objs[i].id = +objs[i].id;
    objs[i].start = +objs[i].start;
    objs[i].end = +objs[i].end;
    objs[i].lane = +objs[i].lane;
    objs[i]['class'] = objs[i].title.replace("'", '').replace(' ', '')
                              .toLowerCase();
  }
  return objs;
}

d3.csv('verses.csv', function (verses) {
  numb(verses);
  var firstVerse = verses[0].id
    , verseExtent = verses[verses.length - 1].id - verses[0].id;

  function fverse(num) {
    var v = verses[num - firstVerse];
    if (!v) {
      return verses[parseInt(verseExtent * num)].title;
    }
    return v.title;
  }

  function fchapter(num) {
    return fverse(num).split(':')[0];
  }

  function fbook(num) {
    return fverse(num).split('.')[0];
  }

  d3.csv('lanes.csv', function (lanes) {
    numb(lanes);

    d3.csv('data.csv', function (items) {
      numv(items);

      var x = d3.scale.linear()
        .domain([+verses[0].id, +verses[verses.length - 1].id])
        .range([0, width]);

      var x1 = d3.scale.linear().range([0, width]);

      var ext = d3.extent(lanes, function(d) { return d.id; });
      var y1 = d3.scale.linear().domain([ext[0], ext[1] + 1])
                 .range([0, mainHeight]);
      var y2 = d3.scale.linear().domain([ext[0], ext[1] + 1])
                 .range([0, miniHeight]);

      chart = d3.select('body')
        .append('svg:svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .attr('class', 'chart');

      chart.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', mainHeight);

      var main = chart.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', width)
        .attr('height', mainHeight)
        .attr('class', 'main');

      var mini = chart.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + (mainHeight + 60) + ')')
        .attr('width', width)
        .attr('height', miniHeight)
        .attr('class', 'mini');

      // draw the lanes for the main chart
      main.append('g').selectAll('.laneLines')
        .data(lanes)
        .enter().append('line')
        .attr('x1', 0)
        .attr('y1', function(d) { return d3.round(y1(d.id)) + 0.5; })
        .attr('x2', width)
        .attr('y2', function(d) { return d3.round(y1(d.id)) + 0.5; })
        .attr('stroke', function(d) { return d.label === '' ? 'white' : 'lightgray' });

      main.append('g').selectAll('.laneText')
        .data(lanes)
        .enter().append('text')
        .text(function(d) { return d.title; })
        .attr('x', -10)
        .attr('y', function(d) { return y1(d.id + .5); })
        .attr('dy', '0.5ex')
        .attr('text-anchor', 'end')
        .attr('class', 'laneText');

      // draw the lanes for the mini chart
      mini.append('g').selectAll('.laneLines')
        .data(lanes)
        .enter().append('line')
        .attr('x1', 0)
        .attr('y1', function(d) { return d3.round(y2(d.id)) + 0.5; })
        .attr('x2', width)
        .attr('y2', function(d) { return d3.round(y2(d.id)) + 0.5; })
        .attr('stroke', function(d) { return d.label === '' ? 'white' : 'lightgray' });

      mini.append('g').selectAll('.laneText')
        .data(lanes)
        .enter().append('text')
        .text(function(d) { return d.title; })
        .attr('x', -10)
        .attr('y', function(d) { return y2(d.id + .5); })
        .attr('dy', '0.5ex')
        .attr('text-anchor', 'end')
        .attr('class', 'laneText');

      // draw the x axis
      var xDateAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .ticks(10)
        .tickFormat(fverse)
        .tickSize(6, 0, 0);

      var x1DateAxis = d3.svg.axis()
        .scale(x1)
        .orient('bottom')
        .ticks(10)
        .tickFormat(fverse)
        .tickSize(6, 0, 0);

      var xMonthAxis = d3.svg.axis()
        .scale(x)
        .orient('top')
        .ticks(10)
        .tickFormat(fverse)
        .tickSize(15, 0, 0);

      var x1MonthAxis = d3.svg.axis()
        .scale(x1)
        .orient('top')
        .ticks(10)
        .tickFormat(fverse)
        .tickSize(15, 0, 0);

      main.append('g')
        .attr('transform', 'translate(0,' + mainHeight + ')')
        .attr('class', 'main axis date')
        .call(x1DateAxis);

      main.append('g')
        .attr('transform', 'translate(0,0.5)')
        .attr('class', 'main axis month')
        .call(x1MonthAxis)
        .selectAll('text')
        .attr('dx', 5)
        .attr('dy', 12);

      mini.append('g')
        .attr('transform', 'translate(0,' + miniHeight + ')')
        .attr('class', 'axis date')
        .call(xDateAxis);

      mini.append('g')
        .attr('transform', 'translate(0,0.5)')
        .attr('class', 'axis month')
        .call(xMonthAxis)
        .selectAll('text')
        .attr('dx', 5)
        .attr('dy', 12);

      /*
      // draw a line representing today's date
      main.append('line')
        .attr('y1', 0)
        .attr('y2', mainHeight)
        .attr('class', 'main todayLine')
        .attr('clip-path', 'url(#clip)');

      mini.append('line')
        .attr('x1', x(now) + 0.5)
        .attr('y1', 0)
        .attr('x2', x(now) + 0.5)
        .attr('y2', miniHeight)
        .attr('class', 'todayLine');
        */

      // draw the items
      var itemRects = main.append('g')
        .attr('clip-path', 'url(#clip)');

      mini.append('g').selectAll('miniItems')
        .data(getPaths(items))
        .enter().append('path')
        .attr('class', function(d) { return 'miniItem ' + d.class; })
        .attr('stroke', function (d) { return colors(d.class); })
        .attr('d', function(d) { return d.path; });

      // invisible hit area to move around the selection window
      mini.append('rect')
        .attr('pointer-events', 'painted')
        .attr('width', width)
        .attr('height', miniHeight)
        .attr('visibility', 'hidden')
        .on('mouseup', moveBrush);

      // draw the selection area
      var brush = d3.svg.brush()
        .x(x)
        .extent([verses[0].id, verses[1000].id])
        .on("brush", display);

      mini.append('g')
        .attr('class', 'x brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', 1)
        .attr('height', miniHeight - 1);

      mini.selectAll('rect.background').remove();

      display();

      function display () {

        var rects, labels
          , minExtent = brush.extent()[0]
          , maxExtent = brush.extent()[1]
          , visItems = items.filter(function (d) { return d.start < maxExtent && d.end > minExtent; });

        mini.select('.brush').call(brush.extent([minExtent, maxExtent]));

        x1.domain([minExtent, maxExtent]);

        if ((maxExtent - minExtent) > verseExtent / 10) {
          x1DateAxis.ticks(10).tickFormat(fbook);
          x1MonthAxis.ticks(10).tickFormat(fbook);
        } else if ((maxExtent - minExtent) > verseExtent / 50) {
          x1DateAxis.ticks(10).tickFormat(fchapter);
          x1MonthAxis.ticks(10).tickFormat(fchapter);
        } else {
          x1DateAxis.ticks(10).tickFormat(fverse);
          x1MonthAxis.ticks(10).tickFormat(fverse);
        }

        /*
        // shift the today line
        main.select('.main.todayLine')
          .attr('x1', x1(now) + 0.5)
          .attr('x2', x1(now) + 0.5);
        */

        // update the axis
        main.select('.main.axis.date').call(x1DateAxis);
        main.select('.main.axis.month').call(x1MonthAxis)
          .selectAll('text')
          .attr('dx', 5)
          .attr('dy', 12);

        // upate the item rects
        rects = itemRects.selectAll('rect')
          .data(visItems, function (d) { return d.id; })
          .attr('x', function(d) { return x1(d.start); })
          .attr('width', function(d) { return x1(d.end) - x1(d.start); });

        rects.enter().append('rect')
          .attr('x', function(d) { return x1(d.start); })
          .attr('y', function(d) { return y1(d.lane) + .1 * y1(1) + 0.5; })
          .attr('width', function(d) { return x1(d.end) - x1(d.start); })
          .attr('fill', function (d) { return colors(d.class); })
          .attr('height', function(d) { return .8 * y1(1); })
          .attr('class', function(d) { return 'mainItem ' + d.class; });

        rects.exit().remove();

        // update the item labels
        labels = itemRects.selectAll('text')
          .data(visItems, function (d) { return d.id; })
          .attr('style', function (d, e) {
            var b = this.getBBox().width;
            if (b > x1(d.end) - x1(Math.max(d.start, minExtent)) - 20) {
              return 'visibility: hidden';
            }
            return 'visibility: visible';
          })
          .attr('x', function(d) {
            return x1(Math.max(d.start, minExtent)) + 10;
          });
        
        labels.enter().append('text')
          .text(function (d) { return d.title; })
          .attr('x', function(d) {
            return x1(Math.max(d.start, minExtent)) + 10;
          })
          .attr('y', function(d) {
            return y1(d.lane) + .4 * y1(1) + 0.5;
          })
          .attr('style', function (d, e) {
            var b = this.getBBox().width;
            if (b > x1(d.end) - x1(Math.max(d.start, minExtent)) - 20) {
              return 'visibility: hidden';
            }
            return 'visibility: visible';
          })
          .attr('text-anchor', 'start')
          .attr('class', 'itemLabel');

        labels.exit().remove();
      }

      function moveBrush () {
        var origin = d3.mouse(this)
          , point = x.invert(origin[0])
          , halfExtent = (brush.extent()[1] - brush.extent()[0]) / 2
          , start = point - halfExtent
          , end = point + halfExtent;

        brush.extent([start,end]);
        display();
      }

      // generates a single path for each item class in the mini display
      // ugly - but draws mini 2x faster than append lines or line generator
      // is there a better way to do a bunch of lines as a single path with d3?
      function getPaths(items) {
        var paths = {}, d, offset = .5 * y2(1) + 0.5, result = [];
        for (var i = 0; i < items.length; i++) {
          d = items[i];
          if (!paths[d.class]) paths[d.class] = '';	
          paths[d.class] += ['M', x(d.start), (y2(d.lane) + offset), 'H', x(d.end)].join(' ');
        }

        for (var className in paths) {
          result.push({class: className, path: paths[className]});
        }

        return result;
      }

    });
  });
});
