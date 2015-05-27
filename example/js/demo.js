window.onload = function() {
    var gc = new GiantComponent({
        DOMParent: document.body,
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
        vertexRad: 1,
        numVertices: Math.floor((document.body.offsetWidth/100)*(document.body.offsetHeight/100)),
        vertexColor: function() {
            return 0xFFFFFF;
        },
        vertexMaxSpeed: 4,
        vertexMouseSensitivity: 10,
        edgeWidth: 1,
        edgeThreshold: 200,
        edgeColor: function() {
            return Math.floor(Math.random()*256*256*256);
        }
    });
    gc.start();
}
