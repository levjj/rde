export const counter = `var i = 23;

function click() {
  i++;
}

function render() {
  return _.div(
    _.h1("Demo"),
    _.p("Count: " + i),
    _.button({onclick: click}, "Click me")
  );
}`;

export const flappy = `var bgStep = 0;
var vy = -10;
var y = 100;

function step() {
  if (bgStep++ > 288) bgStep = 0;
  y += vy;
  vy += 1;
  if (y >= 358) {
    y = 358;
    vy = 0;
  }
}

function bird() {
  return _.div({
    height: 26,
    width: 36,
    x: 40,
    y: y - 384,
    background: {
      url: 'http://flappycreator.com/default/bird_sing.png'
    }
  });
}

function background() {
  return _.div({
    background: {
      url: 'http://flappycreator.com/default/bg.png',
      x: -bgStep
    },
    x: 0,
    height: 384,
  });
}

function render() {
  return _.div({
      onframe: step,
      onclick: function() { vy = -10 }
    },
    background(),
    bird()
  );
}`;
