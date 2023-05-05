var canvas = document.getElementById("canvas");
var canvas2 = document.getElementById("canvas2");
var otrocanvas = document.getElementById("otrocanvas");
var ctx = canvas.getContext("2d");
var arr = [];
var arr100 = [];
var input = document.getElementById('input');
input.addEventListener('change', handleFiles);


function handleFiles(e) {
  var ctx = document.getElementById('canvas').getContext('2d');
  var img = new Image;
  img.onload = function() {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    predecir();
  }
  img.src = URL.createObjectURL(e.target.files[0]);
  if (!e.target.files[0] || e.target.files[0].type !== 'image/jpeg') {
    alert('file is not jpg/jpeg');
  }
}

var modelo = null;

(async () => {
  modelo = await tf.loadLayersModel("model.json");
})();

function predecir() {
  if (modelo != null) {
    resample_single(canvas, 100, 100, otrocanvas);
    resample_single(canvas, 400, 400, canvas2);
    var ctx2 = otrocanvas.getContext("2d");
    var imgData = ctx2.getImageData(0, 0, 100, 100);
    pushImage(imgData);
    showResult();
  }
}
function showResult() {
  var tensor = tf.tensor4d(arr);
  var resultado = modelo.predict(tensor).dataSync();

  var respuesta;
  if (resultado <= .5) {
    respuesta = "Cat";
  } else {
    respuesta = "Dog";
  }
  document.getElementById("resultado").innerHTML = respuesta;
}

function pushImage(imgData) {
  arr = [];
  arr100 = [];
  for (var p = 0; p < imgData.data.length; p += 4) {
    var rojo = imgData.data[p] / 255;
    var verde = imgData.data[p + 1] / 255;
    var azul = imgData.data[p + 2] / 255;

    var gris = (rojo + verde + azul) / 3;

    arr100.push([gris]);
    if (arr100.length == 100) {
      arr.push(arr100);
      arr100 = [];
    }
  }
  arr = [arr];
}

function resample_single(canvas, width, height, resize_canvas) {
  var width_source = canvas.width;
  var height_source = canvas.height;
  width = Math.round(width);
  height = Math.round(height);

  var ratio_w = width_source / width;
  var ratio_h = height_source / height;
  var ratio_w_half = Math.ceil(ratio_w / 2);
  var ratio_h_half = Math.ceil(ratio_h / 2);

  var ctx = canvas.getContext("2d");
  var ctx2 = resize_canvas.getContext("2d");

  var img = ctx.getImageData(0, 0, width_source, height_source);
  var img2 = ctx2.createImageData(width, height);
  var data = img.data;
  var data2 = img2.data;

  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      var x2 = (i + j * width) * 4;
      var weight = 0;
      var weights = 0;
      var weights_alpha = 0;
      var gx_r = 0;
      var gx_g = 0;
      var gx_b = 0;
      var gx_a = 0;
      var center_y = (j + 0.5) * ratio_h;
      var yy_start = Math.floor(j * ratio_h);
      var yy_stop = Math.ceil((j + 1) * ratio_h);
      for (var yy = yy_start; yy < yy_stop; yy++) {
        var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
        var center_x = (i + 0.5) * ratio_w;
        var w0 = dy * dy;
        var xx_start = Math.floor(i * ratio_w);
        var xx_stop = Math.ceil((i + 1) * ratio_w);
        for (var xx = xx_start; xx < xx_stop; xx++) {
          var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
          var w = Math.sqrt(w0 + dx * dx);
          if (w >= 1) {
            continue;
          }
          weight = 2 * w * w * w - 3 * w * w + 1;
          var pos_x = 4 * (xx + yy * width_source);
          gx_a += weight * data[pos_x + 3];
          weights_alpha += weight;
          if (data[pos_x + 3] < 255)
            weight = weight * data[pos_x + 3] / 250;
          gx_r += weight * data[pos_x];
          gx_g += weight * data[pos_x + 1];
          gx_b += weight * data[pos_x + 2];
          weights += weight;
        }
      }
      data2[x2] = gx_r / weights;
      data2[x2 + 1] = gx_g / weights;
      data2[x2 + 2] = gx_b / weights;
      data2[x2 + 3] = gx_a / weights_alpha;
    }
  }
  ctx2.putImageData(img2, 0, 0);
}

(() => {

  const mobileWidth = 680;
  const onNavItemClick = () => {
    const navItemList = document.querySelectorAll(".aw-section-link");
    const navItems = [...navItemList];

    navItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();

        const sectionId =
          event.target.getAttribute("href") || event.target.dataset.href;

        scrollToSection(sectionId);
      });
    });
  };

  const scrollToSection = (sectionId) => {
    let sectionPosition, sectionOffset;
    const navigationHeight = document.querySelector("header nav").offsetHeight;
    const pageWidth = window.innerWidth;
    console.log("hola");

    if (sectionId !== "#") {
      sectionOffset = document.querySelector(sectionId).offsetTop;
      sectionPosition =
        pageWidth > mobileWidth
          ? sectionOffset - navigationHeight
          : sectionOffset;
    } else {
      sectionPosition = 0;
    }

    window.scrollTo({
      behavior: "smooth",
      left: 0,
      top: sectionPosition,
    });
  };

  const addMenuBackground = () => {
    const pageWidth = window.innerWidth;
    const boddyOffset =
      document.body.scrollTop || document.documentElement.scrollTop;
    const navigation = document.querySelector("header nav");

    if (pageWidth > mobileWidth) {
      boddyOffset > 0
        ? navigation.classList.add("aw-nav-fixed")
        : navigation.classList.remove("aw-nav-fixed");
    }
  };

  window.addEventListener("scroll", () => {
    addMenuBackground();
  });
  onNavItemClick();
})();
