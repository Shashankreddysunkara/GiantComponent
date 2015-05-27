/******************************************************************************
 * giant_component.js
 *
 * Author: Sunjay Bhatia 2015
 *
 * GiantComponent API:
 *     Constructor:
 *         Description: builds GiantComponent object
 *         Options:             
 *             DOMParent: DOM element to append giant component rendering area
 *             width: integer, width of rendering area
 *             height: integer, height of rendering area
 *             vertexRad: number, radius of vertex
 *             numVertices: integer, number of vertices rendered
 *             vertexColor: function, vertex color
 *             vertexMaxSpeed: number, max speed of vertices when moused over
 *             vertexMouseSensitivity: number, increases mouse over area
 *             edgeWidth: number, width of edges
 *             edgeThreshold: number, maximum length of visibility for edges
 *             edgeColor: function, edge color
 *     start:
 *         Description: start the giant component animation
 *     pause:
 *         Description: pause the giant component animation
 *     unpause:
 *         Description: unpause the giant component animation
 *     end:
 *         Description: stop and clear the giant component animation
 *****************************************************************************/

function GiantComponent(options) {
    var t = this;

    var size = {
        w: options.width,
        h: options.height
    }
    
    var renderer = PIXI.autoDetectRenderer(size.w, size.h, { antialias: true, transparent: true });
    
    var DOMParent = options.DOMParent;
    DOMParent.appendChild(renderer.view);
    
    var graph = new PIXI.Container();
    graph.interactive = true;
    
    var vertexRad = options.vertexRad;
    var vertexColor = options.vertexColor;
    var numVertices = options.numVertices;
    var vertexMaxSpeed = options.vertexMaxSpeed;
    var vertexMouseSensitivity = options.vertexMouseSensitivity;
    var vertices = [];
    
    var edgeWidth = options.edgeWidth;
    var edgeColor = options.edgeColor;
    var edgeThresh = options.edgeThreshold;
    var numEdges = 0;
    var maxNumEdges = (numVertices*(numVertices-1))/2;
    var edges = [];
    var adjMatrix = [];
    
    var paused = false;
    var stopped = true;
    
    
    function Vertex() {
        var t = this;

        t.x = Math.floor(Math.random()*size.w);
        t.y = Math.floor(Math.random()*size.h);
        t.v = new PIXI.Graphics();
        var opacity = 0;  // vertices start transparent
        var speed = 1;
        var maxSpeed = vertexMaxSpeed;
        var maxSpeedyFrames = 50;
        var numSpeedyFrames = 0;
        var dest, move;
        
        function draw() {
            t.v.clear();
            t.v.interactive = true;
            var area = [t.x+(vertexRad+vertexMouseSensitivity), t.y,
                        t.x, t.y+(vertexRad+vertexMouseSensitivity),
                        t.x-(vertexRad+vertexMouseSensitivity), t.y,
                        t.x, t.y-(vertexRad+vertexMouseSensitivity)];
            t.v.hitArea = new PIXI.Polygon(area);
            t.v.mouseover = function(mouseData) {
                speed = maxSpeed;
                numSpeedyFrames = maxSpeedyFrames;
            };
            t.v.lineStyle(0); // no outline
            t.v.beginFill(vertexColor(), opacity);
            t.v.drawCircle(t.x, t.y, vertexRad);
            t.v.endFill();
        }

        t.showVertex = function() {
            opacity = 1;
        }

        t.genDest = function() {
            var x = Math.floor(Math.random()*size.w);
            var y = Math.floor(Math.random()*size.h);
            dest = {x: x, y: y};
            var xDist = x-t.x;
            var yDist = y-t.y;
            var dist = Math.sqrt((xDist*xDist)+(yDist*yDist));
            move = {x: xDist/dist, y: yDist/dist};
        }

        t.moveFrame = function() {
            // check if out of bounds
            if (t.x <= 0 || t.x >= size.w || t.x == dest.x ||
                t.y <= 0 || t.y >= size.h || t.y == dest.y) {
                t.genDest();
            }
            t.x += move.x*speed;
            t.y += move.y*speed;
            if (numSpeedyFrames == 0) {
                speed = 1;
            } else {
                // slow point down as it nears end of speedy time
                numSpeedyFrames--;
                speed = Math.max(1, maxSpeed*(1-((maxSpeedyFrames-numSpeedyFrames)/maxSpeedyFrames)))
            }
            draw();
        }

        draw();
        t.genDest();
    }

    function placeVertices() {
        for (var i = 0; i < numVertices; ++i) {
            var vert = new Vertex();
            graph.addChild(vert.v);
            vertices.push(vert);
            adjMatrix.push(new Set());
        }
    }

    function edgeExists(src, dest) {
        return adjMatrix[src].has(dest) || adjMatrix[dest].has(src);
    }

    function chooseNewEdgeSrc() {
        var src = Math.floor(Math.random()*numVertices);
        while (adjMatrix[src].size >= numVertices-1) {
            src = Math.floor(Math.random()*numVertices);
        }
        return src;
    }

    function chooseNewEdgeDest(src) {
        var dest = Math.floor(Math.random()*numVertices);
        while (dest == src || edgeExists(src, dest)) {
            dest = Math.floor(Math.random()*numVertices);
        }
        return dest;
    }

    function Edge(src, dest) {
        var t = this;

        t.e = new PIXI.Graphics();
        t.src = src;
        t.dest = dest;
        var color = edgeColor();
        var opacity = 0;

        function draw() {
            t.e.clear();
            t.e.lineStyle(edgeWidth, color, opacity);
            t.e.moveTo(vertices[t.src].x, vertices[t.src].y);
            t.e.lineTo(vertices[t.dest].x, vertices[t.dest].y);
        }

        t.moveFrame = function() {
            var srcV = vertices[t.src];
            var destV = vertices[t.dest];
            var length = Math.sqrt(Math.pow(destV.x-srcV.x, 2)+Math.pow(destV.y-srcV.y, 2));
            if (length > edgeThresh) {
                opacity = 0;
                t.e.clear();
            } else {
                opacity = (edgeThresh-length)/edgeThresh;
                draw();
            }
        }

        draw();
    }

    function addEdge() {
        var srcVert = chooseNewEdgeSrc();
        var destVert = chooseNewEdgeDest(srcVert);
        numEdges++;
        var edge = new Edge(srcVert, destVert);
        vertices[srcVert].showVertex();
        vertices[destVert].showVertex();
        graph.addChild(edge.e);
        edges.push(edge);
        adjMatrix[srcVert].add(destVert);
        adjMatrix[destVert].add(srcVert);
    }

    function moveAll() {
        for (var i in vertices) {
            vertices[i].moveFrame();
        }

        for (var i in edges) {
            edges[i].moveFrame();
        }
    }

    function draw() {
        if (!stopped) {
            requestAnimationFrame(draw);
        }
        if (!paused) {
            if (numEdges < maxNumEdges) {
                addEdge();
            }
            moveAll();
            renderer.render(graph);
        }
    }


    t.start = function() {
        if (stopped) {
            stopped = false;
            placeVertices();
            draw();
        }
    }

    t.pause = function() {
        if (!stopped) {
            paused = true;
        }
    }

    t.unpause = function() {
        if (!stopped) {
            paused = false;
        }
    }

    t.end = function() {
        // remove variables associated with children
        graph.removeChildren();
        stopped = true;
    }
}
