var NS = "http://www.w3.org/2000/svg";
//---button---
function findIntersect() {
	if (
		elem1Select.selectedIndex != 0 &&
		elem2Select.selectedIndex != 0 &&
		elem1Select.selectedIndex != elem2Select.selectedIndex
	) {
		var elem1 = elem1Select.options[elem1Select.selectedIndex].value;
		var myElem1 = document.getElementById(elem1);
		var elem2 = elem2Select.options[elem2Select.selectedIndex].value;
		var myElem2 = document.getElementById(elem2);

		//---clear previous intersect circles---
		for (var k = intersectG.childNodes.length - 1; k >= 0; k--)
			intersectG.removeChild(intersectG.childNodes.item(k));

		//----fade all elems except requested----
		for (var k = 0; k < mySVG.childNodes.length; k++) {
			if (mySVG.childNodes.item(k).nodeName != "#text")
				mySVG.childNodes.item(k).setAttribute("opacity", 1);
			if (
				mySVG.childNodes.item(k).nodeName != "#text" &&
				mySVG.childNodes.item(k).nodeName != "g" &&
				mySVG.childNodes.item(k).nodeName != myElem1.nodeName &&
				mySVG.childNodes.item(k).nodeName != myElem2.nodeName
			)
				mySVG.childNodes.item(k).setAttribute("opacity", 0.2);
		}

		//============elem1======================
		if (myElem1.nodeName == "circle") circle2Polygon(myCircle, polygon1);
		else if (myElem1.nodeName == "rect") rect2Polygon(myRect, polygon1);
		else if (myElem1.nodeName == "ellipse")
			ellipse2Polygon(myEllipse, polygon1);
		else if (myElem1.nodeName == "line") line2Polygon(myLine, polygon1);
		else if (myElem1.nodeName == "path") path2Polygon(myPath, polygon1);
		else if (myElem1.nodeName == "polygon")
			polygon2Polygon(myPolygon, polygon1);
		else if (myElem1.nodeName == "text") text2Polygon(myText, polygon1);
		else if (myElem1.nodeName == "polyline")
			polyline2Pgons(myPolyline, polygon1); //---creates polygon for each leg---

		if (myElem1.nodeName == "path") {
			//---is path closed? ---
			var pntStng = myPath.getAttribute("d");
			if (pntStng.indexOf("z") != -1 || pntStng.indexOf("Z") != -1)
				var shape1 = "path";
			else var shape1 = "pathOpen";
			//---is this a linear or smooth path?---
			var pathStng = myPath.getAttribute("d").toLowerCase();
			if (
				//---smooth path--
				pathStng.indexOf("c") != -1 ||
				pathStng.indexOf("q") != -1 ||
				pathStng.indexOf("t") != -1 ||
				pathStng.indexOf("q") != -1 ||
				pathStng.indexOf("s") != -1 ||
				pathStng.indexOf("a") != -1
			)
				shape1 += "Smooth";
		} else var shape1 = myElem1.nodeName;

		//================elem2===============
		if (myElem2.nodeName == "circle") circle2Polygon(myCircle, polygon2);
		else if (myElem2.nodeName == "rect") rect2Polygon(myRect, polygon2);
		else if (myElem2.nodeName == "ellipse")
			ellipse2Polygon(myEllipse, polygon2);
		else if (myElem2.nodeName == "line") line2Polygon(myLine, polygon2);
		else if (myElem2.nodeName == "path") path2Polygon(myPath, polygon2);
		else if (myElem2.nodeName == "polygon")
			polygon2Polygon(myPolygon, polygon2);
		else if (myElem2.nodeName == "text") text2Polygon(myText, polygon2);
		else if (myElem2.nodeName == "polyline")
			polyline2Pgons(myPolyline, polygon2); //---creates polygon for each leg---

		if (myElem2.nodeName == "path") {
			//---is path closed ---
			var pntStng = myPath.getAttribute("d");
			if (pntStng.indexOf("z") != -1 || pntStng.indexOf("Z") != -1)
				var shape2 = "path";
			else var shape2 = "pathOpen";

			//---is this a linear or smooth path?---
			var pathStng = myPath.getAttribute("d").toLowerCase();
			if (
				//---smooth path--
				pathStng.indexOf("c") != -1 ||
				pathStng.indexOf("q") != -1 ||
				pathStng.indexOf("t") != -1 ||
				pathStng.indexOf("q") != -1 ||
				pathStng.indexOf("s") != -1 ||
				pathStng.indexOf("a") != -1
			)
				shape2 += "Smooth";
		} else var shape2 = myElem2.nodeName;

		if (shape1 != "polyline" && shape2 != "polyline") {
			var intersections = getPolygonIntersect(
				polygon1,
				polygon2,
				shape1,
				shape2,
			);

			//---show intersect points---
			for (var k = 0; k < intersections.length; k++) {
				var intPnt = intersections[k];
				var intersectPnt = document.createElementNS(NS, "circle");
				intersectPnt.setAttribute("fill", "red");
				intersectPnt.setAttribute("stroke", "none");
				intersectPnt.setAttribute("r", "3");
				intersectPnt.setAttribute("cx", intPnt[0]);
				intersectPnt.setAttribute("cy", intPnt[1]);
				intersectG.appendChild(intersectPnt);
			}

			if (intersections.length == 0) falseSpan.innerHTML = "false";
			else falseSpan.innerHTML = "(" + intersections.length + " points)";
		} else {
			if (shape1 == "polyline") PolylineShape = shape2;
			else PolylineShape = shape1;
			//---build a polygon for each leg---
			getPolylinePgonsIntersect();
		}
	}
}
function getPolygonIntersect(polygonA, polygonB, shapeA, shapeB) {
	var IntPoints = [];
	var aPoints = polygonA.points;

	var m = aPoints.numberOfItems;
	//---ignore 'close' leg of polygon---
	if (shapeA == "line" || shapeA == "pathOpen" || shapeA == "pathOpenSmooth")
		minusA = -1;
	else minusA = 0;

	for (var i = 0; i < m + minusA; i++) {
		var aX1 = aPoints.getItem(i).x;
		var aY1 = aPoints.getItem(i).y;

		if (i < m - 1) {
			var aX2 = aPoints.getItem(i + 1).x;
			var aY2 = aPoints.getItem(i + 1).y;
		} else {
			var aX2 = aPoints.getItem(0).x;
			var aY2 = aPoints.getItem(0).y;
		}

		var bPoints = polygonB.points;
		var n = bPoints.numberOfItems;

		//---ignore 'close' leg of polygon---
		if (shapeB == "line" || shapeB == "pathOpen" || shapeB == "pathOpenSmooth")
			minusB = -1;
		else minusB = 0;

		for (
			var k = 0;
			k < n + minusB;
			k++ //--each side of polygon---
		) {
			var bX1 = bPoints.getItem(k).x;
			var bY1 = bPoints.getItem(k).y;

			if (k < n - 1) {
				var bX2 = bPoints.getItem(k + 1).x;
				var bY2 = bPoints.getItem(k + 1).y;
			} else {
				var bX2 = bPoints.getItem(0).x;
				var bY2 = bPoints.getItem(0).y;
			}
			//---return false or intersect point---
			var xy = lineSegIntersect(aX1, aY1, aX2, aY2, bX1, bY1, bX2, bY2);
			if (xy) {
				if (IntPoints.join().indexOf(xy) == -1) {
					//--no dups--
					IntPoints.push(xy);
				}
			}
		}
	}

	return IntPoints;
}
//---polyline Pgons--------------
function getPolylinePgonsIntersect() {
	/*   //---preset globals---
        var PolylinePgons=[]
        var PolylineShape //---other shape compared to the polyline--
    */
	if (PolylineIntersectPolygon == polygon1) var polygonB = polygon2;
	else var polygonB = polygon1;

	var intersections = 0;
	for (var j = 0; j < PolylinePgons.length; j++) {
		var polygonA = PolylinePgons[j];
		var IntPoints = [];
		var aPoints = polygonA.points;

		var m = aPoints.numberOfItems;

		for (var i = 0; i < m - 1; i++) {
			var aX1 = aPoints.getItem(i).x;
			var aY1 = aPoints.getItem(i).y;

			if (i < m - 1) {
				var aX2 = aPoints.getItem(i + 1).x;
				var aY2 = aPoints.getItem(i + 1).y;
			} else {
				var aX2 = aPoints.getItem(0).x;
				var aY2 = aPoints.getItem(0).y;
			}

			var bPoints = polygonB.points;
			var n = bPoints.numberOfItems;

			//---ignore 'close' leg of polygon---
			if (
				PolylineShape == "line" ||
				PolylineShape == "pathOpen" ||
				PolylineShape == "pathOpenSmooth"
			)
				minusB = -1;
			else minusB = 0;

			for (
				var k = 0;
				k < n + minusB;
				k++ //--each side of polygon---
			) {
				var bX1 = bPoints.getItem(k).x;
				var bY1 = bPoints.getItem(k).y;

				if (k < n - 1) {
					var bX2 = bPoints.getItem(k + 1).x;
					var bY2 = bPoints.getItem(k + 1).y;
				} else {
					var bX2 = bPoints.getItem(0).x;
					var bY2 = bPoints.getItem(0).y;
				}
				//---return false or intersect point---
				var xy = lineSegIntersect(aX1, aY1, aX2, aY2, bX1, bY1, bX2, bY2);
				if (xy) {
					if (IntPoints.join().indexOf(xy) == -1) {
						//--no dups--
						IntPoints.push(xy);
					}
				}
			}
		}
		if (IntPoints.length > 0) {
			//---show intersect points---
			for (var z = 0; z < IntPoints.length; z++) {
				var intPnt = IntPoints[z];
				var intersectPnt = document.createElementNS(NS, "circle");
				intersectPnt.setAttribute("fill", "red");
				intersectPnt.setAttribute("stroke", "none");
				intersectPnt.setAttribute("r", "3");
				intersectPnt.setAttribute("cx", intPnt[0]);
				intersectPnt.setAttribute("cy", intPnt[1]);
				intersectG.appendChild(intersectPnt);
			}

			intersections += IntPoints.length;
		}
	}

	if (intersections == 0) falseSpan.innerHTML = "false";
	else falseSpan.innerHTML = "(" + intersections + " points)";
}

//---compare two lines: A.B---
function lineSegIntersect(aX1, aY1, aX2, aY2, bX1, bY1, bX2, bY2) {
	//---compute vectors Va, Vb--------
	var Va =
		((bX2 - bX1) * (aY1 - bY1) - (bY2 - bY1) * (aX1 - bX1)) /
		((bY2 - bY1) * (aX2 - aX1) - (bX2 - bX1) * (aY2 - aY1));
	var Vb =
		((aX2 - aX1) * (aY1 - bY1) - (aY2 - aY1) * (aX1 - bX1)) /
		((bY2 - bY1) * (aX2 - aX1) - (bX2 - bX1) * (aY2 - aY1));

	if (Va > 0 && Va < 1 && Vb > 0 && Vb < 1) {
		//---intersect true, show point---
		var ma = (aY2 - aY1) / (aX2 - aX1);
		var mb = (bY2 - bY1) / (bX2 - bX1);
		if (aX2 != aX1 && bX2 != bX1) {
			//---!vertical line---
			var x = (aX1 * ma - aY1 - bX1 * mb + bY1) / (ma - mb);
			var y = ma * (x - aX1) + aY1;
		} else if (aX2 == aX1) {
			var x = aX1;
			var y = mb * (x - bX1) + bY1;
		} else if (bX2 == bX1) {
			var x = bX1;
			var y = ma * (x - aX1) + aY1;
		}
		return [x, y];
	} else return false;
}

//=============Elements to Polygons===================
function polygon2Polygon(myPolygon, intersectPolygon) {
	var myPoints = intersectPolygon.points;
	myPoints.clear();

	intersectPolygon.setAttribute("points", myPolygon.getAttribute("points"));

	if (myPolygon.getAttribute("transform")) {
		var trfm = myPolygon.getAttribute("transform");
		intersectPolygon.setAttribute("transform", trfm);
		ctmPolygon(intersectPolygon);
	}
}

function path2Polygon(myPath, intersectPolygon) {
	var myPoints = intersectPolygon.points;
	myPoints.clear();

	//---is path closed?---
	var d = myPath.getAttribute("d");
	var Z = "";
	if (d.indexOf("z") != -1) Z = "z";
	if (d.indexOf("Z") != -1) Z = "Z";

	if (Z == "z" || Z == "Z") {
		d = d.replace(Z, "");
		var tempPath = document.createElementNS(NS, "path");
		tempPath.setAttribute("d", d);
		var endLength = tempPath.getTotalLength();
	} else var endLength = myPath.getTotalLength();

	var pathStng = myPath.getAttribute("d").toLowerCase();
	if (
		//---smooth path--
		pathStng.indexOf("c") != -1 ||
		pathStng.indexOf("q") != -1 ||
		pathStng.indexOf("t") != -1 ||
		pathStng.indexOf("q") != -1 ||
		pathStng.indexOf("s") != -1 ||
		pathStng.indexOf("a") != -1
	)
		var pathSmooth = true;
	else var pathSmooth = false;

	if (pathSmooth) {
		var segCnt = +mySVG.getAttribute("width"); //---use svg width---

		var pntList = intersectPolygon.points;
		var lengthDelta = endLength / segCnt;

		var pntList = intersectPolygon.points;
		for (var k = 0; k < segCnt; k++) {
			var len = lengthDelta * k;
			if (len < endLength) {
				var pnt = myPath.getPointAtLength(len);
				pntList.appendItem(pnt);
			} else break;
		}
	} //---straight path: create a polygon---
	else {
		var len = myPath.getTotalLength();
		var p = myPath.getPointAtLength(0);
		var seg = myPath.getPathSegAtLength(0);
		var pnts = p.x + "," + p.y;

		for (var i = 1; i < len; i++) {
			p = myPath.getPointAtLength(i);

			if (myPath.getPathSegAtLength(i) > seg) {
				pnts = pnts + " " + p.x + "," + p.y;
				seg = myPath.getPathSegAtLength(i);
			}
		}
		intersectPolygon.setAttribute("points", pnts);
	}

	if (myPath.getAttribute("transform")) {
		intersectPolygon.setAttribute(
			"transform",
			myPath.getAttribute("transform"),
		);
		ctmPolygon(intersectPolygon);
	}
}

function rect2Polygon(myRect, intersectPolygon) {
	var myPoints = intersectPolygon.points;
	myPoints.clear();

	var x = +myRect.getAttribute("x");
	var y = +myRect.getAttribute("y");
	var w = +myRect.getAttribute("width");
	var h = +myRect.getAttribute("height");
	var pnts1 = [x, y, x, y + h, x + w, y + h, x + w, y];
	intersectPolygon.setAttribute("points", pnts1.join());

	if (myRect.getAttribute("transform")) {
		intersectPolygon.setAttribute(
			"transform",
			myRect.getAttribute("transform"),
		);
		ctmPolygon(intersectPolygon);
	}
}

function circle2Polygon(myCircle, intersectPolygon) {
	var myPoints = intersectPolygon.points;
	myPoints.clear();

	var r = +myCircle.getAttribute("r");
	var cx = +myCircle.getAttribute("cx");
	var cy = +myCircle.getAttribute("cy");

	var vCnt = +mySVG.getAttribute("width"); //---use svg width---
	var polyXPts = Array(vCnt);
	var polyYPts = Array(vCnt);
	var vertexAngle = 360 / vCnt;
	//---init polygon points processor---
	for (var v = 0; v < vCnt; v++) {
		var theAngle = (v * vertexAngle * Math.PI) / 180;
		polyXPts[v] = r * Math.cos(theAngle);
		polyYPts[v] = -r * Math.sin(theAngle);
	}

	for (var v = 0; v < vCnt; v++) {
		var point = mySVG.createSVGPoint();
		point.x = cx + polyXPts[v];
		point.y = cy + polyYPts[v];
		myPoints.appendItem(point);
	}

	if (myCircle.getAttribute("transform")) {
		var trfm = myCircle.getAttribute("transform");
		intersectPolygon.setAttribute("transform", trfm);
		ctmPolygon(intersectPolygon);
	}
}

function line2Polygon(myLine, intersectPolygon) {
	//---
	var myPoints = intersectPolygon.points;
	myPoints.clear();

	var x1 = +myLine.getAttribute("x1");
	var y1 = +myLine.getAttribute("y1");
	var x2 = +myLine.getAttribute("x2");
	var y2 = +myLine.getAttribute("y2");

	var pnts1 = [x1, y1, x2, y2];
	intersectPolygon.setAttribute("points", pnts1.join());

	if (myLine.getAttribute("transform")) {
		var trfm = myLine.getAttribute("transform");
		intersectPolygon.setAttribute("transform", trfm);
		ctmPolygon(intersectPolygon);
	}
}

/*
     the polyline is separated into individual
     polygons for each leg
 */
var PolylinePgons = [];
var PolylineIntersectPolygon;
var PolylineShape; //---other shape compared to the polyline--
function polyline2Pgons(myPolyline, intersectPolygon) {
	//---
	PolylineIntersectPolygon = intersectPolygon;
	var myPoints = intersectPolygon.points;
	myPoints.clear();

	PolylinePgons = [];

	var points = myPolyline.points;
	pointsArray = [];
	for (var k = 0; k < points.length; k++) {
		if (k < points.length - 1) {
			var xy1 = points[k];
			var xy2 = points[k + 1];
			pnts = [xy1.x, xy1.y, xy2.x, xy2.y];
			//---create a polygon for each leg---
			var pgon = document.createElementNS(NS, "polygon");
			pgon.setAttribute("points", pnts.join());

			if (myPolyline.getAttribute("transform")) {
				//---temp place in svg---
				myPolyline.ownerSVGElement.appendChild(pgon);

				var trfm = myPolyline.getAttribute("transform");
				pgon.setAttribute("transform", trfm);
				ctmPolygon(pgon);

				//---remove temp polygon---
				myPolyline.ownerSVGElement.removeChild(pgon);
			}
			PolylinePgons.push(pgon);
		}
	}
}
function ellipse2Polygon(myEllipse, intersectPolygon) {
	//---
	var myPoints = intersectPolygon.points;
	myPoints.clear();

	var rx = +myEllipse.getAttribute("rx");
	var ry = +myEllipse.getAttribute("ry");
	var cx = +myEllipse.getAttribute("cx");
	var cy = +myEllipse.getAttribute("cy");

	var vCnt = +mySVG.getAttribute("width"); //---use svg width------
	var polyXPts = Array(vCnt);
	var polyYPts = Array(vCnt);
	var vertexAngle = 360 / vCnt;
	//---init polygon points processor---
	for (var v = 0; v < vCnt; v++) {
		var theAngle = (v * vertexAngle * Math.PI) / 180;
		polyXPts[v] = rx * Math.cos(theAngle);
		polyYPts[v] = -ry * Math.sin(theAngle);
	}

	for (var v = 0; v < vCnt; v++) {
		var point = mySVG.createSVGPoint();
		point.x = cx + polyXPts[v];
		point.y = cy + polyYPts[v];
		myPoints.appendItem(point);
	}

	if (myEllipse.getAttribute("transform")) {
		var trfm = myEllipse.getAttribute("transform");
		intersectPolygon.setAttribute("transform", trfm);
		ctmPolygon(intersectPolygon);
	}
}

function text2Polygon(myText, intersectPolygon) {
	var myPoints = intersectPolygon.points;
	myPoints.clear();
	//---create a polygon around text---
	var bb1 = myText.getBBox();
	var bb1x = bb1.x;
	var bb1y = bb1.y;
	var bb1w = bb1.width;
	var bb1h = bb1.height;
	var pnts1 = [
		bb1x,
		bb1y,
		bb1x,
		bb1y + bb1h,
		bb1x + bb1w,
		bb1y + bb1h,
		bb1x + bb1w,
		bb1y,
	];
	intersectPolygon.setAttribute("points", pnts1.join());

	if (myText.getAttribute("transform")) {
		intersectPolygon.setAttribute(
			"transform",
			myText.getAttribute("transform"),
		);
		ctmPolygon(intersectPolygon);
	}
}
//================================================================================

//---remove transform, create screen points for polygon---
function ctmPolygon(myPoly) {
	var ctm = myPoly.getCTM();
	var svgRoot = myPoly.ownerSVGElement;

	var pointsList = myPoly.points;
	var n = pointsList.numberOfItems;

	for (var m = 0; m < n; m++) {
		var mySVGPoint = svgRoot.createSVGPoint();
		mySVGPoint.x = pointsList.getItem(m).x;
		mySVGPoint.y = pointsList.getItem(m).y;
		mySVGPointTrans = mySVGPoint.matrixTransform(ctm);
		pointsList.getItem(m).x = mySVGPointTrans.x;
		pointsList.getItem(m).y = mySVGPointTrans.y;
	}

	myPoly.removeAttribute("transform");
}
