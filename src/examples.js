export const counter = `var i = 23;

function click() {
  i++;
}

function render() {
  return (<div>
    <h1>Demo</h1>
    <p>Count: {i}</p>
    <button onclick={click}>Click me</button>
  </div>);
}`;

export const flappy = `var bgStep = 0; // background scroll
var y = 100; // bird altitude
var vy = -10; // bird vertical speed

function scroll() {
  bgStep++;
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
      height: "384px",
      backgroundPosition: -bgStep + "px 0",
      backgroundImage: "url(http://flappycreator.com/default/bg.png)"
    }} />);
}

function bird() {
  return (
    <div className="bird" onframe={update} style={{
      position: "relative",
      height: "26px",
      width: "36px",
      left: "40px",
      top: (y - 384) + "px",
      backgroundImage: "url(http://flappycreator.com/default/bird_sing.png)"
    }} />);
}

function render() {
  return (
    <div onmousedown={click}>
      {background()}
      {bird()}
    </div>);
}`;

export const spiral = `var i = 0;

function step() {
  if (++i >= 100) i = 0;
}

function sin100(a, f, s) {
  if (s == null) s = 0;
  return Math.floor(a * Math.sin(f * (i + s) * Math.PI / 50));
}

function cos100(a, f, s) {
  if (s == null) s = 0;
  return Math.floor(a * Math.cos(f * (i + s) * Math.PI / 50));
}

function dot(base) {
  if (base < 4) return <div />;
  const r = 128 + sin100(base * 4, 1);
  const g = 128 + sin100(base * 4, 2);
  const b = 128 + sin100(base * 4, 3);
  const x = sin100(20, 1, 2 * base);
  const y = cos100(20, 1, 2 * base);
  return (<div style={{
      height: base + 'px',
      width: base + 'px',
      left: x + 'px',
      top: y + 'px',
      borderRadius: '50%',
      position: 'relative',
      background: 'rgb('+r+','+g+','+b+')' }}>
      {dot(base / 1.2)}
  </div>);
}

function render() {
  return (<div onframe={step} style={{height: '300px', width: '100%'}}>
    <div style={{position: 'relative', top: '50%', left: '50%'}}>
      {dot(32)}
    </div>
  </div>);
}`;
