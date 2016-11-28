$(document).ready(function () {

  /*  Initialization
    ------------------------------------- */

  _.extend(window.BlotterSite, {
    Views : {},
    Models : {},
    Collections : {},
    Helpers : {},
    Components : {},
    Extensions : {},
    Router : null,

    init : function () {
      this.instance = new BlotterSite.Views.App();

      this.marginaliaManager = new BlotterSite.Helpers.GlitchMarginaliaCanvasManager($("#marginalia-container"));

      Backbone.history.start();

      this.initRoute = /\#\/(.*)/.exec(Backbone.history.location.hash)[1];

      this.setListeners();
    },

    setListeners : function () {
      $("body").on("navReady", _.bind(this.handleNavReady, this));
    },

    handleNavReady : function () {
      $("body").trigger("pathChange",  this.initRoute);
    }
  });

  $(function() {
    window.BlotterSite.init();
  });


  /*  Router
    ------------------------------------- */

  BlotterSite.Router = Backbone.Router.extend({
    routes : {
      "overview" : "overview",
      "basics" : "basics",
      "packs" : "packs",
      "" : "home"
    },

    home : function () {
      var view = new BlotterSite.Views.Home();

      $("body").trigger("pathChange");

      BlotterSite.instance.goto(view);
    },

    overview : function () {
      var view = new BlotterSite.Views.Overview();

      $("body").trigger("pathChange", ["overview"]);

      BlotterSite.instance.goto(view);
    },

    basics : function () {
      var view = new BlotterSite.Views.Basics();

      $("body").trigger("pathChange", ["basics"]);

      BlotterSite.instance.goto(view);
    },

    packs : function () {
      var view = new BlotterSite.Views.Packs();

      $("body").trigger("pathChange", ["packs"]);

      BlotterSite.instance.goto(view);
    }
  });


  /*  Helpers
    ------------------------------------- */

  BlotterSite.Helpers.DropdownSelect = function (el) {
    this.init.apply(this, arguments);
  };

  BlotterSite.Helpers.DropdownSelect.prototype = (function () {

    return {
      constructor : BlotterSite.Helpers.DropdownSelect,

      init : function (el) {
        this.el = el;
        this.titleEl = this.el.find(".dropdown-title");
        this.dropdownEl = this.el.find(".dropdown-options");

        this.title = this.titleEl.html();

        this.setupListeners();
      },

      setupListeners : function () {
        this.titleEl.on("click", _.bind(this.handleToggleClick, this));
        this.dropdownEl.find("li").on("mouseover", _.bind(this.handleSelectionHover, this));
        this.dropdownEl.find("li").on("click", _.bind(this.handleSelectionClick, this));
        this.on("selectionMade", _.bind(this.handleSelectionMade, this));
      },

      handleToggleClick : function (e) {
        e.preventDefault();

        var hidden = !this.dropdownEl.is(":visible");

        hidden ? this.showDropdown() : this.hideDropdown();
      },

      showDropdown : function () {
        if (!this.dropdownEl.is(":visible")) {
          this.dropdownEl.velocity('transition.slideDownIn', {
            duration : 150,
            easing : [0.645, 0.045, 0.355, 1.0]
          });

          this.boundBodyListener = this.boundBodyListener || _.bind(this.bodyListener, this);
          $("html").on("mousedown", this.boundBodyListener);
        }
      },

      hideDropdown : function () {
        this.dropdownEl.velocity("reverse", {
          display : "none"
        });

        this.boundBodyListener && $("html").off("mousedown", this.boundBodyListener);
        this.boundBodyListener = null;

        this.titleEl.html(this.title);
      },

      handleSelectionHover : function (e) {
        var target = $(e.currentTarget);

        this.titleEl.html(target.data("title"));
      },

      handleSelectionClick : function (e) {
        e.preventDefault;
        var target = $(e.currentTarget);

        this.trigger("selectionMade", [target.data("value"), target.data("title")]);
      },

      handleSelectionMade : function (value, title) {
        this.value = value;
        this.title = title;

        this.hideDropdown();
      },

      bodyListener : function (e) {
        var target = $(e.target);

        if (!target.parents(".dropdown-select").length) {
          this.hideDropdown();
        }
      }
    }
  })();
  _.extend(BlotterSite.Helpers.DropdownSelect.prototype, EventEmitter.prototype);


  /*  Components
    ------------------------------------- */

  BlotterSite.Components.Editor = function (el) {
    this.init.apply(this, arguments);
  };

  BlotterSite.Components.Editor.prototype = (function () {

    function _buildJSMirror (el, code) {
      return CodeMirror(el, {
        value: code,
        mode: "javascript",
        tabSize: 2,
        lineWrapping: true,
        lineNumbers: true
      });
    }

    function _buildHTMLMirror (el, code) {
      return CodeMirror(el, {
        value: code,
        mode: "html",
        tabSize: 2,
        lineWrapping: true,
        lineNumbers: true
      });
    }

    return {

      constructor : BlotterSite.Components.Editor,

      init : function (el) {
        this.el = el;
        this.outputEl = el.find(".output");

        this.jsCode = el.find("script.js-code").html();
        this.htmlCode = this.outputEl.html();
        this.jsContent = el.find(".js-content");
        this.htmlContent = el.find(".html-content");

        this.jsMirror = _buildJSMirror(this.jsContent[0], this.jsCode);
        this.htmlMirror = _buildHTMLMirror(this.htmlContent[0], this.htmlCode);

        this.jsMirror.on("change", _.bind(_.debounce(this.update, 1000), this));
        this.htmlMirror.on("change", _.bind(_.debounce(this.update, 1000), this));

        this.htmlDoc = this.htmlMirror.getDoc();
        this.jsDoc = this.jsMirror.getDoc();

        this.setupListeners();
        this.update();
        this.showJSContent();
      },

      setupListeners : function () {
        this.el.find(".js-tab").on("click", _.bind(this.showJSContent, this));
        this.el.find(".html-tab").on("click", _.bind(this.showHTMLContent, this));
      },

      update : function() {
        this.htmlMirror.setSize("auto", "auto");
        this.htmlCode = this.htmlDoc.getValue();
        try {
          this.outputEl.html(unescape(this.htmlCode));
        } catch (e) {
          console.log(e);
        }

        this.jsMirror.setSize("auto", "auto");
        this.jsCode = this.jsDoc.getValue();
        try {
          eval(this.jsCode); // yikes!
        } catch (e) {
          console.log(e);
        }
      },

      showJSContent : function () {
        this.htmlContent.hide();
        this.jsContent.show();
      },

      showHTMLContent : function () {
        this.jsContent.hide();
        this.htmlContent.show();
      },

      largestSize : function () {
        var htmlMirrorSize = this.htmlMirror.getScrollInfo(),
            jsMirrorSize = this.jsMirror.getScrollInfo(),
            size = {};

        size.width = Math.max(jsMirrorSize.width, htmlMirrorSize.width);
        size.height = Math.max(jsMirrorSize.height, htmlMirrorSize.height);

        return size;
      }
    }
  })();


  BlotterSite.Helpers.GlitchMarginalia = function (canvas) {
    this.init.apply(this, arguments);
  }

  BlotterSite.Helpers.GlitchMarginalia.prototype = (function () {
    var rtVertexSrc = [

      "varying vec2 _vTexCoord;",

      "void main() {",

      "  _vTexCoord = uv;",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

      "}"

    ].join("\n");

    var rtFragmentSrc = [

      "// Based heavily on https://thebookofshaders.com/13/ by Patricio Gonzalez Vivo",
      "// and https://www.shadertoy.com/view/MslGR8 by Hornet",

      "uniform vec2 uResolution;",
      "uniform vec2 uSamplerResolution;",
      "uniform sampler2D uSampler;",
      "uniform float uTime;",
      "uniform float uTimeOffset;",

      "varying vec2 _vTexCoord;",

      "float random (in vec2 st) {",
      "    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);",
      "}",

      "// Based on Morgan McGuire @morgan3d",
      "// https://www.shadertoy.com/view/4dS3Wd",
      "float noise (in vec2 st) {",
      "    vec2 i = floor(st);",
      "    vec2 f = fract(st);",

      "    // Four corners in 2D of a tile",
      "    float a = random(i);",
      "    float b = random(i + vec2(1.0, 0.0));",
      "    float c = random(i + vec2(0.0, 1.0));",
      "    float d = random(i + vec2(1.0, 1.0));",

      "    vec2 u = f * f * (3.0 - 2.0 * f);",

      "    return mix(a, b, u.x) + ",
      "            (c - a)* u.y * (1.0 - u.x) + ",
      "            (d - b) * u.x * u.y;",
      "}",

      "float fbm (in vec2 st, in float speed) {",
      "    // Initial values",
      "    float value = 0.0;",
      "    float amplitud = .5;",
      "    float frequency = 0.;",
      "    float offsetTime = (uTime + uTimeOffset);",

      "    // Loop of octaves",
      "    for (int i = 0; i < 6; i++) {",
      "        value += amplitud * noise(st + speed * offsetTime);",
      "        st *= 2.;",
      "        amplitud *= .5;",
      "    }",
      "    return value;",
      "}",

      "void combineColors( out vec4 adjustedColor, in vec4 bg, in vec4 color ) {",
      "    float a = color.a;",

      "    float r = (1.0 - a) * bg.r + a * color.r;",
      "    float g = (1.0 - a) * bg.g + a * color.g;",
      "    float b = (1.0 - a) * bg.b + a * color.b;",

      "    adjustedColor = vec4(r, g, b, 1.0);",
      "}",

      "void main () {",
      "    vec2 uv = _vTexCoord;",

      "    const float c0 = 128.0;",

      "    float offsetTime = (uTime + uTimeOffset);",
      "    float ditherSpeed = 0.5;",
      "    float fogSpeed = 0.7;",
      "    float spread = 2.0;",
      "    float mipLevel = 0.0;",

      "    float its = mix(0.0, 1.0 / c0, 0.985 + (0.015 * sin(ditherSpeed * offsetTime)));",
      "    float ofs = texture2D(uSampler, gl_FragCoord.xy / uSamplerResolution / spread, mipLevel).r;",

      "    vec3 ditherColor;",
      "    ditherColor = vec3(its + (ofs / 255.0));",
      "    ditherColor.rgb = floor(ditherColor.rgb * 255.0) / 255.0;",
      "    ditherColor.rgb *= c0;",

      "    vec2 st = uv;",
      "    st.x *= (uResolution.x / uResolution.y) / 2.0;",
      "    vec3 noise = vec3(0.0);",
      "    noise += fbm(st * 3.344, fogSpeed);",

      "    float alphaModifier = smoothstep(0.0, 1.0, (noise.r + noise.g + noise.b) / 3.0) - 0.185;",

      "    vec4 outColor = vec4(vec3(0.0), smoothstep(0.0, 0.65, (1.0 - min(ditherColor.r, min(ditherColor.g, ditherColor.b))) * alphaModifier));",
      "    combineColors(gl_FragColor, vec4(1.0), outColor);",
      "}"

    ].join("\n");

    var vertexSrc = [

      "varying vec2 _vTexCoord;",

      "void main() {",

      "  _vTexCoord = uv;",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

      "}"

    ].join("\n");

    var fragmentSrc = [
      "// Based on https://www.shadertoy.com/view/Md2GDw by Kusma",

      "uniform vec2 uResolution;",
      "uniform sampler2D uSampler;",
      "uniform float uTime;",
      "uniform float uTimeOffset;",

      "varying vec2 _vTexCoord;",

      "void rgbaFromRgb( out vec4 rgba, in vec3 rgb ) {",
      "  float a = 1.0 - min(rgb.r, min(rgb.g, rgb.b));",

      "  float r = 1.0 - (1.0 - rgb.r) / a;",
      "  float g = 1.0 - (1.0 - rgb.g) / a;",
      "  float b = 1.0 - (1.0 - rgb.b) / a;",

      "  rgba = vec4(r, g, b, a);",
      "}",

      "vec3 gamma(vec3 value, float param) {",
      "  return vec3(pow(abs(value.r), param),pow(abs(value.g), param),pow(abs(value.b), param));",
      "}",

      "vec4 invert(vec4 color) {",
      "  return vec4(",
      "    1.0 - color.r,",
      "    1.0 - color.g,",
      "    1.0 - color.b,",
      "    color.a",
      "  );",
      "}",

      "void main () {",
      "    vec2 uv = _vTexCoord;",
      "    float offsetTime = (uTime + uTimeOffset);",

      "    vec2 block = floor(gl_FragCoord.xy / vec2(64));",
      "    vec2 uv_noise = block / vec2(64);",
      "    uv_noise += floor(vec2(offsetTime)) / vec2(128);",

      "    float block_thresh = pow(fract((offsetTime * 0.5) * 1236.0453), 2.0) * 1.15;",

      "    vec2 uv_r = uv, uv_g = uv, uv_b = uv;",

      "    if (texture2D(uSampler, uv_noise).r < block_thresh ) {",
      "      vec2 dist = (fract(uv_noise) / uResolution.xy) * 8.25;",
      "      uv_r += dist * 1.65;",
      "      uv_g += dist * 1.05;",
      "      uv_b += dist * 1.795;",
      "    }",

      "    vec4 outColor;",
      "    outColor.r = texture2D(uSampler, uv_r).r;",
      "    outColor.g = texture2D(uSampler, uv_g).g;",
      "    outColor.b = texture2D(uSampler, uv_b).b;",

      "    rgbaFromRgb(outColor, outColor.rgb);",
      "    gl_FragColor = outColor;",

      "    // Uncomment to invert.",
      "    //rgbaFromRgb(outColor, gamma(outColor.rgb, 10.0));",
      "    //gl_FragColor = invert(outColor);",
      "}"

    ].join("\n");

    return {
      constructor : BlotterSite.Helpers.GlitchMarginalia,

      init : function (canvas) {
        this.canvas = canvas;
        this.$canvas = $(canvas);
        this.width = this.$canvas.width();
        this.height = this.$canvas.height();

        // Note: The imageSrc string is the base64 encoded version of the image at ./images/glitch_marginalia_texture.png
        //   This allows us to dev locally without running a server and I'm mostly ok with it for this.
        this.imageSrc = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAAAAADhZOFXAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAZklEQVR42mJgaFRYyNGpsQoggBgOOTxKPOXxKhMggBgMNglMtNglMRMggBg+FV4K+FV5KxIggJikZKLiuHi8fAACiOGcz7vcYy7PUgECiMFmn8xck20iUwECiOnw/kMHDgExQIABABXjH1aG9oGDAAAAAElFTkSuQmCC";
        this.imageWidth = 8;
        this.imageHeight = 8;

        this.rtVertexSrc = rtVertexSrc;
        this.rtFragmentSrc = rtFragmentSrc;

        this.vertexSrc = vertexSrc;
        this.fragmentSrc = fragmentSrc;

        this.startTime = new Date().getTime();
        this.timeOffset = _.random(0, 42);
      },

      build : function (callback) {
        this.texture = new THREE.TextureLoader().load(this.imageSrc, _.bind(function () {
          this.texture.wrapS = THREE.RepeatWrapping;
          this.texture.wrapT = THREE.RepeatWrapping;
          this.texture.minFilter = THREE.NearestMipMapNearestFilter;
          this.texture.magFilter = THREE.NearestFilter;
          this.texture.generateMipmaps = true;


          // Prepare Render Target scene.
          this.rtScene = new THREE.Scene();
          this.rtPlane =  new THREE.PlaneGeometry(1, 1);
          this.rtTexture = new THREE.WebGLRenderTarget(this.width, this.height);
          this.rtUniforms = {
            uResolution : { type : "2f", value : [this.width, this.height] },
            uSamplerResolution : { type : "2f", value : [this.imageWidth, this.imageHeight] },
            uTime : { type : "f", value : 0.0 },
            uTimeOffset : { type : "f", value : this.timeOffset },
            uSampler: { type: "t", value: this.texture }
          };
          this.rtMaterial = new THREE.ShaderMaterial({
            uniforms : this.rtUniforms,
            vertexShader : this.rtVertexSrc,
            fragmentShader : this.rtFragmentSrc,
          });
          this.rtMesh = new THREE.Mesh(this.rtPlane, this.rtMaterial);
          this.rtScene.add(this.rtMesh);


          // Prepare main scene.
          this.scene = new THREE.Scene();
          this.plane =  new THREE.PlaneGeometry(1, 1);
          this.uniforms = {
            uResolution : { type : "2f", value : [this.width, this.height] },
            uTime : { type : "f", value : 0.0 },
            uTimeOffset : { type : "f", value : this.timeOffset },
            uSampler: { type: "t", value: this.rtTexture.texture }
          };
          this.material = new THREE.ShaderMaterial({
            uniforms : this.uniforms,
            vertexShader : this.vertexSrc,
            fragmentShader : this.fragmentSrc,
          });
          this.mesh = new THREE.Mesh(this.plane, this.material);
          this.scene.add(this.mesh);

          this.camera = new THREE.OrthographicCamera(0.5, 0.5, 0.5, 0.5, 0, 100);
          this.renderer = new THREE.WebGLRenderer( { canvas : this.canvas, alpha : true } );
          this.renderer.autoClear = false;

          this._establishSize();
          this.animate();

          callback && callback();
        }, this));
      },

      animate : function () {
        requestAnimationFrame(_.bind(this.animate, this));
        this.render();
      },

      render : function () {
        var time = (new Date().getTime() - this.startTime) / 1000;
        this.rtMaterial.uniforms.uTime.value = time;
        this.material.uniforms.uTime.value = time;

        this.renderer.render(this.rtScene,this.camera, this.rtTexture, true);
        this.renderer.render(this.scene, this.camera);
      },

      resetSize : function () {
        this.width = this.$canvas.width();
        this.height = this.$canvas.height();
        this._establishSize();
      },

      _establishSize : function () {
        this.renderer.setSize(this.width, this.height);
        this.rtTexture.setSize(this.width, this.height);

        this.camera.left = this.width / - 2;
        this.camera.right = this.width / 2;
        this.camera.top = this.height / 2;
        this.camera.bottom = this.height / - 2;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.rtMesh.scale.set(this.width, this.height, 1);
        this.mesh.scale.set(this.width, this.height, 1);

        this.rtMaterial.uniforms.uResolution.value = [this.width, this.height];
        this.material.uniforms.uResolution.value = [this.width, this.height];

        if (this.height <= 26) {
          this.texture.wrapT = THREE.ClampToEdgeWrapping;
          this.texture.needsUpdate = true;
          this.textureNeedsWrapUpdate = true;
        } else if (this.textureNeedsWrapUpdate == true) {
          this.texture.wrapT = THREE.RepeatWrapping;
          this.texture.needsUpdate = true;
          this.textureNeedsWrapUpdate = false;
        }
      }
    }
  })();



  BlotterSite.Helpers.GlitchMarginaliaCanvas = function (generator, rect) {
    this.init.apply(this, arguments);
  }

  BlotterSite.Helpers.GlitchMarginaliaCanvas.prototype = (function () {

    var _pixelRatio = (function () {
      var vendorPrefixes = ["ms", "moz", "webkit", "o"],
          ctx = document.createElement("canvas").getContext("2d"),
          dpr = window.devicePixelRatio || 1,
          bsr = ctx.backingStorePixelRatio;

      for(var x = 0; x < vendorPrefixes.length && !bsr; ++x) {
        bsr = ctx[vendorPrefixes[x]+"BackingStorePixelRatio"];
      }

      bsr = bsr || 1;

      return (dpr / bsr);
    })();

    function _buildCanvas () {
      var canvas = document.createElement("canvas");

      $(canvas).addClass("marginalia");

      return canvas;
    }

    return {
      constructor : BlotterSite.Helpers.GlitchMarginaliaCanvas,

      set rect (rect) {
        this.width = rect.w;
        this.height = rect.h;
        this.x = rect.x;
        this.y = rect.y;
        this._rect = rect;

        this._updateDomElement();
      },

      get rect () {
        return this._rect;
      },

      init : function (generator, rect) {
        this.generator = generator;
        this.pixelRatio = _pixelRatio;
        this.rect = rect;

        return this.domElement;
      },

      resetRect : function (appendToContainer) {
        this.rect = this.generator.randomRect();

        if (appendToContainer) {
          this.generator.container.append($(this.domElement));
        }
      },

      _updateDomElement : function () {
        this.domElement = this.domElement || _buildCanvas();

        this.domElement.width = this.width * this.pixelRatio;
        this.domElement.height = this.height * this.pixelRatio;
        this.domElement.style.width = this.width + "px";
        this.domElement.style.height = this.height + "px";

        this.domElement.style.left = this.x + "px";
        this.domElement.style.top = this.y + "px";
      }
    }
  })();


  BlotterSite.Helpers.GlitchMarginaliaCanvasGenerator = function (container) {
    this.init.apply(this, arguments);
  }

  BlotterSite.Helpers.GlitchMarginaliaCanvasGenerator.prototype = (function () {

    return {
      constructor : BlotterSite.Helpers.GlitchMarginaliaCanvasGenerator,

      get padding () {
        return this._padding;
      },

      set padding (value) {
        this._padding = value;
        this._updateMinMax();
      },

      init : function (container) {
        this.container = $(container);
        this.width = container.width();
        this.height = container.height();

        this.padding = 52;

        this.sizes = [
          [26, 26],
          [26, 104],
          [26, 208],
          [26, 260],
          [26, 312],
          [26, 364],
          [26, 416],
          [52, 104],
          [52, 208],
          [52, 260],
          [52, 312],
          [52, 364],
          [52, 416],
          [104, 104],
          [104, 208],
          [104, 260],
          [104, 312],
          [104, 364],
          [104, 416]
        ];

        this.setListeners();
      },

      setListeners : function () {
        $(window).on("resize", _.bind(this.handleResize, this));
      },

      handleResize : _.debounce(function () {
        this.width = this.container.width();
        this.height = this.container.height();
        this._updateMinMax();
      }, 500),

      generate : function (append) {
        var marginaliaCanvas = new BlotterSite.Helpers.GlitchMarginaliaCanvas(this, this.randomRect());

        if (true) {
          this.container.append($(marginaliaCanvas.domElement));
        }

        return marginaliaCanvas;
      },

      randomRect : function () {
        var sizeChoice = this.sizes[_.random(0, this.sizes.length - 1)],
            iX = _.random(0, 1),
            iY = 1 - iX, // 0 or 1, opposite of iX
            width = sizeChoice[iX],
            height = sizeChoice[iY],
            maxOriginX = this.maxX - width,
            maxOriginY = this.maxY - height,
            originX = _.random(this.minX, maxOriginX),
            originY = _.random(this.minY, maxOriginY);

        return {
          x : originX,
          y : originY,
          w : width,
          h : height
        }
      },

      _updateMinMax () {
        this.minX = this._padding;
        this.minY = this._padding;
        this.maxX = this.width - this._padding;
        this.maxY = this.height - this._padding;
      }
    }
  })();


  BlotterSite.Helpers.GlitchMarginaliaCanvasManager = function($container, canvasCount) {
    this.init.apply(this, arguments);
  }

  BlotterSite.Helpers.GlitchMarginaliaCanvasManager.prototype = (function () {
    return {
      constructor: BlotterSite.Helpers.GlitchMarginaliaCanvasManager,

      init : function ($container, canvasCount) {
        this.$container = $container;
        this.canvasCount = canvasCount || 2;

        this.lifecycles = [1000, 1500, 2000, 2500, 3000, 4000];
        this.deathcycles = [0, 500, 1000, 1500, 2000, 2500, 3000, 4000, 6000, 6500, 7000, 7500, 8000, 9000, 9500];
        this.generator = new BlotterSite.Helpers.GlitchMarginaliaCanvasGenerator(this.$container);

        this.generateMarginalia();
      },

      updateSize : function () {
        this.generator.handleResize();
      },

      generateMarginalia : function () {
        this.generateMarginalia = _.reduce(new Array(this.canvasCount), _.bind(function (memo, nothing) {
          var canvas = this.generator.generate(true),
              glitch = new BlotterSite.Helpers.GlitchMarginalia(canvas.domElement);

          var marginalia = { canvas : canvas, glitch : glitch };

          glitch.build(_.bind(function () {
            this.applyMarginalia(marginalia);
          }, this));

          memo.push(marginalia);
          return memo;
        }, this), []);
      },

      applyMarginalia : function (marginalia) {
        var lifecycle = this.lifecycles[_.random(0, this.lifecycles.length - 1)];
        $(marginalia.canvas.domElement).show();
        marginalia.canvas.resetRect();
        marginalia.glitch.resetSize();

        (_.bind(function (marginalia, lifecycle) {
          _.delay(_.bind(function () {
            var deathcycle = this.deathcycles[_.random(0, this.deathcycles.length - 1)];
            $(marginalia.canvas.domElement).hide();

            (_.bind(function (marginalia, deathcycle) {
              _.delay(_.bind(function () {
                this.applyMarginalia(marginalia);
              }, this), deathcycle);
            }, this))(marginalia, deathcycle);
          }, this), lifecycle);
        }, this))(marginalia, lifecycle);
      }
    }
  })();


  /*  Extensions
    ------------------------------------- */

  BlotterSite.Extensions.View = Marionette.ItemView.extend({
    template : _.template("<div></div>")(),

    initialize : function () {
      this.router = new BlotterSite.Router();
    },

    transitionIn : function (callback) {
      var view = this,
          delay;

      var transitionIn = function () {
        view.$el.addClass("is-visible");
        view.$el.on("transitionend", function () {
          if (_.isFunction(callback)) {
            callback();
          }
        })
      };

      _.delay(transitionIn, 20);
    },

    transitionOut : function (callback) {
      var view = this;

      view.$el.removeClass("is-visible");
      view.$el.on("transitionend", function () {
        if (_.isFunction(callback)) {
          callback();
        };
      });
    }
  });


  /*  Models
    ------------------------------------- */

  BlotterSite.Models.PackShader = Backbone.Model.extend({
    defaults : {
      packName : "",
      materialName : ""
    },

    packShader : function () {
      return window["BlotterSite"]["PackShaders"][this.get("materialName")];
    },

    path : function () {
      return "./shaders/" + this.get("materialName") + ".html";
    }
  });


  /*  Collections
    ------------------------------------- */

  BlotterSite.Collections.PackShaders = Backbone.Collection.extend({
    model : BlotterSite.Models.PackShader
  })


  /*  Views
    ------------------------------------- */

  BlotterSite.Views.App = Marionette.LayoutView.extend({
    el : "#layout",

    regions : {
      "contentRegion" : ".content-region"
    },

    initialize : function () {
      this.router = new BlotterSite.Router();
    },

    goto : function (view) {
      var previous = this.currentPage || null,
          next = view;

      if (this.contentRegion.currentView) {
        //previous.transitionOut(function () {
          this.contentRegion.empty();
        //});
      }

      this.contentRegion.show(next);
      //next.transitionIn();

      BlotterSite.marginaliaManager.updateSize();
    }
  });


  BlotterSite.Views.Home = BlotterSite.Extensions.View.extend({
    className : "home",
    template : _.template($("template[name=home]").html())(),

    onRender : function () {
      this.dropwdownEl = this.$el.find(".dropdown-select");
      this.dropdownSelect = new BlotterSite.Helpers.DropdownSelect(this.dropwdownEl);

      this.downloadBtn = this.$el.find(".download-btn");

      this.setupListeners();
    },

    setupListeners : function () {
      this.dropdownSelect.on("selectionMade", _.bind(this.handleSelectionMade, this));
    },

    handleSelectionMade : function (value, title) {
      this.downloadBtn.attr("href", value);
    }
  });


  BlotterSite.Views.Overview = BlotterSite.Extensions.View.extend({
    className : "overview",
    template : _.template($("template[name=overview]").html())()
  });


  BlotterSite.Views.Basics = BlotterSite.Extensions.View.extend({
    className : "basics",
    template : _.template($("template[name=basics]").html())(),

    onShow : function () {
      this.setupEditors();
    },

    setupEditors : function () {
      this.editors = _.reduce(this.$el.find(".tabbed-editor"), function (m, el) {
        m.push(new BlotterSite.Components.Editor($(el)));
        return m;
      }, []);
    }
  });


  BlotterSite.Views.PackShaderListItem = Marionette.ItemView.extend({
    tagName : "li",
    events : {
      "click" : "handleClick"
    },

    initialize : function (options) {
      _.extend(this, options);

      var templateHTMLStr = [
        "<div>",
        "  <div class='pack-shader-overlay'>",
        "    <span class='pack-shader-name'><%= materialName %></span>",
        "    <span class='pack-name'><%= packName %></span>",
        "  </div>",
        "</div>"
      ].join("");

      this.template = _.template(templateHTMLStr)(this.model.toJSON());

      this.text = new Blotter.Text(this.textStr, this.textProperties);
    },

    onRender : function () {
      var PackShader = this.model.packShader();
      this.packShaderInstance = new PackShader(this.$el, this.text);
    },

    handleClick : function (e) {
      e && e.preventDefault();
      window.location.href = this.model.path();
    }
  });


  BlotterSite.Views.PacksList = Marionette.CompositeView.extend({
    childView : BlotterSite.Views.PackShaderListItem,
    childViewContainer : "ul.pack-shaders",
    template : _.template("<div><ul class='pack-shaders'></ul></div>")(),

    childViewOptions : function () {
      return {
        textStr : this.textStr,
        textProperties : this.textProperties
      };
    },

    initialize : function (options) {
      _.extend(this, options);

      this.textStr = "B";
      this.textProperties = {
        family : "'SerapionPro', sans-serif",
        size : 68,
        leading : "123px",
        paddingLeft : 40,
        paddingRight: 40,
        fill : "#1E1A1B"
      };

      this.collection = new BlotterSite.Collections.PackShaders([
        { materialName : "RollDistortMaterial", packName : "glitch_pack_1"},
        { materialName : "RGBSplitMaterial", packName : "glitch_pack_1"},
        { materialName : "BubbleSplitMaterial", packName : "glitch_pack_1"}
      ]);
    }
  });


  BlotterSite.Views.Packs = BlotterSite.Extensions.View.extend({
    className : "packs",
    template : _.template($("template[name=packs]").html())(),

    onRender : function () {
      this.packsList = new BlotterSite.Views.PacksList();
      this.packsList.render();
      this.$el.find(".packs-list-region").html(this.packsList.$el);
    }
  });

}());