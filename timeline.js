
var extend = require('extend')
  , Tip = require('tip')
  , d3 = require('d3');

module.exports = Timeline;

function Timeline(el, lanes, items, config) {
  var c = this.config = extend({
    margin: {
      top: 20,
      left: 60,
      bottom: 30,
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
    ticks: [[0, '%d']],
    initialWindow: [0, 100]
  }, config);
  c.innerHeight = c.height - c.margin.top - c.margin.bottom;
  c.innerWidth = c.width - c.margin.left - c.margin.right;
  c.mainHeight = c.innerHeight;
  this.tip = new Tip('Tool');
  this.tip.el.addClass('versetip');
  this.lanes = lanes;
  this.items = items;
  this.makeScales();
  this.makeSvg();
  if (c.ticks) {
    this.makeAxes();
    this.drawAxes();
  }
  this.drawMini();
  this.display();
}

Timeline.prototype = {
  makeScales: function () {
    var c = this.config
      , ext = d3.extent(this.lanes, function(d) { return d.id; });
    this.scales = {
      x: d3.scale.linear().domain([c.min, c.max]).range([0, c.innerWidth]),
      x1: d3.scale.linear().range([0, c.innerWidth]),
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
      .attr('transform', 'translate(' + c.margin.left + ',' + (c.mainHeight + c.margin.top) + ')')
      .attr('width', c.innerWidth)
      .attr('height', 5)
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
  },

  scroll: function () {
    var e = d3.event;
    var ext = this.brush.extent()
      , origin = d3.mouse(this.main[0][0])
      , rng = ext[1] - ext[0]
      , horiz = ext[0] - this.scales.x1.invert(e.wheelDeltaX)
      , vert = ext[0] - this.scales.x1.invert(e.wheelDeltaY)
      , left = this.config.innerWidth / origin[0]
      , right = this.config.innerWidth / (this.config.innerWidth - origin[0])
      , start = ext[0]
      , end = ext[1];

    if (Math.abs(e.wheelDeltaX) > Math.abs(e.wheelDeltaY)) {
      start += horiz;
      end += horiz;
    } else {
      if (e.wheelDeltaY !== 0) {
        if (!(rng <= 10 && vert > 0)) {
          start += vert / left;
          end -= vert / right;
          if (end - start > (this.config.max - this.config.min)) {
            end = start + (this.config.max - this.config.min);
          }
          if (end - start < 10) {
            end = start + 10;
          }
        }
      }
    }

    if (start < this.config.min) {
      end += (this.config.min - start);
      start = this.config.min;
    } else if (end > this.config.max) {
      start += this.config.max - end;
      end = this.config.max;
    }

    this.brush.extent([start, end]);
    this.display();
    e.preventDefault();
    e.stopPropagation();
    return;
  },

  drawMini: function () {
    var self = this
      , c = this.config;

    // invisible hit area to move around the selection window
    this.main.append('rect')
      .attr('pointer-events', 'fill')
      .attr('class', 'mouse-catcher')
      .attr('width', c.innerWidth)
      .attr('height', c.height)
      .attr('visibility', 'hidden')
      .on('mousewheel', this.scroll.bind(this));

    // draw the items
    this.itemRects = this.main.append('g')
      .attr('clip-path', 'url(#clip)');

    // draw the selection area
    this.brush = d3.svg.brush()
      .x(this.scales.x)
      .extent(c.initialWindow)
      .on('brush', this.display.bind(this));

    this.mini.append('g')
      .attr('class', 'x brush')
      .call(this.brush)
      .selectAll('rect')
      .attr('y', 1)
      .attr('height', c.margin.bottom/2);

    // what's this for?
    this.mini.selectAll('rect.background').remove();
  },

  display: function () {
    var rects, labels
      , self = this
      , minExtent = this.brush.extent()[0]
      , maxExtent = this.brush.extent()[1]
      , range = maxExtent - minExtent;

    if (range < 10) {
      maxExtent = minExtent + 10;
      range = 10;
      if (maxExtent > this.config.max) {
        maxExtent = this.config.max;
        minExtent = maxExtent - 10;
      }
    }
    
    var scope = (range < 50 ? 'verse' : (range < 1000) ? 'chapter' : 'book')
      , visItems = this.items.filter(function (d) {
        return d.start < maxExtent && d.end > minExtent && (d.scope === 'all' || d.scope === scope);
      });

    this.mini.select('.brush').call(this.brush.extent([minExtent, maxExtent]));

    this.scales.x1.domain([minExtent, maxExtent]);

    if (this.config.ticks) {
      for (var i=0; i<this.config.ticks.length; i++) {
        if (range > this.config.ticks[i][0]) {
          this.axes.date1.ticks(this.config.ticks[i][1]).tickFormat(this.config.ticks[i][2]);
          this.axes.month1.ticks(this.config.ticks[i][1]).tickFormat(this.config.ticks[i][2]);
          break;
        }
      }

      // update the axis
      this.main.select('.main.axis.date').call(this.axes.date1);
      this.main.select('.main.axis.month').call(this.axes.month1)
        .selectAll('text')
        .attr('dx', 5)
        .attr('dy', 12);
    }

    /*
    // shift the today line
    main.select('.main.todayLine')
    .attr('x1', x1(now) + 0.5)
    .attr('x2', x1(now) + 0.5);
    */

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
      .attr('class', function(d) { return 'mainItem ' + d.class; })
      .on('mouseover', function (d) {
        var e = d3.event;
        // if (d.description) {
          self.tip.message(d.description || d.title);
          self.tip.show(e.pageX, e.pageY);
        // }
      })
      .on('mouseout', function (d) {
        self.tip.hide();
      })
      .on('mousewheel', this.scroll.bind(this));

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

      if (end - start < 10) end = start + 10;

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
  }
};
