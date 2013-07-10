
var Timeline = require('./timeline')
  , d3 = require('d3');

function numb(objs) {
  for (var i=0; i<objs.length; i++) {
    objs[i].id = +objs[i].id;
  }
  return objs;
}

function numbk(objs) {
  for (var i=0; i<objs.length; i++) {
    objs[i].id = +objs[i].id;
    objs[i].volume_id = +objs[i].volume_id;
    objs[i].num_chapters = +objs[i].num_chapters;
    objs[i].num_verses = +objs[i].num_verses;
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

function getData(files, next, items) {
  items = items || [];
  if (!files.length) {
    return next(items);
  }
  d3.csv(files[0], function (data) {
    numv(data);
    return getData(files.slice(1), next, items.concat(data));
  });
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

    getData(['data.csv', 'book.csv'], function (items) {

      d3.csv('books.csv', function (books) {
        numbk(books);

        timeline = new Timeline('#svg', lanes, items, {
          min: +verses[0].id,
          max: +verses[verses.length - 1].id,
          tickFormat: fverse,
          initialWindow: [verses[0].id, verses[1000].id],
          ticks: false
        });
      });

    });
  });
});
