
var Timeline = require('./timeline')
  , d3 = require('d3');

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

var timeline;

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

      timeline = new Timeline('#svg', lanes, items, {
        min: +verses[0].id,
        max: +verses[verses.length - 1].id,
        tickFormat: fverse,
        initialWindow: [verses[0].id, verses[1000].id],
        tickFormats: [
          [verseExtent / 10, fbook],
          [verseExtent / 50, fchapter],
          [0, fverse]
        ]
      });

    });
  });
});
