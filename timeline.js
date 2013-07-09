
var extend = require('extend')
  , d3 = require('d3');

module.exports = Timeline;

function Timeline(el, lanes, items, config) {
  var c = this.config = extend({
    margin: {
      top: 20,
      left: 60,
      bottom: 15,
      right: 15
    },
    colors: d3.scale.category20(),
    width: 960,
    height: 500,
    mini: true,
    miniHeight: lanes.length * 12 + 50,
    miniMargin: 50,
    min: 0,
    max: 100,
    tickFormat: '%d',
    initialWindow: [0, 100]
  }, config);
  c.innerHeight = c.height - c.margin.top - c.margin.bottom;
  c.innerWidth = c.width - c.margin.left - c.margin.right;
  if (c.mini)
    c.mainHeight = c.innerHeight - c.miniHeight - c.miniMargin;
  else
    c.mainHeight = c.innerHeight;
  this.lanes = lanes;
  this.items = items;
  this.makeScales();
  this.makeSvg();
  this.makeAxes();
  this.drawAxes();
  this.drawMini();
  this.display();
}

Timeline.prototype = {
  makeScales: function () {
    var c = this.config
      , ext = d3.extent(this.lanes, function(d) { return d.id; });
    this.scales = {
      x: d3.scale.linear().domain([c.min, c.max]).range([0, c.innerWidth]),
      x1: d3.scale.linear().range([0, c.width]),
      y1: d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, c.mainHeight]),
      y2: d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, c.miniHeight])
    };
  },

  makeSvg: function () {
    var c = this.config
      , self = this;
    
    this.chart = d3.select('body')
      .append('svg:svg')
      .attr('width', c.width)
      .attr('height', c.height)
      .attr('class', 'chart');

    this.chart.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', c.innerWidth)
      .attr('height', c.mainHeight);

    this.main = this.chart.append('g')
      .attr('transform', 'translate(' + c.margin.left + ',' + c.margin.top + ')')
      .attr('width', c.innerWidth)
      .attr('height', c.mainHeight)
      .attr('class', 'main');

    this.mini = this.chart.append('g')
      .attr('transform', 'translate(' + c.margin.left + ',' + (c.mainHeight + c.miniMargin + 1) + ')')
      .attr('width', c.innerWidth)
      .attr('height', c.miniHeight)
      .attr('class', 'mini');

    // draw the lanes for the main chart
    this.main.append('g').selectAll('.laneLines')
      .data(this.lanes)
      .enter().append('line')
      .attr('x1', 0)
      .attr('y1', function(d) { return d3.round(self.scales.y1(d.id)) + 0.5; })
      .attr('x2', c.innerWidth)
      .attr('y2', function(d) { return d3.round(self.scales.y1(d.id)) + 0.5; })
      .attr('stroke', function(d) { return d.label === '' ? 'white' : 'lightgray'; });

    this.main.append('g').selectAll('.laneText')
      .data(this.lanes)
      .enter().append('text')
      .text(function(d) { return d.title; })
      .attr('x', -10)
      .attr('y', function(d) { return self.scales.y1(d.id + 0.5); })
      .attr('dy', '0.5ex')
      .attr('text-anchor', 'end')
      .attr('class', 'laneText');

    // draw the lanes for the mini chart
    this.mini.append('g').selectAll('.laneLines')
      .data(this.lanes)
      .enter().append('line')
      .attr('x1', 0)
      .attr('y1', function(d) { return d3.round(self.scales.y2(d.id)) + 0.5; })
      .attr('x2', c.innerWidth)
      .attr('y2', function(d) { return d3.round(self.scales.y2(d.id)) + 0.5; })
      .attr('stroke', function(d) { return d.label === '' ? 'white' : 'lightgray'; });

    this.mini.append('g').selectAll('.laneText')
      .data(this.lanes)
      .enter().append('text')
      .text(function(d) { return d.title; })
      .attr('x', -10)
      .attr('y', function(d) { return self.scales.y2(d.id + 0.5); })
      .attr('dy', '0.5ex')
      .attr('text-anchor', 'end')
      .attr('class', 'laneText');
  },
  makeAxes: function () {
    // draw the x axis
    this.axes = {
      date: d3.svg.axis()
        .scale(this.scales.x)
        .orient('bottom')
        .ticks(10)
        .tickFormat(this.config.tickFormat)
        .tickSize(6, 0, 0),

      date1: d3.svg.axis()
        .scale(this.scales.x1)
        .orient('bottom')
        .ticks(10)
        .tickFormat(this.config.tickFormat)
        .tickSize(6, 0, 0),

      month: d3.svg.axis()
        .scale(this.scales.x)
        .orient('top')
        .ticks(10)
        .tickFormat(this.config.tickFormat)
        .tickSize(15, 0, 0),

      month1: d3.svg.axis()
        .scale(this.scales.x1)
        .orient('top')
        .ticks(10)
        .tickFormat(this.config.tickFormat)
        .tickSize(15, 0, 0)
    };
  },

  drawAxes: function () {
    var c = this.config;

    this.main.append('g')
      .attr('transform', 'translate(0,' + c.mainHeight + ')')
      .attr('class', 'main axis date')
      .call(this.axes.date1);

    /*
    this.main.append('g')
      .attr('transform', 'translate(0,0.5)')
      .attr('class', 'main axis month')
      .call(this.axes.month1)
      .selectAll('text')
      .attr('dx', 5)
      .attr('dy', 12);
      */

    this.mini.append('g')
      .attr('transform', 'translate(0,' + c.miniHeight + ')')
      .attr('class', 'axis date')
      .call(this.axes.date);

    /*
    this.mini.append('g')
      .attr('transform', 'translate(0,0.5)')
      .attr('class', 'axis month')
      .call(this.axes.month)
      .selectAll('text')
      .attr('dx', 5)
      .attr('dy', 12);
      */
  },

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

  drawMini: function () {
    var self = this
      , c = this.config;
    // draw the items
    this.itemRects = this.main.append('g')
      .attr('clip-path', 'url(#clip)');

    this.mini.append('g').selectAll('miniItems')
      .data(this.getPaths(this.items))
      .enter().append('path')
      .attr('class', function(d) { return 'miniItem ' + d.class; })
      .attr('stroke', function (d) { return c.colors(d.class); })
      .attr('d', function(d) { return d.path; });

    // invisible hit area to move around the selection window
    this.mini.append('rect')
      .attr('pointer-events', 'painted')
      .attr('width', c.innerWidth)
      .attr('height', c.miniHeight)
      .attr('visibility', 'hidden')
      .on('mouseup', this.moveBrush());

    // draw the selection area
    this.brush = d3.svg.brush()
      .x(this.scales.x)
      .extent(c.initialWindow)
      .on("brush", this.display.bind(this));

    this.mini.append('g')
      .attr('class', 'x brush')
      .call(this.brush)
      .selectAll('rect')
      .attr('y', 1)
      .attr('height', c.miniHeight - 1);

    // what's this for?
    this.mini.selectAll('rect.background').remove();
  },

  display: function () {
    var rects, labels
      , self = this
      , minExtent = this.brush.extent()[0]
      , maxExtent = this.brush.extent()[1]
      , range = maxExtent - minExtent
      , visItems = this.items.filter(function (d) { return d.start < maxExtent && d.end > minExtent; });

    this.mini.select('.brush').call(this.brush.extent([minExtent, maxExtent]));

    this.scales.x1.domain([minExtent, maxExtent]);

    for (var i=0; i<this.config.tickFormats.length; i++) {
      if (range > this.config.tickFormats[i][0]) {
        this.axes.date1.tickFormat(this.config.tickFormats[i][1]);
        this.axes.month1.tickFormat(this.config.tickFormats[i][1]);
        break;
      }
    }

    /*
    // shift the today line
    main.select('.main.todayLine')
    .attr('x1', x1(now) + 0.5)
    .attr('x2', x1(now) + 0.5);
    */

    // update the axis
    this.main.select('.main.axis.date').call(this.axes.date1);
    this.main.select('.main.axis.month').call(this.axes.month1)
      .selectAll('text')
      .attr('dx', 5)
      .attr('dy', 12);

    // upate the item rects
    rects = this.itemRects.selectAll('rect')
      .data(visItems, function (d) { return d.id; })
      .attr('x', function(d) { return self.scales.x1(d.start); })
      .attr('width', function(d) { return self.scales.x1(d.end) - self.scales.x1(d.start); });

    rects.enter().append('rect')
      .attr('x', function(d) { return self.scales.x1(d.start); })
      .attr('y', function(d) { return self.scales.y1(d.lane) + 0.1 * self.scales.y1(1) + 0.5; })
      .attr('width', function(d) { return self.scales.x1(d.end) - self.scales.x1(d.start); })
      .attr('fill', function (d) { return self.config.colors(d.class); })
      .attr('height', function(d) { return 0.8 * self.scales.y1(1); })
      .attr('class', function(d) { return 'mainItem ' + d.class; });

    rects.exit().remove();

    // update the item labels
    labels = this.itemRects.selectAll('text')
      .data(visItems, function (d) { return d.id; })
      .attr('style', function (d, e) {
        var b = this.getBBox().width;
        if (b > self.scales.x1(d.end) - self.scales.x1(Math.max(d.start, minExtent)) - 20) {
          return 'visibility: hidden';
        }
        return 'visibility: visible';
      })
      .attr('x', function(d) {
        return self.scales.x1(Math.max(d.start, minExtent)) + 10;
      });
    
    labels.enter().append('text')
      .text(function (d) { return d.title; })
      .attr('x', function(d) {
        return self.scales.x1(Math.max(d.start, minExtent)) + 10;
      })
      .attr('y', function(d) {
        return self.scales.y1(d.lane) + 0.4 * self.scales.y1(1) + 0.5;
      })
      .attr('style', function (d, e) {
        var b = this.getBBox().width;
        if (b > self.scales.x1(d.end) - self.scales.x1(Math.max(d.start, minExtent)) - 20) {
          return 'visibility: hidden';
        }
        return 'visibility: visible';
      })
      .attr('text-anchor', 'start')
      .attr('class', 'itemLabel');

    labels.exit().remove();
  },

  moveBrush: function () {
    var self = this;
    return function () {
      var origin = d3.mouse(this)
        , point = self.scales.x.invert(origin[0])
        , halfExtent = (self.brush.extent()[1] - self.brush.extent()[0]) / 2
        , start = point - halfExtent
        , end = point + halfExtent;

      if (start < self.config.min) {
        end += (self.config.min - start);
        start = self.config.min;
      } else if (end > self.config.max) {
        start += self.config.max - end;
        end = self.config.max;
      }

      self.brush.extent([start, end]);
      self.display();
    };
  },

  // generates a single path for each item class in the mini display
  // ugly - but draws mini 2x faster than append lines or line generator
  // is there a better way to do a bunch of lines as a single path with d3?
  getPaths: function (items) {
    var paths = {}
      , d
      , offset = 0.5 * this.scales.y2(1) + 0.5
      , result = [];

    for (var i = 0; i < this.items.length; i++) {
      d = this.items[i];
      if (!paths[d.class]) paths[d.class] = '';	
      paths[d.class] += ['M', this.scales.x(d.start),
                         (this.scales.y2(d.lane) + offset),
                         'H', this.scales.x(d.end)].join(' ');
    }

    for (var className in paths) {
      result.push({class: className, path: paths[className]});
    }

    return result;
  }
};
