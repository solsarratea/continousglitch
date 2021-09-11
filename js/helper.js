

var screenshot =  document.getElementById("screenshot");
screenshot.onclick = function(event){

    var aCanvas = document.getElementById("glCanvas");
    console.log(aCanvas)
    var ctx =  aCanvas.getContext("webgl2", {preserveDrawingBuffer: true});
    ;
    aCanvas.toBlob( function(blob)
                    {
                        var d = new Date();
                        var fName = d.getFullYear()+"_"+d.getMonth()+"_"+d.getDate()+"_"+
                            d.getHours()+"_"+d.getMinutes()+"_"+d.getSeconds();

                        saveAs(blob, "continous-glitch"+fName+".png");
                    });

};
