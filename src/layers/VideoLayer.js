/*globals WebGL */
function VideoLayer(videoDOMElement) {"use strict";

    var gl = null, map, shaderProgram, sphereGeometry = [], texture = null, timer;
    this.canvas = null;
    this.projection = null;
    this.mapScale = 1;
    this.mapCenter = {
        lon0 : 0,
        lat0 : 0
    };

    videoDOMElement.addEventListener("ended", function() {
        window.cancelAnimationFrame(timer);
    }, true);

    function updateTexture() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoDOMElement);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "texture"), 0);
    }


    this.render = function() {
        var uniforms;

        // render() is calling itself in a rendering loop, and render() is also called when the projection changes.
        // To avoid multiple concurrent rendering loops, the current loop has to be stopped.
        window.cancelAnimationFrame(timer);

        if (gl === null) {
            return;
        }

        if (videoDOMElement.paused) {
            videoDOMElement.play();
        }

        updateTexture();

        uniforms = this.projection.getShaderUniforms();
        WebGL.draw(gl, this.mapScale / this.refScaleFactor * this.glScale, this.mapCenter.lon0, uniforms, this.canvas, sphereGeometry, shaderProgram);

        timer = window.requestAnimationFrame(function() {
            map.render(false);
        });
    };

    this.clear = function() {
        window.cancelAnimationFrame(timer);
        timer = null;
        if (gl !== null) {
            WebGL.clear(gl);
            gl.deleteTexture(texture);
            gl.deleteProgram(shaderProgram);
            WebGL.deleteGeometry(gl, sphereGeometry);
        }
        videoDOMElement.pause();
    };

    this.load = function(m) {
        map = m;
        gl = WebGL.init(this.canvas);
        if (gl === null) {
            throw new Error("WebGL is not available. Firefox or Chrome is required.");
        }
        shaderProgram = WebGL.loadShaderProgram(gl, 'shader/vs/forward.vert', 'shader/fs/forward.frag');
        texture = gl.createTexture();
        sphereGeometry = WebGL.loadGeometry(gl);
        if (videoDOMElement.paused) {
            videoDOMElement.play();
        }
    };

    this.resize = function(w, h) {
        if (gl !== null) {
            // http://www.khronos.org/registry/webgl/specs/1.0/#2.3
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        }
    };
}