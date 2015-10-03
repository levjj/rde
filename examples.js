export const counter = `var i = 23;

function click() {
  i++;
}

function render() {
  return (<div>
    <h1>Demo</h1>,
    <p>Count: {i}</p>
    <button onclick={click}>Click me</button>
  </div>);
}`;

export const flappy = `var bgStep = 0; // background scroll
var y = 100; // bird altitude
var vy = -10; // bird vertical speed

function scroll() {
  bgStep++;;
  if (bgStep > 288) {
    bgStep = 0;
  }
}

function update() {
  y += vy;
  vy += 1; // gravity
  if (y >= 358) {
    y = 358;
    vy = 0;
  }
}

function click() {
  vy = -10;
}

function background() {
  return (
    <div className="background" onframe={scroll} style={{
      "height": "384px",
      "background-position-x": -bgStep + "px",
      "background-image": "url(http://flappycreator.com/default/bg.png)"
    }} />);
}

function bird() {
  return (
    <div className="bird" onframe={update} style={{
      "height": "26px",
      "width": "36px",
      "left": "40px";
      "top": (y - 384) + "px"
      "background-image": "url(http://flappycreator.com/default/bird_sing.png)";
    }} />);
}

function render() {
  return (
    <div onclick={click}>
      {background()}
      {bird()}
    </div>);
}`;
