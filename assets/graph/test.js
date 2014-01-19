

function beginLog(msg){
    console.log(msg);
}
function endLog(msg){
    console.log(msg);
}
function nlog(msg){
    console.log(msg);
}


//function getDummyJsonString(){
//    
//    var result = new Object();
//    result['graphType'] = 0;
//    result['dateIntervalType'] = 0;
//    var now = new Date();
//    now = new Date(now.getYear()+1900, now.getMonth(), now.getDate());
//    
//    result['targetLineBeginDate'] = now.getTime();
//    result['targetLineEndDate'] = new Date().setDate(now.getDate() + 1);
//    result['graphDataType'] = 1;
//    result['graphDatas'] = getDummyCalorie(now);
//
//    return JSON.stringify(result);
//}
//
//
//function getDummyWeight(now)
//{
//    function getDay(day,now){
//        var d = new Date(now);
//        d.setFullYear(d.getFullYear()-1);
//        d.setDate(day);
//        return d.getTime();
//    };
//    
//    var data = new Array;
//    for(var i=0; i<365; ++i){
//        var weight = Math.floor(Math.random()*140) + 20;
//        data[i] = [ getDay(i,now), weight ];
//    }
//    return data;
//}
//
//function getDummyFat(now)
//{
//    function getDay(day,now){
//        var d = new Date(now);
//        d.setFullYear(d.getFullYear()-1);
//        d.setDate(day);
//        return d.getTime();
//    };
//    
//    var data = new Array;
//    for(var i=0; i<365; ++i){
//        var weight = Math.floor(Math.random()*1000) / 10;
//        data[i] = [ getDay(i,now), weight ];
//    }
//    return data;
//}
//
//function getDummyCalorie(now)
//{
//    var days = new Array;
//    var currentDay = new Date(now);
//    currentDay.setFullYear( currentDay.getFullYear()-1 );
//    for(var i =0; i < 365; ++i){
////        days[i] = new Date(currentDay);
//        days[i] = new Date(currentDay).getTime();
//        currentDay.setDate( currentDay.getDate() + 1);
//    }
//
//    var color = 'pink';
//    var data = new Array;
//    for(var i=0; i<365; i++){
//        var weight = Math.floor(Math.random()*90000) / 10;
//        data[i] = new Object;
//        data[i] = { color : color, x : days[i], y : weight};
//    }
//    
//    return data;
//}
//
//
//function getMinMaxAvg(datas, isMap)
//{
//    var min = Number.MAX_VALUE;
//    var max = 0;
//    var avg = 0;
//    
//    var len = datas.length;
//    for(var i = 0; i < len; ++i){
//        var data;
//        if(isMap){
//            data = datas[i]['y'];
//        }else{
//            data = datas[i][1];
//        }
//        
//        min = Math.min(min, data);
//        max = Math.max(max, data);
//        avg += data;
//    }
//    avg = avg / len;
//    avg = avg.toFixed(1);
//    
//    return {
//        'min' : min,
//        'max' : max,
//        'avg' : avg        
//    };    
//}